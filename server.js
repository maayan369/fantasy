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

const session = require('express-session');
const confirmationRouter = express.Router();
const areasRouter = express.Router();

const { User, getUserByUsername, getUserByTokenAndConfirm, verifyPassword } = require('./utils/Users.js')

const { sendConfirmEmail } = require('./mailer/confirmEmail.js');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'j2who55ate430@my$!cookiesrandomran4912398islogin?#$',
  resave: false,
  saveUninitialized: false,
}));


app.use('/areas/:filename', function(req, res, next) {
  const filename = req.params.filename; 

  if (req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'areas', filename));
  } else {
    res.redirect('/index.html');
  }
});


app.use(express.static(path.join(__dirname, 'public')));


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
      
      //check if there is a user with this user name
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

        //login:
        req.session.isLoggedIn = true;
        req.session.username = loginUsername;
        
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

app.get('/js/:filename', function(req, res) {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'areas', 'js', filename);
  
  res.set('Content-Type', 'text/javascript'); // Set the correct MIME type

  res.sendFile(filePath);
});


app.get('/get-username', (req, res) => {
  if (req.session.isLoggedIn) {

    const username = req.session.username;
    res.json({ username });

  } else {
    res.status(401).json({ message: 'Not logged in' });
    // res.redirect('/index.html'); // Redirect to index if logged in
  }
});


// POST logout
app.post('/logout', (req, res) => {
  req.session.isLoggedIn = false;
  req.session.username = null;
  res.send('Logged out successfully!');
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
    };

});


//routers:
// areasRouter.use((req, res, next) => {
//   if (req.session.isLoggedIn === true) {
//     next(); // Proceed to the next middleware/route handler if not logged in
//   } else {
//     res.redirect('/index.html'); // Redirect to index if logged in
//   }
// });

confirmationRouter.get('/confirm-email/:token', async (req, res) => {
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

// areasRouter.use('/areas/:filename', async (req, res) => {
//   const filename = req.params.filename;
//       if (req.session.isLoggedIn) {
//          res.sendFile(path.join(__dirname, 'public', 'areas', filename));
//       } else {
//          res.redirect('/index.html');
//       }
// });


app.use('/confirmation', confirmationRouter);
// app.use('/areas/*', areasRouter);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));