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

const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/chatUsers');
const { User, getUserByUsername, getUserByTokenAndConfirm, verifyPassword } = require('./utils/Users.js')

const { sendConfirmEmail } = require('./mailer/confirmEmail.js');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


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
//Connect to mongodb
mongoose.connect("mongodb://localhost:27017/FantasyDB")
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('error:', err);
});


//POST login
app.post('/login', async (req, res) => {
    const { loginUsername, loginPassword } = req.body;
  
    try {
      const user = await getUserByUsername(loginUsername);
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
  
      // Check if the user is confirmed
      if (!user.confirmed) {
        return res.status(401).json({ message: 'User not confirmed email' });
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
    const { username, email, password, id, confirmed, confirmationToken, confirmationLink } = req.body;

    try{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, password: hashedPassword, id, confirmed, confirmationToken});
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);

        sendConfirmEmail(username, email, password, confirmationLink)
        .catch(e => console.log(e));
        
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Internal server error');
    }
});

const router = express.Router();
router.get('/confirm-email/:token', async (req, res) => {
    const token = req.params.token;
    try {
        const user = await getUserByTokenAndConfirm(token);
        if (user) {
            // Redirect the user to a confirmation success page
            res.redirect('/login.html');
        } else {
            // Handle case where user is not found or confirmation fails
            res.status(404).send('Confirmation failed. User not found.');
        }
    } catch (error) {
        console.error('Confirmation error:', error);
        res.status(500).send('Internal server error');
    }
});

app.use('/confirmation', router);


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));