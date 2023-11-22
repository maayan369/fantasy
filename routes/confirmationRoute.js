// לא הצלחתי לקחת את הפונקציות האלה מהשרת לכאן אולי כדאי ליצור קודם
// עמוד נפרד ביוטילס של יוזרז כדישאני אוכל לעשות גם את זה


// const express = require('express');
// const router = express.Router();
// const { User } = require('../server');

// // Function to retrieve a user by token and confirm
// async function getUserByTokenAndConfirm(User, token) {
//     try {
//         const user = await User.findOneAndUpdate(
//             { confirmationToken: token },
//             { confirmed: true },
//             { new: true } // Get the modified document as a result
//         );
//         return user; // Return the user object
//     } catch (error) {
//         console.error('Error finding user:', error);
//         throw error;
//     }
// }

// router.get('/confirm-email/:token', async (req, res) => {
//     const token = req.params.token;
//     try {
//         const user = await getUserByTokenAndConfirm(User, token);
//         if (user) {
//             res.redirect('/login.html');
//         } else {
//             res.status(404).send('Confirmation failed. User not found.');
//         }
//     } catch (error) {
//         console.error('Confirmation error:', error);
//         res.status(500).send('Internal server error');
//     }
// });

// module.exports = router;