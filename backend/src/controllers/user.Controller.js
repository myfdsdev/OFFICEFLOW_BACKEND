import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, department, search, sort = '-createdAt', limit = 100, page = 1 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { full_name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find(filter)
    .select('-password')
    .sort(sort)
    .limit(parseInt(limit))
    .skip(skip);

  const total = await User.countDocuments(filter);

  res.json({
    users,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// @desc    Filter users (matches base44.entities.User.filter)
// @route   GET /api/users/filter
// @access  Private
export const filterUsers = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  
  // Remove pagination params from filter
  delete filter.limit;
  delete filter.page;
  delete filter.sort;

  const users = await User.find(filter).select('-password');
  res.json(users);
});

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const { email, password, ...updates } = req.body;

  // Don't allow email/password change via this route
  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ message: 'User updated', user });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  // Prevent admin from deleting themselves
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ message: 'User deleted successfully' });
});

// @desc    Change user role (admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ message: 'Role updated', user });
});

// @desc    Get online users
// @route   GET /api/users/online
// @access  Private
export const getOnlineUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ is_online: true })
    .select('_id email full_name profile_photo last_active');
  
  res.json(users);
});

// @desc    Get users for messaging (excludes self, returns minimal info)
// @route   GET /api/users/for-messaging
// @access  Private
export const getUsersForMessaging = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select('_id email full_name profile_photo department role is_online last_active')
    .sort('full_name');

  res.json(users);
});

// @desc    Invite a new user (admin only) — creates user with temp password
// @route   POST /api/users/invite
// @access  Private/Admin
export const inviteUser = asyncHandler(async (req, res) => {
  const { email, full_name, role = 'user', department, employee_id } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({ error: 'Email and full name required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Temporary password (user will need to reset)
  const tempPassword = Math.random().toString(36).slice(-10);

  const user = await User.create({
    email: email.toLowerCase(),
    password: tempPassword,
    full_name,
    role,
    department: department || '',
    employee_id: employee_id || '',
  });

  res.status(201).json({
    message: 'User invited successfully',
    user: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
    tempPassword, // In production: email this instead of returning
  });
});