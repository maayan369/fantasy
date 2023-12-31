const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    id: String,
    email: String,
    username: String,
    password: String,
    // emailConfirmationToken: String,
    confirmed: {
        type: Boolean,
        default: false,
    },
    confirmationToken: String,
    tabIdInUse: String, // This will store the user's tab ID
    money: Number,
});

const User = new mongoose.model('User', userSchema);

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

async function verifyPassword(password, hashedPassword) {
    try {
      const passwordMatch = await bcrypt.compare(password, hashedPassword);
      return passwordMatch;
    } catch (error) {
    //   console.error('Error verifying password:', error);
      throw error;
    }
};


module.exports = {
    User,
    getUserByUsername,
    getUserByTokenAndConfirm,
    verifyPassword,
    getUserById,
    getUserByTabIdInUse
};

