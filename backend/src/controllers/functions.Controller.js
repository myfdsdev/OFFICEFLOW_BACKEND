import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import MessageReminder from '../models/MessageReminder.js';
import Notification from '../models/Notification.js';
import Subscription from '../models/Subscription.js';
import Company from '../models/Company.js';
import Message from '../models/Message.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getIO } from '../sockets/index.js';

// ==========================================
// 1. calculateAttendance — compute work hours from sessions
// POST /api/functions/calculate-attendance
// ==========================================
export const calculateAttendance = asyncHandler(async (req, res) => {
  const { employee_id, date } = req.body;

  if (!employee_id || !date) {
    return res.status(400).json({ error: 'employee_id and date required' });
  }

  const sessions = await AttendanceSession.find({ date });
  const mySessions = sessions.filter(
    (s) => s.attendance_id && s.employee_email
  );

  // Match by attendance record (since we store attendance_id, not employee_id on session)
  const attendance = await Attendance.findOne({
    employee_id,
    date,
  });

  if (!attendance) {
    return res.status(404).json({ error: 'Attendance not found' });
  }

  const attendanceSessions = await AttendanceSession.find({
    attendance_id: attendance._id,
  });

  if (!attendanceSessions.length) {
    return res.json({ message: 'No sessions found' });
  }

  let totalWorkMinutes = 0;
  let firstCheckIn = null;
  let lastCheckOut = null;
  let hasActiveSession = false;

  for (const s of attendanceSessions) {
    if (!s.check_out) hasActiveSession = true;
    if (s.duration_minutes) totalWorkMinutes += s.duration_minutes;

    if (!firstCheckIn || new Date(s.check_in) < new Date(firstCheckIn)) {
      firstCheckIn = s.check_in;
    }
    if (s.check_out && (!lastCheckOut || new Date(s.check_out) > new Date(lastCheckOut))) {
      lastCheckOut = s.check_out;
    }
  }

  const totalWorkHours = parseFloat((totalWorkMinutes / 60).toFixed(2));

  // Status based on hours worked
  let status = 'absent';
  if (totalWorkHours >= 9) status = 'present';
  else if (totalWorkHours >= 4.5) status = 'half_day';

  // Late check: first check-in after 10:15 AM
  if (firstCheckIn) {
    const inTime = new Date(firstCheckIn);
    const totalMin = inTime.getHours() * 60 + inTime.getMinutes();
    if (totalMin > 615 && status === 'present') status = 'late';
  }

  attendance.work_hours = totalWorkHours;
  attendance.first_check_in = firstCheckIn;
  attendance.last_check_out = lastCheckOut;
  attendance.has_active_session = hasActiveSession;
  attendance.status = status;
  await attendance.save();

  res.json({
    success: true,
    attendance_id: attendance._id,
    total_work_hours: totalWorkHours,
    status,
    sessions_count: attendanceSessions.length,
  });
});

// ==========================================
// 2. checkMessageReminders — trigger due reminders
// POST /api/functions/check-message-reminders
// Admin or cron
// ==========================================
export const checkMessageReminders = asyncHandler(async (req, res) => {
  const now = new Date();

  const dueReminders = await MessageReminder.find({
    is_triggered: false,
    reminder_time: { $lte: now },
  });

  let triggered = 0;
  for (const reminder of dueReminders) {
    const user = await User.findById(reminder.user_id);
    if (!user) continue;

    await Notification.create({
      user_email: user.email,
      title: 'Message Reminder',
      message: `Reminder: ${reminder.message_text.substring(0, 100)}`,
      type: 'general',
      related_id: reminder.message_id.toString(),
    });

    reminder.is_triggered = true;
    reminder.triggered_at = new Date();
    await reminder.save();
    triggered++;

    // Real-time push
    try {
      getIO().to(`user_${user._id}`).emit('reminder_triggered', reminder);
    } catch {}
  }

  res.json({
    success: true,
    triggered,
    message: `Triggered ${triggered} reminders`,
  });
});

// ==========================================
// 3. exportAttendanceReport — PDF or Excel
// POST /api/functions/export-attendance-report
// Admin only
// Body: { month: "2025-04", format: "pdf" | "excel" }
// ==========================================
export const exportAttendanceReport = asyncHandler(async (req, res) => {
  const { month, format = 'pdf' } = req.body;

  if (!month) {
    return res.status(400).json({ error: 'month (YYYY-MM) required' });
  }

  // Get employees
  const employees = await User.find({ role: 'user' }).sort('full_name');

  // Get attendance in date range
  const attendance = await Attendance.find({
    date: { $gte: `${month}-01`, $lte: `${month}-31` },
  });

  // Build rows
  const rows = employees.map((emp) => {
    const records = attendance.filter((a) => a.employee_email === emp.email);
    return {
      name: emp.full_name,
      email: emp.email,
      department: emp.department || '-',
      present: records.filter((a) => a.status === 'present').length,
      late: records.filter((a) => a.status === 'late').length,
      half_day: records.filter((a) => a.status === 'half_day').length,
      on_leave: records.filter((a) => a.status === 'on_leave').length,
      absent: records.filter((a) => a.status === 'absent').length,
      total: records.length,
      total_hours: records.reduce((sum, a) => sum + (a.work_hours || 0), 0).toFixed(2),
    };
  });

  // ========== PDF ==========
  if (format === 'pdf') {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Attendance Report - ${month}`, 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Employee', 'Dept', 'Present', 'Late', 'Half', 'Leave', 'Total', 'Hours']],
      body: rows.map((r) => [
        r.name,
        r.department,
        r.present,
        r.late,
        r.half_day,
        r.on_leave,
        r.total,
        r.total_hours,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance-${month}.pdf`
    );
    return res.send(pdfBuffer);
  }

  // ========== EXCEL ==========
  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Attendance ${month}`);

    sheet.columns = [
      { header: 'Employee', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Present', key: 'present', width: 10 },
      { header: 'Late', key: 'late', width: 10 },
      { header: 'Half Day', key: 'half_day', width: 10 },
      { header: 'On Leave', key: 'on_leave', width: 10 },
      { header: 'Absent', key: 'absent', width: 10 },
      { header: 'Total Days', key: 'total', width: 12 },
      { header: 'Total Hours', key: 'total_hours', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    rows.forEach((row) => sheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance-${month}.xlsx`
    );
    return res.send(Buffer.from(buffer));
  }

  // ========== JSON (default) ==========
  res.json({ month, rows, generated_at: new Date() });
});

// ==========================================
// 4. notifyNewMessage — trigger notification for new message
// (Usually auto-handled in messageController.sendMessage now,
// but keeping as a webhook-style endpoint for consistency)
// POST /api/functions/notify-new-message
// ==========================================
export const notifyNewMessage = asyncHandler(async (req, res) => {
  const { message_id } = req.body;

  if (!message_id) {
    return res.status(400).json({ error: 'message_id required' });
  }

  const message = await Message.findById(message_id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  const notification = await Notification.create({
    user_email: message.receiver_email,
    title: 'New Message',
    message: `${message.sender_name}: ${message.message_text.substring(0, 50)}${
      message.message_text.length > 50 ? '...' : ''
    }`,
    type: 'new_message',
    related_id: message.sender_id.toString(),
  });

  // Real-time push
  try {
    getIO().to(`user_${message.receiver_id}`).emit('new_notification', notification);
  } catch {}

  res.json({ success: true, notified: message.receiver_email });
});

// ==========================================
// 5. processPayment — handle PayPal/Razorpay-style payment
// POST /api/functions/process-payment
// Body: { subscription_id, payment_method, amount, transaction_id? }
// ==========================================
export const processPayment = asyncHandler(async (req, res) => {
  const { subscription_id, payment_method, amount, transaction_id } = req.body;

  if (!subscription_id || !payment_method) {
    return res.status(400).json({ error: 'subscription_id and payment_method required' });
  }

  const sub = await Subscription.findById(subscription_id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  const company = await Company.findById(sub.company_id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  // Permission check
  if (company.owner_email !== req.user.email && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Generate transaction ID if not provided
  let finalTxnId = transaction_id;
  if (!finalTxnId) {
    const prefix = payment_method === 'PayPal' ? 'PP' : payment_method === 'Razorpay' ? 'RZP' : 'TXN';
    finalTxnId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Update subscription
  sub.status = 'active';
  sub.payment_method = payment_method;
  if (amount) sub.price = amount;
  await sub.save();

  // Update company
  company.subscription_status = 'active';
  company.subscription_plan = sub.plan;
  company.payment_method = payment_method;
  await company.save();

  res.json({
    success: true,
    transaction_id: finalTxnId,
    subscription: sub,
    company: { id: company._id, status: company.subscription_status },
  });
});

// ==========================================
// 6. sendAttendanceReminder — notify non-checked-in employees
// POST /api/functions/send-attendance-reminder
// Admin or cron
// ==========================================
export const sendAttendanceReminder = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // All employees (non-admin)
  const employees = await User.find({ role: 'user' });

  // Today's attendance
  const todayAttendance = await Attendance.find({ date: today });
  const attendedEmails = todayAttendance.map((a) => a.employee_email);

  // Employees without attendance
  const missing = employees.filter((e) => !attendedEmails.includes(e.email));

  const notifications = await Notification.insertMany(
    missing.map((emp) => ({
      user_email: emp.email,
      title: 'Attendance Reminder',
      message: "Please mark your attendance for today. It's already past 10:30 AM.",
      type: 'attendance_reminder',
    }))
  );

  // Real-time push
  try {
    const io = getIO();
    missing.forEach((emp, i) => {
      io.to(`user_${emp._id}`).emit('new_notification', notifications[i]);
    });
  } catch {}

  res.json({
    success: true,
    reminders_sent: notifications.length,
    employees_reminded: missing.map((e) => e.email),
  });
});

// ==========================================
// 7. getUsersForMessaging — already in userController
// But adding here as a function alias for consistency with base44 naming
// POST /api/functions/get-users-for-messaging
// ==========================================
export const getUsersForMessaging = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select('_id email full_name profile_photo department role is_online last_active')
    .sort('full_name');

  res.json(users);
});