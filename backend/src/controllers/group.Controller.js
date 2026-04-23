import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import GroupMessage from '../models/GroupMessage.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create group
// @route   POST /api/groups
// @access  Private
export const createGroup = asyncHandler(async (req, res) => {
  const { group_name, description, group_type, members = [] } = req.body;

  if (!group_name) return res.status(400).json({ error: 'Group name required' });

  const group = await Group.create({
    group_name,
    description: description || '',
    group_type: group_type || 'public',
    created_by: req.user._id,
    created_by_name: req.user.full_name,
  });

  // Creator as admin
  await GroupMember.create({
    group_id: group._id,
    group_name: group.group_name,
    user_id: req.user._id,
    user_email: req.user.email,
    user_name: req.user.full_name,
    role: 'admin',
  });

  // Additional members
  if (members.length) {
    const docs = members.map((m) => ({
      group_id: group._id,
      group_name: group.group_name,
      user_id: m.user_id,
      user_email: m.user_email,
      user_name: m.user_name,
      role: 'member',
      added_by: req.user._id,
      added_by_name: req.user.full_name,
    }));
    await GroupMember.insertMany(docs);

    // Notify
    await Notification.insertMany(
      members.map((m) => ({
        user_email: m.user_email,
        title: 'Added to Group',
        message: `You were added to "${group_name}" by ${req.user.full_name}`,
        type: 'added_to_group',
        related_id: group._id.toString(),
      }))
    );
  }

  res.status(201).json(group);
});

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
export const getAllGroups = asyncHandler(async (req, res) => {
  const { is_archived, group_type, sort = '-createdAt', limit = 100 } = req.query;

  const filter = {};
  if (is_archived !== undefined) filter.is_archived = is_archived === 'true';
  if (group_type) filter.group_type = group_type;

  // Non-admin: only see groups where user is member OR public groups
  if (req.user.role !== 'admin') {
    const memberships = await GroupMember.find({ user_id: req.user._id }).select('group_id');
    filter.$or = [
      { _id: { $in: memberships.map((m) => m.group_id) } },
      { group_type: 'public' },
    ];
  }

  const groups = await Group.find(filter).sort(sort).limit(parseInt(limit));
  res.json(groups);
});

// @desc    Filter groups (base44 pattern)
// @route   GET /api/groups/filter
// @access  Private
export const filterGroups = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  delete filter.sort;
  delete filter.limit;

  const groups = await Group.find(filter)
    .sort(req.query.sort || '-createdAt')
    .limit(parseInt(req.query.limit) || 100);

  res.json(groups);
});

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private
export const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  // Private groups: only members
  if (group.group_type === 'private' && req.user.role !== 'admin') {
    const member = await GroupMember.findOne({
      group_id: group._id,
      user_id: req.user._id,
    });
    if (!member) return res.status(403).json({ error: 'Access denied' });
  }

  res.json(group);
});

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private (admin member)
export const updateGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const member = await GroupMember.findOne({
    group_id: group._id,
    user_id: req.user._id,
  });
  const canEdit = req.user.role === 'admin' || (member && member.role === 'admin');
  if (!canEdit) return res.status(403).json({ error: 'Access denied' });

  const allowed = ['group_name', 'description', 'group_type', 'group_photo', 'is_archived'];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) group[f] = req.body[f];
  });
  await group.save();

  // Sync group_name on related docs
  if (req.body.group_name) {
    await GroupMember.updateMany({ group_id: group._id }, { group_name: req.body.group_name });
    await GroupMessage.updateMany({ group_id: group._id }, { group_name: req.body.group_name });
  }

  res.json(group);
});

// @desc    Delete group (cascade)
// @route   DELETE /api/groups/:id
// @access  Private (admin member)
export const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const member = await GroupMember.findOne({
    group_id: group._id,
    user_id: req.user._id,
  });
  const canDelete = req.user.role === 'admin' || (member && member.role === 'admin');
  if (!canDelete) return res.status(403).json({ error: 'Access denied' });

  await GroupMember.deleteMany({ group_id: group._id });
  await GroupMessage.deleteMany({ group_id: group._id });
  await group.deleteOne();

  res.json({ message: 'Group deleted' });
});