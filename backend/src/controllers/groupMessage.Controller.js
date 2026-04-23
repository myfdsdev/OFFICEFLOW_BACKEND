import GroupMessage from '../models/GroupMessage.js';
import GroupMember from '../models/GroupMember.js';
import Group from '../models/Group.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getIO } from '../sockets/index.js';

// Helper: verify membership
const isGroupMember = async (userId, groupId, userRole) => {
  if (userRole === 'admin') return true;
  const m = await GroupMember.findOne({ group_id: groupId, user_id: userId });
  return !!m;
};

// @desc    Send group message
// @route   POST /api/group-messages
// @access  Private (member)
export const sendGroupMessage = asyncHandler(async (req, res) => {
  const { group_id, message_text, attachment_url } = req.body;

  if (!group_id || !message_text) {
    return res.status(400).json({ error: 'group_id and message_text required' });
  }

  const group = await Group.findById(group_id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const isMember = await isGroupMember(req.user._id, group_id, req.user.role);
  if (!isMember) return res.status(403).json({ error: 'Not a group member' });

  const msg = await GroupMessage.create({
    group_id,
    group_name: group.group_name,
    sender_id: req.user._id,
    sender_email: req.user.email,
    sender_name: req.user.full_name,
    message_text,
    attachment_url: attachment_url || '',
  });

  // Real-time broadcast to group room
  try {
    getIO().to(`group_${group_id}`).emit('new_group_message', msg);
  } catch (err) {
    console.error('Socket emit failed:', err.message);
  }

  res.status(201).json(msg);
});

// @desc    Get messages for a group
// @route   GET /api/group-messages?group_id=xxx
// @access  Private (member)
export const getGroupMessages = asyncHandler(async (req, res) => {
  const { group_id, limit = 100, before } = req.query;

  if (!group_id) return res.status(400).json({ error: 'group_id required' });

  const isMember = await isGroupMember(req.user._id, group_id, req.user.role);
  if (!isMember) return res.status(403).json({ error: 'Not a group member' });

  const filter = { group_id, is_deleted: false };
  if (before) filter.createdAt = { $lt: new Date(before) };

  const messages = await GroupMessage.find(filter)
    .sort('-createdAt')
    .limit(parseInt(limit));

  res.json(messages.reverse());
});

// @desc    Filter group messages (base44 pattern)
// @route   GET /api/group-messages/filter
// @access  Private
export const filterGroupMessages = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  delete filter.sort;
  delete filter.limit;

  const msgs = await GroupMessage.find(filter)
    .sort(req.query.sort || '-createdAt')
    .limit(parseInt(req.query.limit) || 100);

  res.json(msgs);
});

// @desc    Edit group message
// @route   PUT /api/group-messages/:id
// @access  Private (sender)
export const editGroupMessage = asyncHandler(async (req, res) => {
  const { message_text } = req.body;
  const msg = await GroupMessage.findById(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  if (msg.sender_id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Only sender can edit' });
  }

  msg.message_text = message_text;
  msg.is_edited = true;
  msg.edited_at = new Date();
  await msg.save();

  try {
    getIO().to(`group_${msg.group_id}`).emit('group_message_edited', msg);
  } catch (err) {}

  res.json(msg);
});

// @desc    Delete group message
// @route   DELETE /api/group-messages/:id
// @access  Private (sender or group admin)
export const deleteGroupMessage = asyncHandler(async (req, res) => {
  const msg = await GroupMessage.findById(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const isSender = msg.sender_id.toString() === req.user._id.toString();
  const groupMember = await GroupMember.findOne({
    group_id: msg.group_id,
    user_id: req.user._id,
  });
  const isGroupAdmin = groupMember && groupMember.role === 'admin';

  if (!isSender && !isGroupAdmin && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  msg.is_deleted = true;
  msg.message_text = '[deleted]';
  await msg.save();

  try {
    getIO().to(`group_${msg.group_id}`).emit('group_message_deleted', { id: msg._id });
  } catch (err) {}

  res.json({ message: 'Message deleted' });
});

// @desc    Mark group message as read
// @route   PUT /api/group-messages/:id/read
// @access  Private
export const markGroupMessageRead = asyncHandler(async (req, res) => {
  const msg = await GroupMessage.findById(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const userId = req.user._id;
  const readBy = (msg.read_by || []).map((id) => id.toString());

  if (!readBy.includes(userId.toString())) {
    msg.read_by.push(userId);
    await msg.save();
  }

  res.json(msg);
});

