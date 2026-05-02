import mongoose from 'mongoose';

// Singleton pattern: only ONE document for the whole app's settings
const appSettingsSchema = new mongoose.Schema({
  app_name: {
    type: String,
    default: 'AttendEase',
    trim: true,
  },
  app_logo: {
    type: String, // URL to uploaded logo image
    default: '',
  },
  html_title: {
    type: String,
    default: 'AttendEase',
    trim: true,
  },
  favicon: {
    type: String,
    default: '',
  },
  primary_color: {
    type: String,
    default: '#6366f1', // indigo-500
  },
  // ===== Office Hours (GLOBAL — applies to all employees) =====
  office_start_time: {
    type: String,
    default: '09:00', // 24h format HH:mm
  },
  office_end_time: {
    type: String,
    default: '18:00', // 24h format HH:mm
  },
  // ===== Auto-Checkout =====
  auto_checkout_enabled: {
    type: Boolean,
    default: true,
  },
  auto_checkout_hours: {
    type: Number,
    default: 2, // Hours of inactivity before auto-checkout
    min: 0.25,
    max: 24,
  },
  auto_checkout_warning_minutes: {
    type: Number,
    default: 20, // Minutes BEFORE auto-checkout to send warning
    min: 1,
    max: 120,
  },
  // Tracking
  updated_by: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Helper to get-or-create the singleton settings document
appSettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model('AppSettings', appSettingsSchema);
