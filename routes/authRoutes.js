const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {

        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }


        const hashedPassword = await bcrypt.hash(req.body.password, 10);


        const user = new User({
            username: req.body.username,
            password: hashedPassword
        });


        const savedUser = await user.save();


        res.status(201).json({ username: savedUser.username, _id: savedUser._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/login', async (req, res) => {
    try {

        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.status(400).send('Invalid username or password');
        }


        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(400).send('Invalid username or password');
        }


        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });


        res.header('auth-token', token).send(token);
    } catch (error) {
        res.status(500).send(error.message);
    }
});



module.exports = router;
