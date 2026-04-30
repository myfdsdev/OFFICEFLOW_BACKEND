import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

export const initSocket = (httpServer) => {
  // Support multiple origins (same pattern as server.js CORS)
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim());

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`[Socket CORS] Blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
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

  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.user.email} (${socket.id})`);

    // Join personal room
    socket.join(`user_${socket.user._id}`);

    // Update online status + broadcast to everyone
    await User.findByIdAndUpdate(socket.user._id, {
      is_online: true,
      last_active: new Date(),
    });

    io.emit('user_status_changed', {
      _id: socket.user._id,
      email: socket.user.email,
      is_online: true,
    });

    // === GROUP ROOMS ===
    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
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

      io.emit('user_status_changed', {
        _id: socket.user._id,
        email: socket.user.email,
        is_online: false,
      });
    });
  });

  return io;
};

// Get io instance anywhere in app
export const getIO = () => {
  if (!io) {
    console.warn('Socket.io not initialized yet');
    return null;
  }
  return io;
};

// ==========================================
// Helper functions for controllers to emit events
// ==========================================

// Emit new direct message to receiver
export const emitNewMessage = (message) => {
  const io = getIO();
  if (!io) return;
  io.to(`user_${message.receiver_id}`).emit('new_message', message);
  // Also notify sender's other devices
  io.to(`user_${message.sender_id}`).emit('new_message', message);
};

// Emit new group message to all group members
export const emitNewGroupMessage = (message) => {
  const io = getIO();
  if (!io) return;
  io.to(`group_${message.group_id}`).emit('new_group_message', message);
};

// Emit notification to a specific user
export const emitNotification = (userEmail, notification) => {
  const io = getIO();
  if (!io) return;
  // Find user by email to get their socket room
  User.findOne({ email: userEmail })
    .select('_id')
    .then((user) => {
      if (user) {
        io.to(`user_${user._id}`).emit('new_notification', notification);
      }
    })
    .catch(() => {});
};

// Force-disconnect a user's sockets (called when admin deactivates/deletes them)
export const forceDisconnectUser = (userId, reason = 'force_logout') => {
  const io = getIO();
  if (!io) return;
  const room = `user_${userId}`;
  io.to(room).emit('force_logout', { reason });
  io.in(room).disconnectSockets(true);
};