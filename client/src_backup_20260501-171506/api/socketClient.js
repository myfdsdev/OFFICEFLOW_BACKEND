// Socket.io client — real-time updates
// Connects once when user logs in, closes on logout.
// Entity subscribe() from apiClient hooks into these events.

import { io } from 'socket.io-client';
import { getToken } from './apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Strip /api from URL — Socket.io connects to root, not /api path
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket = null;

// Subscribers organized by entity name: { Message: [callback1, callback2], ... }
const entitySubscribers = {};

// Connect to Socket.io server
export const connectSocket = () => {
  if (socket?.connected) return socket;

  const token = getToken();
  if (!token) {
    console.warn('[Socket] No token, skipping connection');
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connect error:', err.message);
  });

  // === Direct messages ===
  socket.on('new_message', (data) => {
    notifyEntity('Message', { type: 'create', data });
  });

  // === Group messages ===
  socket.on('new_group_message', (data) => {
    notifyEntity('GroupMessage', { type: 'create', data });
  });

  // === Notifications ===
  socket.on('new_notification', (data) => {
    notifyEntity('Notification', { type: 'create', data });
  });

  // === Typing indicators (exposed for components that want them) ===
  socket.on('user_typing', (data) => {
    notifyEntity('_typing', { type: 'typing', data });
  });
  socket.on('user_stop_typing', (data) => {
    notifyEntity('_typing', { type: 'stop_typing', data });
  });

  // === User status changes ===
  socket.on('user_status_changed', (data) => {
    notifyEntity('User', { type: 'update', data });
  });

  // === Force logout (admin deactivated/deleted this account) ===
  socket.on('force_logout', (payload) => {
    console.warn('[Socket] Force logout:', payload?.reason);
    try {
      localStorage.removeItem('workflow_token');
    } catch {}
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    const reason = payload?.reason === 'account_deleted'
      ? 'Your account was deleted by an administrator.'
      : 'Your account has been deactivated.';
    window.location.href = `/Login?notice=${encodeURIComponent(reason)}`;
  });

  return socket;
};

// Call subscribed callbacks for an entity
const notifyEntity = (entityName, event) => {
  const subs = entitySubscribers[entityName] || [];
  subs.forEach((cb) => {
    try {
      cb(event);
    } catch (err) {
      console.error(`[Socket] Subscriber error (${entityName}):`, err);
    }
  });
};

// Register a subscriber for an entity's real-time events
// Returns an unsubscribe function
export const subscribeToEntity = (entityName, callback) => {
  if (!entitySubscribers[entityName]) {
    entitySubscribers[entityName] = [];
  }
  entitySubscribers[entityName].push(callback);

  // Make sure socket is connected
  connectSocket();

  // Return unsubscribe
  return () => {
    entitySubscribers[entityName] = entitySubscribers[entityName].filter(
      (cb) => cb !== callback
    );
  };
};

// Emit an event (for sending messages via socket)
export const emitSocket = (event, data) => {
  if (!socket?.connected) {
    connectSocket();
  }
  if (socket?.connected) {
    socket.emit(event, data);
  }
};

// Join a group room (for group chats)
export const joinGroup = (groupId) => {
  emitSocket('join_group', groupId);
};

export const leaveGroup = (groupId) => {
  emitSocket('leave_group', groupId);
};

// Typing indicators
export const emitTyping = (receiverId) => {
  emitSocket('typing', { receiver_id: receiverId });
};

export const emitStopTyping = (receiverId) => {
  emitSocket('stop_typing', { receiver_id: receiverId });
};

// Disconnect (call on logout)
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  // Clear all subscribers
  Object.keys(entitySubscribers).forEach((key) => {
    entitySubscribers[key] = [];
  });
};

// Get raw socket instance (for advanced use)
export const getSocket = () => socket;