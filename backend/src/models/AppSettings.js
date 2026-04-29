import mongoose from 'mongoose';

// Singleton pattern: only ONE document for the whole app's settings
const appSettingsSchema = new mongoose.Schema({
<<<<<<< HEAD
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
  // Tracking
  updated_by: {
    type: String,
    default: '',
  },
=======
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
    default: '#6366F1', // indigo-500
  },
  // Tracking
  updated_by: {
    type: String,
    default: '',
  },
>>>>>>> 686fead (feat: implement app settings management with admin controls)
}, { timestamps: true });

// Helper to get-or-create the singleton settings document
appSettingsSchema.statics.getSingleton = async function () {
<<<<<<< HEAD
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
=======
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
>>>>>>> 686fead (feat: implement app settings management with admin controls)
};

export default mongoose.model('AppSettings', appSettingsSchema);