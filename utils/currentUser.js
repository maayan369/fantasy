// const mongoose = require('mongoose');
// // const { User, getUserByUsername } = require('/Users.js')

// const sessionSchema = new mongoose.Schema({
//     currentUserId: String,
//     currentUsername: String,
//     tabId: String,
//     socketId: String,
//     isLoggedIn: Boolean,
// });

// const SessionMDB = new mongoose.model('Session', sessionSchema);

const { v4: uuidv4 } = require('uuid'); // For generating UUIDs
function generateTabId(userId) {
  const timestamp = new Date().getTime(); // Get current timestamp
  const uniqueId = uuidv4(); // Generate a UUID
  const tabId = `${userId}_${timestamp}_${uniqueId}`; // Combine user ID, timestamp, and UUID
  return tabId;
};


module.exports = {
    // SessionMDB,
    generateTabId,
};
