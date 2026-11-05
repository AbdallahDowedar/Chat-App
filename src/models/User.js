const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,

},
    password: {
        type: String,
        required: true,
        minlength: 6,
        trim: true,
    },
    displayName: {
        type: String,
        trim: true,
        default: '',
    },
    profilePicture: {
        type: String,
        trim: true,
        default: '',
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;