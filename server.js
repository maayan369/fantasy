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

// const session = require('express-session');
// const MongoDBStore = require('connect-mongodb-session')(session);

const { User, getUserByUsername, verifyPassword } = require('./utils/Users.js')

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


const TabDataSchema = new mongoose.Schema({
  tabId: String,
  isLoggedIn: Boolean,
  currentUsername: String,
  currentUserId: String,
  loginTime: Date,
  previousTabId: String,
});

const TabData = mongoose.model('TabData', TabDataSchema);

var Socket_Connected_Users_List = {};
var Players_List = {};
var playersInCurrentRoom = {};

function getRoomFromPath(url) {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const room = fileName.split('.')[0];
  return room;
}

var Player = function(room, username, tabId) {
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
  };
  
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
    });
  }
  for (var tabId in Players_List) {
    var socket = Socket_Connected_Users_List[tabId];
    socket.emit('newPositions', pack);
  }
}, 100 / 25);


function getPlayerByUsername(username) {
  for (const tabId in Players_List) {
    if (Players_List[tabId].username === username) {
      return Players_List[tabId];
    }
  }
  return null;
}


io.on('connection', async (socket) => {
  const tabId = socket.handshake.query.tabId;
  const roomName = getRoomFromPath(socket.handshake.headers.referer);
  socket.room = roomName;
  socket.tabId = tabId ? tabId : null;
  const currentTabdata = await TabData.findOne({ tabId: socket.tabId });
  const username = currentTabdata ? currentTabdata.currentUsername : null;
  socket.username = username;
  const previousTabId = currentTabdata ? currentTabdata.previousTabId : null;

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

  if (currentTabdata) {
    currentTabdata.isLoggedIn = true;
    await currentTabdata.save();
  }

  if (previousTabId) {
    io.to(Players_List[previousTabId]).emit('forceDisconnect');
    delete Socket_Connected_Users_List[previousTabId];
    delete Players_List[previousTabId];
    await TabData.deleteOne({ tabId: previousTabId });

    playersInCurrentRoom = Object.values(Players_List).filter(
      (otherPlayer) => otherPlayer.room === socket.room
    );
  };


  Socket_Connected_Users_List[tabId] = socket;
  var player = Player(socket.room, socket.username, socket.tabId);
  Players_List[tabId] = player;

  playersInCurrentRoom = Object.values(Players_List).filter(
    (otherPlayer) => otherPlayer.room === socket.room
  );

  player.zIndex = playersInCurrentRoom.length;

  playersInCurrentRoom = Object.values(Players_List).filter(
    (otherPlayer) => otherPlayer.room === socket.room
  );

  socket.on('joinRoom', (currentRoom) => {
    player.room = currentRoom;
    socket.join(currentRoom);
  });

  function updateZIndexFunction(username, currentZIndex) {
    const currentPlayerInPlayersList = getPlayerByUsername(username);
    const currentPlayerZIndex = currentPlayerInPlayersList.zIndex;

    for (let i = 0; i < playersInCurrentRoom.length; i++) {
      if (playersInCurrentRoom[i].username !== username) {
        const otherPlayerInTheRoom = playersInCurrentRoom[i];
        const theOtherPlayerUsername = otherPlayerInTheRoom.username;
        const theOtherPlayerInPlayersList = getPlayerByUsername(theOtherPlayerUsername);

        if (theOtherPlayerInPlayersList && otherPlayerInTheRoom.zIndex > currentPlayerZIndex) {
          // otherPlayerInTheRoom.zIndex -= 1;
          theOtherPlayerInPlayersList.zIndex -= 1;
        }
      }
    }
    currentPlayerInPlayersList.zIndex = currentZIndex;

    playersInCurrentRoom = Object.values(Players_List).filter(
      (otherPlayer) => otherPlayer.room === socket.room
    );

    return;
  }


  socket.on('disconnect', async () => {
    updateZIndexFunction(socket.username, playersInCurrentRoom.length);
    delete Socket_Connected_Users_List[tabId];
    delete Players_List[tabId];

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
        console.error('Logout error:', error);
      }
    }
  });
  
  

  socket.on('clickPosition', (data) => {
    updateZIndexFunction(socket.username, playersInCurrentRoom.length);

    player.targetX = data.x;
    player.targetY = data.y;
  });
  

  let messageUpdateTimeout;

  socket.on('chatMessage', (message) => {
    player.message = message;
  
    clearTimeout(messageUpdateTimeout);
    messageUpdateTimeout = setTimeout(() => {
      player.message = '';
    }, 3000);
  });

});

///////


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
    console.error('Logout errrror:', error);
    res.status(500).send('Internal server error');
  }
});


app.post('/signup', async (req, res) => {
    const { username, email, password, id, confirmed, confirmationToken, confirmationLink } = req.body;

    try{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, password: hashedPassword, id, confirmed, confirmationToken, tabId:''});
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



const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));