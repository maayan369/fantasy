const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
// const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/chatUsers');


const app = express();
const server = http.createServer(app);
const io = socketio(server); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//Set static folder
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

//connect to mongodb
mongoose.connect("mongodb://localhost:27017/FantasyDB")
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('error:', err);
});


//add data (schema)
const userSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String,
});

const User = new mongoose.model('User', userSchema);

//POST
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try{
        const newUser = new User({ username, email, password});
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Internal server error');
    }
 });



const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));