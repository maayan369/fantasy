const express = require('express');
const confirmationRouter = express.Router();
const { getUserByTokenAndConfirm } = require('../utils/Users.js');


confirmationRouter.get('/confirm-email/:token', async (req, res) => {
    const token = req.params.token;
    try {
        const user = await getUserByTokenAndConfirm(token);
        if (user) {
            // Redirect the user to a confirmation success page
            if(user.money === 0) {
                user.money = 2000;
                await user.save();
            }
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

module.exports = confirmationRouter;