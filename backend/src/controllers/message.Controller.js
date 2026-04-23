import Message from '../models/Message.js';
import MessageReminder from '../models/MessageReminder.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getIO } from '../sockets/index.js';

// @desc    Send direct message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiver_id, message_text, attachment_url, attachment_type } = req.body;

  if (!receiver_id || !message_text) {
    return res.status(400).json({ error: 'receiver_id and message_text required' });
  }

  const receiver = await User.findById(receiver_id);
  if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

  const message = await Message.create({
    sender_id: req.user._id,
    sender_email: req.user.email,
    sender_name: req.user.full_name,
    receiver_id: receiver._id,
    receiver_email: receiver.email,
    receiver_name: receiver.full_name,
    message_text,
    attachment_url: attachment_url || '',
    attachment_type: attachment_type || '',
  });

  // Real-time push
  try {
    getIO().to(`user_${receiver._id}`).emit('new_message', message);
  } catch (err) {
    console.error('Socket emit failed:', err.message);
  }

  // Notification for receiver
  await Notification.create({
    user_email: receiver.email,
    title: `Message from ${req.user.full_name}`,
    message: message_text.slice(0, 80),
    type: 'new_message',
    related_id: message._id.toString(),
  });

  res.status(201).json(message);
});

// @desc    Get conversation between current user and another user
// @route   GET /api/messages/conversation/:userId
// @access  Private
export const getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 100, before } = req.query;

  const filter = {
    is_deleted: false,
    $or: [
      { sender_id: req.user._id, receiver_id: userId },
      { sender_id: userId, receiver_id: req.user._id },
    ],
  };

  if (before) filter.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(filter)
    .sort('-createdAt')
    .limit(parseInt(limit));

  // Return oldest first (for chat UI)
  res.json(messages.reverse());
});

// @desc    Get all conversations list (inbox-style)
// @route   GET /api/messages/conversations
// @access  Private
export const getMyConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all unique conversation partners
  const messages = await Message.find({
    is_deleted: false,
    $or: [{ sender_id: userId }, { receiver_id: userId }],
  })
    .sort('-createdAt')
    .limit(500);

  // Build conversation map (latest message per partner)
  const conversations = new Map();
  for (const msg of messages) {
    const partnerId =
      msg.sender_id.toString() === userId.toString()
        ? msg.receiver_id.toString()
        : msg.sender_id.toString();
    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        partner_id: partnerId,
        partner_name:
          msg.sender_id.toString() === userId.toString()
            ? msg.receiver_name
            : msg.sender_name,
        partner_email:
          msg.sender_id.toString() === userId.toString()
            ? msg.receiver_email
            : msg.sender_email,
        last_message: msg.message_text,
        last_message_at: msg.createdAt,
        is_last_from_me: msg.sender_id.toString() === userId.toString(),
      });
    }
  }

  // Add unread counts
  const result = await Promise.all(
    Array.from(conversations.values()).map(async (c) => {
      const unread = await Message.countDocuments({
        sender_id: c.partner_id,
        receiver_id: userId,
        is_read: false,
        is_deleted: false,
      });
      return { ...c, unread_count: unread };
    })
  );

  res.json(result);
});

// @desc    Filter messages (base44 pattern)
// @route   GET /api/messages/filter
// @access  Private
export const filterMessages = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  delete filter.sort;
  delete filter.limit;

  const messages = await Message.find(filter)
    .sort(req.query.sort || '-createdAt')
    .limit(parseInt(req.query.limit) || 100);

  res.json(messages);
});

// @desc    Mark messages as read
// @route   PUT /api/messages/mark-read/:senderId
// @access  Private
export const markConversationRead = asyncHandler(async (req, res) => {
  const result = await Message.updateMany(
    {
      sender_id: req.params.senderId,
      receiver_id: req.user._id,
      is_read: false,
    },
    { is_read: true }
  );
  res.json({ message: 'Marked as read', updated: result.modifiedCount });
});

// @desc    Edit message
// @route   PUT /api/messages/:id
// @access  Private (sender only)
export const editMessage = asyncHandler(async (req, res) => {
  const { message_text } = req.body;
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  if (message.sender_id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Only sender can edit' });
  }

  message.message_text = message_text;
  message.is_edited = true;
  message.edited_at = new Date();
  await message.save();

  try {
    getIO().to(`user_${message.receiver_id}`).emit('message_edited', message);
  } catch (err) {}

  res.json(message);
});

// @desc    Soft delete message
// @route   DELETE /api/messages/:id
// @access  Private (sender only)
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  if (message.sender_id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Only sender can delete' });
  }

  message.is_deleted = true;
  message.message_text = '[deleted]';
  await message.save();

  try {
    getIO().to(`user_${message.receiver_id}`).emit('message_deleted', { id: message._id });
  } catch (err) {}

  res.json({ message: 'Message deleted' });
});

// @desc    Pin/unpin message
// @route   PUT /api/messages/:id/pin
// @access  Private
export const togglePin = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  // Sender or receiver can pin
  const canPin = [message.sender_id.toString(), message.receiver_id.toString()]
    .includes(req.user._id.toString());
  if (!canPin) return res.status(403).json({ error: 'Access denied' });

  message.is_pinned = !message.is_pinned;
  await message.save();
  res.json(message);
});

// @desc    Mute/unmute message
// @route   PUT /api/messages/:id/mute
// @access  Private
export const toggleMute = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  const userId = req.user._id.toString();
  const mutedBy = (message.muted_by || []).map((id) => id.toString());

  if (mutedBy.includes(userId)) {
    message.muted_by = message.muted_by.filter((id) => id.toString() !== userId);
  } else {
    message.muted_by.push(req.user._id);
  }

  await message.save();
  res.json(message);
});

// @desc    Create message reminder
// @route   POST /api/messages/:id/reminder
// @access  Private
export const createMessageReminder = asyncHandler(async (req, res) => {
  const { reminder_time } = req.body;
  if (!reminder_time) {
    return res.status(400).json({ error: 'reminder_time required' });
  }

  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  const reminder = await MessageReminder.create({
    user_id: req.user._id,
    message_id: message._id,
    message_text: message.message_text,
    reminder_time: new Date(reminder_time),
  });

  res.status(201).json(reminder);
});

// @desc    Broadcast message to multiple users
// @route   POST /api/messages/broadcast
// @access  Private/Admin
export const broadcastMessage = asyncHandler(async (req, res) => {
  const { user_ids, message_text } = req.body;

  if (!Array.isArray(user_ids) || !user_ids.length || !message_text) {
    return res.status(400).json({ error: 'user_ids array and message_text required' });
  }

  const users = await User.find({ _id: { $in: user_ids } });
  const messages = [];

  for (const receiver of users) {
    const msg = await Message.create({
      sender_id: req.user._id,
      sender_email: req.user.email,
      sender_name: req.user.full_name,
      receiver_id: receiver._id,
      receiver_email: receiver.email,
      receiver_name: receiver.full_name,
      message_text,
    });
    messages.push(msg);

    try {
      getIO().to(`user_${receiver._id}`).emit('new_message', msg);
    } catch (err) {}
  }

  res.status(201).json({ sent: messages.length, messages });
});