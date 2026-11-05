const User = require('../models/User');
const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if(existingUser)
            return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        const userobj = user.toObject();
        delete userobj.password;
        await user.save();
        return res.status(201).json({ message: 'User registered successfully', user: userobj });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
const login = async (req, res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password)
            return res.status(400).json({ message: 'All fields are required' });
        const user = await User.findOne({ email });
        if(!user)
            return res.status(400).json({ message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch)
            return res.status(400).json({ message: 'Invalid credentials' });
        const token = JWT.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const userobj = user.toObject();
        delete userobj.password;
        return res.status(200).json({ message: 'Login successful', token, user: userobj });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
module.exports = { register, login };
