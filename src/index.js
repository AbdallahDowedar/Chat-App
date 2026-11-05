require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');
const JWT = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');
const RoomRoutes = require('./routes/Rooms');
const cors = require('cors');
const authRoutes = require('./routes/auth');


const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*' // بسمح انه يتعامل مع اي  domain
  },
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rooms', RoomRoutes);

mongoose.connect(process.env.MONGODB_URI, {})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.set('io', io);

const onlineUsers = new Set(); // Set to store online user IDs

io.on('connection', (socket) => {
  const token = socket.handshake.query.token;
  if (!token) {
    socket.emit('error', 'No token provided');
    socket.disconnect();
    return; //  عشان يوقف تنفيذ الكود بعد ما disconnect
  }
  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    User.findById(decoded.userId).then((user) => {
      if (!user) {
        socket.emit('error', 'User not found');
        socket.disconnect();
        return;
      }
      socket.data.userId = user._id.toString(); // Store userId in socket data for later use
      socket.data.user = user; // Store the user object in socket data for later use
      console.log('A user connected:', user.username);

      onlineUsers.add(socket.data.userId); // Add user ID to the online users set
      io.emit('user-online', { userId: socket.data.userId, username: user.username }); // Notify all clients that a user is online

      socket.on('joinRoom',async (data) => {
        const { roomId } = data.roomId;
        if (!roomId) {
          socket.emit('error', 'Room ID is required');
          return;
        }
        if (!socket.data.userId) {
          socket.emit('error', 'User not authenticated');
          return;
        }
        try{
          const Room = await Room.findById(roomId);
          if (!Room) {
            socket.emit('error', 'Room not found');
            return;
          }
          if(Room.isPrivate){
            const isMember = Room.members?.some(memberId => memberId.toString() === socket.data.userId);
            if (!isMember) {
              socket.emit('error', 'You are not a member of this private room');
              return;
            }
            await socket.join(roomId);
            socket.emit('joinedRoom', { roomId });
          }
        }
        catch (error) {
          socket.emit('error', 'Internal server error');
        }
      });
      socket.on('sendMessage', async (data) => {
        const { roomId, content } = data|| {};
        if (!roomId || !content?.trim()) {
          socket.emit('error', 'Room ID and content are required');
          return;
        }
        if (!socket.data.userId) {
          socket.emit('error', 'User not authenticated');
          return;
        }
        try {
          const Message = await Message.create({
            content,
            sender: socket.data.userId,
            room: roomId
          });
          const populatedMessage = await Message.findById(Message._id).populate('sender', 'username displayName')
          .lean();
          io.to(roomId).emit('newMessage', populatedMessage);

        } catch (error) {
          socket.emit('error', 'Internal server error');
          socket.disconnect();
        }
      });
      socket.on('typing', (data) => {
        const { roomId } = data.roomId;
        if (!roomId) {
          socket.emit('error', 'Room ID is required');
          return;
        }
        io.to(roomId).emit('user-typing', { userId: socket.data.userId, username: user.username });
      });
      socket.on('stopTyping', (data) => {
        const { roomId } = data.roomId;
        if (!roomId) {
          socket.emit('error', 'Room ID is required');
          return;
        }
        io.to(roomId).emit('user-stop-typing', { userId: socket.data.userId, username: user.username });
    });
    });
   } catch (error) {
    socket.emit('error', 'Invalid token');
    socket.disconnect();
    return;
  }

  socket.on('disconnect', () => {
    if (socket.data.userId) {
      onlineUsers.delete(socket.data.userId);
      io.emit('user-offline', { userId: socket.data.userId, username: user.username });
    }
    console.log('A user disconnected:', socket.id);
  });
});

// (health check) endpoint >>  يعرفني ان السيرفر  active  ولا لا
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});