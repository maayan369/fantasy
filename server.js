const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { main } = require('./mailer/confirmEmail.js');

main()
.catch(e => console.log(e));

const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/chatUsers');
// const appRoute = require('./route/route.js')

const app = express();
const server = http.createServer(app);
const io = socketio(server); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//Set static folder
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/api', appRoute);

const botName = 'ChatCord Bot'

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // welcome current user
        socket.emit('message', formatMessage(botName, 'welcome to chatcord!'));

        // broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });


    });
 
    // listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // run when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                chatUsers: getRoomUsers(user.room)
            });
        }
    });

});

//לא יודעת אם צריך:
// useNewUrlParser: true,
// useUnifiedTopology: true,

//connect to mongodb
mongoose.connect("mongodb://localhost:27017/FantasyDB")
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('error:', err);
});


//add data (schema) need to add the confirm thing and change to false
const userSchema = new mongoose.Schema({
    id: String,
    email: String,
    username: String,
    password: String,
    // emailConfirmationToken: String,
    confirmed: {
        type: Boolean,
        default: false,
    }
});

const User = new mongoose.model('User', userSchema);

// Function to retrieve a user by username
async function getUserByUsername(username) {
    try {
      const user = await User.findOne({ username });
      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
};

// Function to verify password
async function verifyPassword(password, hashedPassword) {
    try {
      const passwordMatch = await bcrypt.compare(password, hashedPassword);
      return passwordMatch;
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
};

//POST login
app.post('/login', async (req, res) => {
    const { loginUsername, loginPassword } = req.body;
  
    try {
      // Retrieve the user from the database based on the username
      const user = await getUserByUsername(loginUsername);
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
  
      // Check if the user is confirmed
      if (!user.confirmed) {
        return res.status(401).json({ message: 'User not confirmed' });
      }
  
      // Verify the password
      const passwordMatch = await verifyPassword(loginPassword, user.password);
  
      if (passwordMatch) {
        // Passwords match - handle successful login
        return res.status(200).json({ message: 'Login successful' });
      } else {
        // Passwords do not match - handle invalid credentials
        return res.status(401).json({ message: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).send('Internal server error');
    }
  });

//POST signup
app.post('/signup', async (req, res) => {
    const { username, email, password, id, confirmed } = req.body;

    try{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, password: hashedPassword, id, confirmed});
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
        
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Internal server error');
    }
 });


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));