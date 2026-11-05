const Room = require("../models/Room");
const Message = require("../models/Message");


const createRoom = async (req, res) => {
  try {
    const { username, IsPrivate, description } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({
        message: "Room name is required"
      });
    }

    const newRoom = await Room.create({
      username: username,
      IsPrivate: IsPrivate || false,
      description: description?.trim() || "",
      createdBy: req.user._id,
    });

    const populatedRoom = await Room.findById(newRoom._id)
      .populate("createdBy", "username displayName")
      .lean();

    return res.status(201).json({
      message: "Room created successfully",
      room: populatedRoom
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({})
      .populate("createdBy", "username displayName")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ rooms });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("createdBy", "username displayName")
      .lean();
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    return res.status(200).json({ room });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getroomMessages = async (req, res) => {
  try {
    const roomId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Limit to a maximum of 100 messages
    const skip = parseInt(req.query.skip) || 0;
    const messages = await Message.find({ room: roomId })
      .populate("sender", "username displayName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { createRoom, getRooms, getRoomById, getroomMessages };  
