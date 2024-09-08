const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


//Creation of Users table
const userSchema = new mongoose.Schema({
    id: String,
    email: String,
    username: String,
    password: String,
    confirmed: {
        type: Boolean,
        default: false,
    },
    confirmationToken: String,
    tabIdInUse: String, // This will store the user's tab ID
    money: Number,
});
const User = new mongoose.model('User', userSchema);


//functions to find users by data, in User table, in mongodb:
async function getUserByUsername(username) {
    try {
      const user = await User.findOne({ username });
      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
};
async function getUserById(userId) {
    try {
      const user = await User.findOne({ userId });
      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
};
async function getUserByTabIdInUse(tabIdInUse) {
    try {
      const user = await User.findOne({ tabIdInUse });
      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
};
async function getUserByTokenAndConfirm(token) {
  try {
    // Update user's 'confirmed' field to true in the database
    const user = await User.findOneAndUpdate(
      { confirmationToken: token },
      { confirmed: true },
    );

    return user; // Return the user object
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
};


//Function to find if the login password matches the user's password.
async function verifyPassword(password, hashedPassword) {
    try {
      const passwordMatch = await bcrypt.compare(password, hashedPassword);
      return passwordMatch;
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
};


//Apply access to other files in Node.js
module.exports = {
    User,
    getUserByUsername,
    getUserByTokenAndConfirm,
    verifyPassword,
    getUserById,
    getUserByTabIdInUse
};

