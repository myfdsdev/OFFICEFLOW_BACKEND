import cron from 'node-cron';
import { runAttendanceReminder } from './attendanceReminderJob.js';
import { runMessageReminderCheck } from './messageReminderJob.js';
import { runAutoCheckout, runIdleAutoCheckout } from './autoCheckoutJob.js';

export const initCronJobs = () => {
  // Attendance reminder: Mon-Fri at 10:30 AM
  cron.schedule('30 10 * * 1-5', () => {
    console.log('[CRON] Running attendance reminder job...');
    runAttendanceReminder();
  });

  // Message reminders: every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runMessageReminderCheck();
  });

  // Idle auto-checkout: every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runIdleAutoCheckout();
  });

  // Midnight auto-checkout (catch-all + reset warning flags): 11:59 PM
  cron.schedule('59 23 * * *', () => {
    console.log('[CRON] Running midnight auto-checkout...');
    runAutoCheckout();
  });

  console.log('✅ Cron jobs initialized');
  console.log('   - Attendance reminder: Mon-Fri 10:30 AM');
  console.log('   - Message reminders: every 5 minutes');
  console.log('   - Idle auto-checkout: every 5 minutes');
  console.log('   - Midnight auto-checkout: daily 11:59 PM');
};

export {
  runAttendanceReminder,
  runMessageReminderCheck,
  runAutoCheckout,
  runIdleAutoCheckout,
};
