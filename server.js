const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server); 

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const confirmationRouter = require('./routes/confirmationRoute.js')

const { User, getUserByUsername, verifyPassword, getUserById, getUserByTabIdInUse } = require('./utils/Users.js')
// const { generateTabId } = require('./utils/currentUser.js')

const { sendConfirmEmail } = require('./mailer/confirmEmail.js');

const cookieParser = require('cookie-parser');
const { Console } = require('console');
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
  currentUsername: String,  // Corrected field name
  currentUserId: String,
  loginTime: Date,
  previousTabId: String,
});


const TabData = mongoose.model('TabData', TabDataSchema);


var Socket_Connected_Users_List = {};
var Players_List = {};
const activeSessions = {}; 


var Player = function(id, username, tabId) {
  var self = {
    x: 700,
    y: 700,
    tabId: tabId,
    username: username,
    targetX: 700,
    targetY: 700,
    speed: 3,
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
      x: player.x,
      y: player.y,
      username: player.username,
    });
  }
  for (var tabId in Socket_Connected_Users_List) {
    var socket = Socket_Connected_Users_List[tabId];
    socket.emit('newPositions', pack);
  }
}, 100 / 25);



io.on('connection', async (socket) => {
  console.log('Socket login successful');
  const tabId = socket.handshake.query.tabId;
  socket.tabId = tabId ? tabId : null;
  const currentTabdata = await TabData.findOne({ tabId: socket.tabId });
  const username = currentTabdata ? currentTabdata.currentUsername : null;
  socket.username = username;
  const previousTabId = currentTabdata ? currentTabdata.previousTabId : null;


  if (!socket.username) {
    console.log('No username provided. Redirecting to login.');
    socket.emit('redirectLogin'); 
    return;
  }

  if (previousTabId) {
    io.to(activeSessions[previousTabId]).emit('forceDisconnect');
    delete Socket_Connected_Users_List[previousTabId];
    delete Players_List[previousTabId]; // Delete the player for the previous tab
    await TabData.deleteOne({ tabId: previousTabId });
  };

  activeSessions[tabId] = socket.id;

  Socket_Connected_Users_List[tabId] = socket;
  var player = Player(tabId, socket.username, socket.tabId);
  Players_List[tabId] = player;
  
  socket.on('disconnect', async () => {
    delete Socket_Connected_Users_List[tabId];
    delete Players_List[tabId];
    delete activeSessions[tabId]; 

    try {
      const currentTabdata = await TabData.findOne({ tabId: socket.tabId });
      const currentUser = await getUserByUsername(currentTabdata.currentUsername);

      if (currentUser && currentTabdata) {
        currentTabdata.isLoggedIn = false;
        await currentTabdata.save();
        console.log(`Tab data for ${socket.tabId} will be deleted.`);
        // Set a timeout to delete tab data after 120 seconds if not changed back to true
        setTimeout(async () => {
          const updatedTabData = await TabData.findOne({ tabId: socket.tabId });

          if (updatedTabData && !updatedTabData.isLoggedIn) {
            await TabData.deleteOne({ tabId: socket.tabId });
          }
        }, 120000); // 120 seconds
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  });
  

  socket.on('clickPosition', (data) => {
    player.targetX = data.x;
    player.targetY = data.y;
  });
});





// Serve JavaScript files directly from areas/js directory
app.use('/js', express.static(path.join(__dirname, 'public', 'areas', 'js')));

// Serve media files directly from areas/media directory
app.use('/areas/media', express.static(path.join(__dirname, 'public', 'areas', 'media')));


const checkLoginStatus = async (req, res, next) => {
  const requestedUrl = req.originalUrl;
   // Exclude /media route from triggering login check
   if (requestedUrl.startsWith('/areas/media')) {
    return next(); // Skip login check for /media route
  }
  // Exclude /media route from triggering login check
  if (requestedUrl.startsWith('/areas/js')) {
    return next(); // Skip login check for /media route
  }

  const tabid = req.params.tabid;
  console.log(tabid);
  const currentTabdata = await TabData.findOne({ tabId: tabid });

  // Rest of your logic to check login status...

  if (!currentTabdata) {
      console.log('tab data does not exist');
      return res.redirect('/login.html');
  }   

  // if (currentTabdata.isLoggedIn) {
  //   console.log('already logged in');
  //   return res.redirect('/login.html');
  // }

  const currentUserUsername = currentTabdata.currentUsername;
  const currentUser = await getUserByUsername(currentUserUsername);

  if (currentUser.tabIdInUse !== tabid) {
    console.log('user logined from somewhere else');
    return res.redirect('/login.html');
  }

  // Continue with next middleware if needed
  next();
};


// Route for serving files after login status check
app.get('/areas/:tabid/:filename', checkLoginStatus, async (req, res) => {
  const tabid = req.params.tabid;
  const filename = req.params.filename;
  
  const currentTabdata = await TabData.findOne({ tabId: tabid });
  if (currentTabdata) {
    currentTabdata.isLoggedIn = true;
    await currentTabdata.save();
  }

  const filePath = path.join(__dirname, 'public', 'areas', filename);
  res.sendFile(filePath);
});

// // Serve static files separately except media and JavaScript
app.use(express.static(path.join(__dirname, 'public')));




//POST login LOGIN LOGIN LOGIN
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


    // if(existingSession) {
    //   await TabData.deleteOne({ _id: existingSession._id  });
    // }

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
      console.log('logout from somewhere alse');
      user.tabIdInUse = currentTabId;
      await user.save();
    }

    res.status(200).json({ message: 'Login successful' });
    // res.redirect('areas/thePalace.html');

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal server error');
  }
});



// POST logout (change the session again)
app.post('/logout', async (req, res) => {
  const { currentTabId } = req.body;

  try {
    // Find the current user and tab data associated with the currentTabId
    const currentTabdata = await TabData.findOne({ tabId: currentTabId });
    const currentUser = await getUserByUsername(currentTabdata.currentUsername);


    if (currentUser && currentTabdata) {
      // Update the isLoggedIn field to false for the associated tab data
      currentTabdata.isLoggedIn = false;
      await currentTabdata.save();
      console.log(`Tab data for ${currentTabId} will be deleted.`);


      // Set a timeout to delete tab data after 120 seconds if not changed back to true
      setTimeout(async () => {
        const updatedTabData = await TabData.findOne({ tabId: currentTabId });


        if (updatedTabData && !updatedTabData.isLoggedIn) {
          await TabData.deleteOne({ tabId: currentTabId });
        }
      }, 120000); // 120 seconds
    }

    res.status(200).send('Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).send('Internal server error');
  }
});


//POST signup
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