const express = require('express');
const router = express.Router();

const {getRooms, createRoom, getRoomById,getroomMessages } = require('../controllers/Room.controllers');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, createRoom);
router.get('/', authMiddleware, getRooms);
router.get('/:id', authMiddleware, getRoomById);
router.get('/:id/messages', authMiddleware, getroomMessages);

module.exports = router;