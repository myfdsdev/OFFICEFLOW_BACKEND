import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';

// ==========================================
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ==========================================
export const register = asyncHandler(async (req, res) => {
  const { email, password, full_name, department, employee_id, mobile_number } = req.body;

  // Validation
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Auto-assign admin role if email is in ADMIN_EMAILS
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

  // Create user (password auto-hashed by User model pre-save hook)
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    full_name,
    department: department || '',
    employee_id: employee_id || '',
    mobile_number: mobile_number || '',
    role,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Send welcome email (don't wait for it — fire & forget)
  sendWelcomeEmail(user.email, user.full_name).catch(err =>
    console.error('Welcome email failed:', err.message)
  );

  // Respond with user + access token
  res.status(201).json({
    message: 'User registered successfully',
    token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      employee_id: user.employee_id,
      mobile_number: user.mobile_number,
      profile_photo: user.profile_photo,
    },
  });
});

// ==========================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ==========================================
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user (include password for comparison)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update online status
  user.is_online = true;
  user.last_active = new Date();
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set refresh token as cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: 'Login successful',
    token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      employee_id: user.employee_id,
      mobile_number: user.mobile_number,
      profile_photo: user.profile_photo,
      is_profile_complete: user.is_profile_complete,
    },
  });
});

// ==========================================
// @desc    Get current user (replaces base44.auth.me())
// @route   GET /api/auth/me
// @access  Private
// ==========================================
export const getMe = asyncHandler(async (req, res) => {
  // req.user is set by protect middleware
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user._id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    department: user.department,
    employee_id: user.employee_id,
    mobile_number: user.mobile_number,
    profile_photo: user.profile_photo,
    is_online: user.is_online,
    is_profile_complete: user.is_profile_complete,
    company_id: user.company_id,
  });
});

// ==========================================
// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
// ==========================================
export const logout = asyncHandler(async (req, res) => {
  // Update online status
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      is_online: false,
      last_active: new Date(),
    });
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({ message: 'Logged out successfully' });
});

// ==========================================
// @desc    Update profile
// @route   PUT /api/auth/update-profile
// @access  Private
// ==========================================
export const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, department, employee_id, mobile_number, profile_photo } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update only provided fields
  if (full_name !== undefined) user.full_name = full_name;
  if (department !== undefined) user.department = department;
  if (employee_id !== undefined) user.employee_id = employee_id;
  if (mobile_number !== undefined) user.mobile_number = mobile_number;
  if (profile_photo !== undefined) user.profile_photo = profile_photo;
  if (req.body.office_start_time !== undefined) user.office_start_time = req.body.office_start_time;
  if (req.body.office_end_time !== undefined) user.office_end_time = req.body.office_end_time;
  if (req.body.late_threshold_minutes !== undefined) user.late_threshold_minutes = req.body.late_threshold_minutes;
  if (req.body.half_day_hours !== undefined) user.half_day_hours = req.body.half_day_hours;
  if (req.body.working_days !== undefined) user.working_days = req.body.working_days;
  // Mark profile complete if required fields are filled
  if (user.full_name && user.mobile_number && user.department) {
    user.is_profile_complete = true;
  }

  await user.save();

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      employee_id: user.employee_id,
      mobile_number: user.mobile_number,
      profile_photo: user.profile_photo,
      is_profile_complete: user.is_profile_complete,
    },
  });
});

// ==========================================
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ==========================================
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both passwords are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  // Update password (pre-save hook will hash it)
  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

// ==========================================
// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (needs refresh cookie)
// ==========================================
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = generateAccessToken(decoded.id);

    res.json({ token: newAccessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});