import express from 'express';
import {
  calculateAttendance,
  checkMessageReminders,
  exportAttendanceReport,
  notifyNewMessage,
  processPayment,
  sendAttendanceReminder,
  getUsersForMessaging,
} from '../controllers/functions.Controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/calculate-attendance', calculateAttendance);
router.post('/check-message-reminders', adminOnly, checkMessageReminders);
router.post('/export-attendance-report', adminOnly, exportAttendanceReport);
router.post('/notify-new-message', notifyNewMessage);
router.post('/process-payment', processPayment);
router.post('/send-attendance-reminder', adminOnly, sendAttendanceReminder);
router.post('/get-users-for-messaging', getUsersForMessaging);

export default router;