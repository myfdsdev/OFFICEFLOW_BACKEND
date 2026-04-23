import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Middleware: verify JWT on socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.email} (${socket.id})`);

    // Join personal room (for direct messages)
    socket.join(`user_${socket.user._id}`);

    // Update online status
    User.findByIdAndUpdate(socket.user._id, {
      is_online: true,
      last_active: new Date(),
    }).exec();

    // === DIRECT MESSAGE ===
    socket.on('send_message', (data) => {
      // Send to receiver's personal room
      io.to(`user_${data.receiver_id}`).emit('new_message', data);
    });

    // === GROUP MESSAGE ===
    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`${socket.user.email} joined group ${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
    });

    socket.on('send_group_message', (data) => {
      io.to(`group_${data.group_id}`).emit('new_group_message', data);
    });

    // === TYPING INDICATOR ===
    socket.on('typing', ({ receiver_id }) => {
      io.to(`user_${receiver_id}`).emit('user_typing', {
        user_id: socket.user._id,
        user_name: socket.user.full_name,
      });
    });

    socket.on('stop_typing', ({ receiver_id }) => {
      io.to(`user_${receiver_id}`).emit('user_stop_typing', {
        user_id: socket.user._id,
      });
    });

    // === DISCONNECT ===
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.email}`);
      await User.findByIdAndUpdate(socket.user._id, {
        is_online: false,
        last_active: new Date(),
      });
    });
  });

  return io;
};

// Helper: get io instance anywhere in app
export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};