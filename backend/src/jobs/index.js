import cron from 'node-cron';
import { runAttendanceReminder } from './attendanceReminderJob.js';
import { runMessageReminderCheck } from './messageReminderJob.js';
import { runAutoCheckout } from './autoCheckoutJob.js';

export const initCronJobs = () => {
  // Cron syntax: [minute] [hour] [day-of-month] [month] [day-of-week]
  
  // Attendance reminder: Mon-Fri at 10:30 AM (server timezone)
  cron.schedule('30 10 * * 1-5', () => {
    console.log('[CRON] Running attendance reminder job...');
    runAttendanceReminder();
  });

  // Message reminders: every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runMessageReminderCheck();
  });

  // Auto-checkout: daily at 11:59 PM
  cron.schedule('59 23 * * *', () => {
    console.log('[CRON] Running auto-checkout job...');
    runAutoCheckout();
  });

  console.log('✅ Cron jobs initialized');
  console.log('   - Attendance reminder: Mon-Fri 10:30 AM');
  console.log('   - Message reminders: every 5 minutes');
  console.log('   - Auto-checkout: daily 11:59 PM');
};

// Export individual jobs so they can be triggered manually via API
export { runAttendanceReminder, runMessageReminderCheck, runAutoCheckout };