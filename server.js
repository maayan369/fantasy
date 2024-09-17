const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketio(server); 

const { User, getUserByUsername, verifyPassword } = require('./utils/Users.js');
const { getRoomFromPath } = require('./utils/Rooms.js');

const confirmationRouter = require('./routes/confirmationRoute.js')
const { sendConfirmEmail } = require('./mailer/confirmEmail.js');

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
  

//Connect to mongodb
mongoose.connect("mongodb://localhost:27017/FantasyDB")
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('error:', err);
});

//Saved information by login, tabData table
const TabDataSchema = new mongoose.Schema({
  tabId: String,
  isLoggedIn: Boolean,
  currentUsername: String,
  currentUserId: String,
  loginTime: Date,
  previousTabId: String,
});
const TabData = mongoose.model('TabData', TabDataSchema);


// ✰★✰★✰★✰★✰★✰★✰★✰  Socket  ✰★✰★✰★✰★✰★✰★✰★✰


//storing the data about the socket object for each player
var Socket_Connected_Users_List = [];
//the list of the players with all the data from Player varible
var Players_List = [];
//container for mapping tabId values to socket.id values only
const activeSessions = [];
// seperate the player list to rooms according to the areas in the URL (in setInterval)
var playersInCurrentRoom = [];

var Player = function(room, username, tabId) {
  //information about the player saves in self
  var self = {
    room: room,
    x: 700,
    y: 700,
    tabId: tabId,
    username: username,
    targetX: 700,
    targetY: 700,
    speed: 3,
    message: '',
    zIndex: 0,
    direction: 'faceDown',
  };
  //the moving function that changes the player position
  self.updatePosition = function() {
    if (self.x !== self.targetX || self.y !== self.targetY) {
      var dx = self.targetX - self.x;
      var dy = self.targetY - self.y;
      var distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > self.speed) {
        var angle = Math.atan2(dy, dx);
        self.x += Math.cos(angle) * self.speed;
        self.y += Math.sin(angle) * self.speed;
      } else {
        self.x = self.targetX;
        self.y = self.targetY;
      }
    }
  };
  return self;
};

//Repeating function, it performes the updatePosition, takes the new information about the users and sends it.
// also create the playersInCurrentRoom array
setInterval(function() {
  var pack = [];
  for (var tabId in Players_List) {
    var player = Players_List[tabId];
    player.updatePosition();
    pack.push({
      room: player.room,
      x: player.x,
      y: player.y,
      username: player.username,
      message: player.message,
      zIndex: player.zIndex,
      direction: player.direction,
    });
  }
  for (var tabId in Players_List) {
    var socket = Socket_Connected_Users_List[tabId];
    socket.emit('newPositions', pack);
    playersInCurrentRoom = Object.values(Players_List).filter(
      (otherPlayer) => otherPlayer.room === socket.room
    );
  }
}, 100 / 25);

// get the player from the Players_List array by its username (tabId = the unique id of players)
function getPlayerByUsername(username) {
  for (const tabId in Players_List) {
    if (Players_List[tabId].username === username) {
      return Players_List[tabId];
    }
  }
  return null;
}


// function when starting socket and other socket functions
io.on('connection', async (socket) => {

  //define the tabID and roomName varibles
  const tabId = socket.handshake.query.tabId;
  const roomName = getRoomFromPath(socket.handshake.headers.referer); 
  socket.room = roomName;

  //condition check if there is tab id else send error
  if (tabId) {
    socket.tabId = tabId;
  } else {
    console.log("No tabId sent during the connection");
    res.status(400).send("Missing tabId");
  };

  //find the user connection data in mongoDb TabData and save username and previousTabId varible
  const currentTabdata = await TabData.findOne({ tabId: socket.tabId });
  const username = currentTabdata ? currentTabdata.currentUsername : null;
  socket.username = username;
  const previousTabId = currentTabdata ? currentTabdata.previousTabId : null;

  //things to prevent problems with login
  if (!currentTabdata) {
    console.log('No tab data provided. Redirecting to login.');
    socket.emit('redirectLogin'); 
    return;
  }
  if (!socket.username) {
    console.log('No username provided. Redirecting to login.');
    socket.emit('redirectLogin'); 
    return;
  }

  //change isLoggedIn stat to true for the currentTabdata in mongo
  if (currentTabdata) {
    currentTabdata.isLoggedIn = true;
    await currentTabdata.save();
  }

  //force disconnection to previousTabId when there is login twice to the same user
  if (previousTabId) {
    io.to(activeSessions[previousTabId]).emit('forceDisconnect');
    delete Socket_Connected_Users_List[previousTabId];
    delete Players_List[previousTabId];
    delete activeSessions[previousTabId];
    await TabData.deleteOne({ tabId: previousTabId });
  };

  //send userData to the self profile
  const currentUser = await getUserByUsername(socket.username);
  socket.emit('userData', {
    name: currentUser.username,
    coins: currentUser.money,
  });

  // create the arrays below
  activeSessions[tabId] = socket.id;
  Socket_Connected_Users_List[tabId] = socket;

  //creating a new player object and adding it to the Players_List
  var player = Player(socket.room, socket.username, socket.tabId);
  Players_List[tabId] = player;

  //join room (area) in socket
  socket.on('joinRoom', (currentRoom) => {
    player.room = currentRoom;
    socket.join(currentRoom);
  });

  //click Position changing the target and the z-index
  socket.on('clickPosition', (data) => {
    updateZIndexFunction(socket.username, playersInCurrentRoom.length);
    player.targetX = data.x;
    player.targetY = data.y;
  });

  //finding player direction
  socket.on('playerDirection', (direction) => {
    player.direction = direction;
  });

  //update the message stat
  let messageUpdateTimeout;
  socket.on('chatMessage', (message) => {
    player.message = message;
  
    clearTimeout(messageUpdateTimeout);
    messageUpdateTimeout = setTimeout(() => {
      player.message = '';
    }, 3000);
  });

  //
  function updateZIndexFunction(username, currentZIndex) {
    const currentPlayerInPlayersList = getPlayerByUsername(username);
    const currentPlayerZIndex = currentPlayerInPlayersList.zIndex;
    for (let i = 0; i < playersInCurrentRoom.length; i++) {
      if (playersInCurrentRoom[i].username !== username) {
        const otherPlayerInTheRoom = playersInCurrentRoom[i];
        const theOtherPlayerUsername = otherPlayerInTheRoom.username;
        const theOtherPlayerInPlayersList = getPlayerByUsername(theOtherPlayerUsername);
        if (theOtherPlayerInPlayersList && otherPlayerInTheRoom.zIndex > currentPlayerZIndex) {
          theOtherPlayerInPlayersList.zIndex -= 1;
        }
      }
    }
    currentPlayerInPlayersList.zIndex = currentZIndex;
    return;
  }

  //
  socket.on('disconnect', async () => {
    // console.log('disconnected');
    updateZIndexFunction(socket.username, playersInCurrentRoom.length);
    delete Socket_Connected_Users_List[tabId];
    delete Players_List[tabId];
    delete activeSessions[tabId];

    if (currentTabdata) {
      try {
        const currentUser = await getUserByUsername(currentTabdata.currentUsername);

        if (currentUser && currentTabdata) {
          currentTabdata.isLoggedIn = false;
          await currentTabdata.save();
          setTimeout(async () => {
            const updatedTabData = await TabData.findOne({ tabId: socket.tabId });

            if (updatedTabData && !updatedTabData.isLoggedIn) {
              await TabData.deleteOne({ tabId: socket.tabId });
            }
          }, 60000);
        }
      } catch (error) {
        console.error('Logout error1:', error);
      }
    }
  });
});

///////

// a way to aproach js,media and css file despite the blockade (??that in another file..??)
app.use('/js', express.static(path.join(__dirname, 'public', 'areas', 'js')));
app.use('/media', express.static(path.join(__dirname, 'public', 'areas', 'media')));
app.use('/css', express.static(path.join(__dirname, 'public', 'areas', 'css')));

app.use(express.static(path.join(__dirname, 'public')));


app.post('/login', async (req, res) => {
  const { loginUsername, loginPassword, currentTabId, timeOfLogin } = req.body;
  const user = await getUserByUsername(loginUsername);

  try {
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!user.confirmed) {
      return res.status(401).json({ message: 'User not confirmed email' });
    }
    
    const passwordMatch = await verifyPassword(loginPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    };


    const newTab = new TabData({
      tabId: currentTabId,
      isLoggedIn: false,
      currentUsername: loginUsername,
      currentUserId: user._id,
      loginTime: timeOfLogin,
      previousTabId: user.tabIdInUse,
    });
    await newTab.save();

    
    if(user.tabIdInUse !== currentTabId) {
      user.tabIdInUse = currentTabId;
      await user.save();
    }

    res.status(200).json({ message: 'Login successful' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal server error');
  }
});


app.post('/logout', async (req, res) => {
  const { currentTabId } = req.body;

  try {
    const currentTabdata = await TabData.findOne({ tabId: currentTabId });
    const currentUser = await getUserByUsername(currentTabdata.currentUsername);


    if (currentUser && currentTabdata) {
      currentTabdata.isLoggedIn = false;
      await currentTabdata.save();
      // console.log(`Tab data for ${currentTabId} will be deleted.`);


      setTimeout(async () => {
        const updatedTabData = await TabData.findOne({ tabId: currentTabId });


        if (updatedTabData && !updatedTabData.isLoggedIn) {
          await TabData.deleteOne({ tabId: currentTabId });
        }
      }, 60000);
    }

    res.status(200).send('Logout successful');
  } catch (error) {
    console.error('Logout error2:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/signup', async (req, res) => {
    const { username, email, password, id, confirmationToken, confirmationLink } = req.body;

    
    try{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, password: hashedPassword, id, confirmed: false, confirmationToken, tabId:'', money: 0});
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);

        sendConfirmEmail(username, email, password, confirmationLink)
        .catch(e => console.log(e));
        
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Internal server error');
    };

});



//Confirm email Route
app.use('/confirmation', confirmationRouter);



// running of the server:
const LOCAL_IP = '192.168.0.108'; // also change at signup and login js, can i save a global varible?
const PORT = process.env.PORT || 3000;

// local only server: server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// ip based server:
server.listen(PORT, LOCAL_IP, () => { console.log(`Server running on ${LOCAL_IP}:${PORT}`); });