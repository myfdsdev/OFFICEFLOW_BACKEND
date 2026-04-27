import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';
import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// ==========================================
// Helper: Build user response object (used everywhere)
// ==========================================
const buildUserResponse = (user) => ({
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
  office_start_time: user.office_start_time,
  office_end_time: user.office_end_time,
  late_threshold_minutes: user.late_threshold_minutes,
  half_day_hours: user.half_day_hours,
  working_days: user.working_days,
});

// ==========================================
// @desc    Register new user
// @route   POST /api/auth/register
// ==========================================
export const register = asyncHandler(async (req, res) => {
  const { email, password, full_name, department, employee_id, mobile_number } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    full_name,
    department: department || '',
    employee_id: employee_id || '',
    mobile_number: mobile_number || '',
    role,
  });
  // ✅ ADD THIS LINE
sendWelcomeEmail(user.email, user.full_name).catch((err) => {
  console.error('Welcome email failed:', err.message);
});
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendWelcomeEmail(user.email, user.full_name).catch(err =>
    console.error('Welcome email failed:', err.message)
  );

  res.status(201).json({
    message: 'User registered successfully',
    token: accessToken,
    user: buildUserResponse(user),
  });
});

// ==========================================
// @desc    Login user
// @route   POST /api/auth/login
// ==========================================
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  user.is_online = true;
  user.last_active = new Date();
  await user.save();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: 'Login successful',
    token: accessToken,
    user: buildUserResponse(user),
  });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required' });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is missing in backend .env' });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.sub) {
    return res.status(401).json({ error: 'Invalid Google account' });
  }

  const email = payload.email.toLowerCase();

  let user = await User.findOne({ email });

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!user) {
    user = await User.create({
      email,
      full_name: payload.name || email.split('@')[0],
      profile_photo: payload.picture || '',
      google_id: payload.sub,
      auth_provider: 'google',
      role: adminEmails.includes(email) ? 'admin' : 'user',
      department: '',
      employee_id: '',
      mobile_number: '',
    });
  } else {
    if (!user.google_id) user.google_id = payload.sub;
    if (!user.auth_provider) user.auth_provider = 'google';
    if (!user.profile_photo && payload.picture) user.profile_photo = payload.picture;
  }

  user.is_online = true;
  user.last_active = new Date();
  await user.save();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: 'Google login successful',
    token: accessToken,
    user: buildUserResponse(user),
  });
});

// ==========================================
// @desc    Get current user
// @route   GET /api/auth/me
// ==========================================
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(buildUserResponse(user));
});

// ==========================================
// @desc    Logout
// @route   POST /api/auth/logout
// ==========================================
export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      is_online: false,
      last_active: new Date(),
    });
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// ==========================================
// @desc    Update profile
// @route   PUT /api/auth/update-profile
// ==========================================
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updatableFields = [
    'full_name', 'department', 'employee_id', 'mobile_number', 'profile_photo',
    'office_start_time', 'office_end_time',
    'late_threshold_minutes', 'half_day_hours', 'working_days',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  if (user.full_name && user.mobile_number && user.department) {
    user.is_profile_complete = true;
  }

  await user.save();

  res.json({
    message: 'Profile updated successfully',
    user: buildUserResponse(user),
  });
});

// ==========================================
// @desc    Change password
// @route   PUT /api/auth/change-password
// ==========================================
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both passwords are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password changed successfully' });
});

// ==========================================
// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// ==========================================
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded.id);
    res.json({ token: newAccessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});