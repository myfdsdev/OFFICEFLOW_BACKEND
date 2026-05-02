import AppSettings from '../models/AppSettings.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get app settings (public — anyone can read)
// @route   GET /api/app-settings
// @access  Public (no auth required)
export const getAppSettings = asyncHandler(async (req, res) => {
  const settings = await AppSettings.getSingleton();
  res.json(settings);
});

// @desc    Update app settings (admin only)
// @route   PUT /api/app-settings
// @access  Admin
export const updateAppSettings = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update app settings' });
  }

  const settings = await AppSettings.getSingleton();

  const allowedFields = [
    'app_name',
    'app_logo',
    'html_title',
    'favicon',
    'primary_color',
    'office_start_time',
    'office_end_time',
    'auto_checkout_enabled',
    'auto_checkout_hours',
    'auto_checkout_warning_minutes',
    'test_mode',
    'test_idle_seconds',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  settings.updated_by = req.user.email;
  await settings.save();

  // Broadcast change via socket so all connected clients update live
  try {
    const { getIO } = await import('../sockets/index.js');
    const io = getIO();
    if (io) {
      io.emit('app_settings_updated', settings);
    }
  } catch (err) {
    console.error('Failed to broadcast settings update:', err.message);
  }

  res.json(settings);
});