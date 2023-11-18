// const mongoose = require('mongoose');

// mongoose.connect("mongodb://localhost:27017/FantasyDB")
// .then(() => {
//     console.log('Connected to MongoDB');
// })
// .catch((err) => {
//     console.error('error:', err);
// });

// const usersSchema = new mongoose.Schema({

//     email: {
//         type: String,
//         require: true
//     },
//     id: {
//         type: String,
//         require: true
//     },
//     password: {
//         type: String,
//         require: true
//     },
//     username: {
//         type: String,
//         require: true
//     }

// });

// const collection = new mongoose.model('User', usersSchema);

// data= {
//     email: 'jjj',
//     id: 'rrr',
//     password: 'ggg',
//     username: 'uuu'
// }

// collection.insertMany([data]);

// app.post('/api/users', (req,res) => {
//     const userData = req.body;
// })


// app.get('/users', (req, res) => {
//     res.json(users)
// });

// app.post('/users', async (req, res) => {
//     try {
//         const salt = await bcrypt.genSalt();
//         const hashedUsername = await bcrypt.hash(req.body.username, salt);
//         console.log(salt);
//         console.log(hashedUsername);
//         const user = { id: req.body.id, username: hashedUsername, room: req.body.room };
//         users.push(user);
//         res.status(201).send();
//     } catch {
//         res.status(500).send('server error')
//         console.error('Error', error);
//     }
// });
