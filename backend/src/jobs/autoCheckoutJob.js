import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Notification from '../models/Notification.js';

export const runAutoCheckout = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const activeAttendance = await Attendance.find({
      date: today,
      has_active_session: true,
    });

    if (!activeAttendance.length) {
      console.log('[CRON] Auto-checkout: no active sessions');
      return;
    }

    let closedCount = 0;

    for (const att of activeAttendance) {
      const openSessions = await AttendanceSession.find({
        attendance_id: att._id,
        check_out: { $exists: false },
      });

      for (const session of openSessions) {
        session.check_out = now;
        session.duration_minutes = Math.round(
          (now - session.check_in) / (1000 * 60)
        );
        await session.save();
      }

      const allSessions = await AttendanceSession.find({
        attendance_id: att._id,
      });
      const totalMin = allSessions.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
      );

      att.has_active_session = false;
      att.last_check_out = now;
      att.work_hours = parseFloat((totalMin / 60).toFixed(2)) || att.work_hours;
      await att.save();

      await Notification.create({
        user_email: att.employee_email,
        title: 'Auto Checkout',
        message: `You were auto-checked out at ${now.toLocaleTimeString()}. Total: ${att.work_hours} hrs`,
        type: 'check_out',
        related_id: att._id.toString(),
      });

      closedCount++;
    }

    console.log(`[CRON] Auto-checkout closed ${closedCount} sessions`);
  } catch (err) {
    console.error('[CRON] Auto-checkout error:', err.message);
  }
};