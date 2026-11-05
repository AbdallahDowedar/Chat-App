const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    IsPrivate: {
        type: Boolean,
        default: false,
    },
    Members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;