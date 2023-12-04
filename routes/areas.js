// // areasRouter.js

// const express = require('express');
// const areasRouter = express.Router();

// // Middleware to check authentication for /areas and its sub-paths
// areasRouter.use((req, res, next) => {
//   if (req.session.isLoggedIn) {
//     next(); // Continue to the next middleware/route handler if logged in
//   } else {
//     res.redirect('/index.html'); // Redirect to login page if not logged in
//   }
// });

// // Define routes within /areas
// areasRouter.get('/', (req, res) => {
//   // Render the areas main page
//   res.render('areas', { username: req.session.username });
// });

// // Catch-all route for /areas/*
// areasRouter.get('*', (req, res) => {
//   // Check authentication for any route under /areas
//   if (req.session.isLoggedIn) {
//     // Render the requested page for authenticated users
//     res.render(req.path.slice(1), { username: req.session.username });
//   } else {
//     // Redirect to login page if not logged in
//     res.redirect('/index.html');
//   }
// });

// // Export the router for use in your main app.js/server file
// module.exports = areasRouter;
