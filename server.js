const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server); 

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot'

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        console.log(username, room);

        socket.join(user.room);

        // welcome current user
        socket.emit('message', formatMessage(botName, 'welcome to chatcord!'));

        // broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

    });
 
    // listen for chatMessage
    socket.on('chatMessage', (msg) => {
        io.emit('message', formatMessage('USER', msg));
    });

    // run when client disconnects
    socket.on('disconnect', () => {
        io.emit('message', formatMessage(botName, 'a user has left the chat'));
    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));