const chatUsers = [];

//join user to chat
function userJoin(id, username, room) {
    const user = { id, username, room };

    chatUsers.push(user);

    return user;
};

// get current user
function getCurrentUser(id) {
    return chatUsers.find(user => user.id === id);
};

//user leaves chat
function userLeave(id) {
    const index = chatUsers.findIndex(user => user.id === id);

    if(index !== -1) {
        return chatUsers.splice(index, 1)[0];
    }
};

// get room Users
function getRoomUsers(room) {
    return chatUsers.filter(user => user.room === room);
}
 
module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    chatUsers
};