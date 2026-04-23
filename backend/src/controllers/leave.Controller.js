import LeaveRequest from "../models/LeaveRequest.js";
import Attendance from "../models/Attendance.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendLeaveApprovalEmail } from "../utils/sendEmail.js";

// Helper: calculate days between two dates (inclusive)
const calculateDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// @desc    Create leave request
// @route   POST /api/leave
// @access  Private
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  const user = req.user;

  if (!leave_type || !start_date || !end_date || !reason) {
    return res.status(400).json({
      error: "leave_type, start_date, end_date, and reason are required",
    });
  }

  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ error: "End date must be after start date" });
  }

  const total_days = calculateDays(start_date, end_date);

  const leave = await LeaveRequest.create({
    employee_id: user._id,
    employee_email: user.email,
    employee_name: user.full_name,
    leave_type,
    start_date,
    end_date,
    reason,
    total_days,
    status: "pending",
  });

  // Notify user
  await Notification.create({
    user_email: user.email,
    title: "Leave Request Submitted",
    message: `Your ${leave_type} leave from ${start_date} to ${end_date} is pending approval.`,
    type: "leave_submitted",
    related_id: leave._id.toString(),
  });

  // Notify admins
  const admins = await User.find({ role: "admin" }).select("email");
  if (admins.length) {
    await Notification.insertMany(
      admins.map((admin) => ({
        user_email: admin.email,
        title: "New Leave Request",
        message: `${user.full_name} requested ${leave_type} leave from ${start_date} to ${end_date}`,
        type: "leave_submitted",
        related_id: leave._id.toString(),
      })),
    );
  }

  res.status(201).json(leave);
});

// @desc    Get my leave requests
// @route   GET /api/leave/me
// @access  Private
export const getMyLeaves = asyncHandler(async (req, res) => {
  const { status, limit = 50, sort = "-createdAt" } = req.query;

  const filter = { employee_email: req.user.email };
  if (status) filter.status = status;

  const leaves = await LeaveRequest.find(filter)
    .sort(sort)
    .limit(parseInt(limit));

  res.json(leaves);
});

// @desc    Get all leave requests (admin)
// @route   GET /api/leave
// @access  Private/Admin
export const getAllLeaves = asyncHandler(async (req, res) => {
  const {
    status,
    employee_email,
    leave_type,
    sort = "-createdAt",
    limit = 100,
    page = 1,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (employee_email) filter.employee_email = employee_email;
  if (leave_type) filter.leave_type = leave_type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const leaves = await LeaveRequest.find(filter)
    .sort(sort)
    .limit(parseInt(limit))
    .skip(skip);
  const total = await LeaveRequest.countDocuments(filter);

  res.json({
    leaves,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// @desc    Filter leave requests (base44 pattern)
// @route   GET /api/leave/filter
// @access  Private
export const filterLeaves = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  delete filter.sort;
  delete filter.limit;

  const sort = req.query.sort || "-createdAt";
  const limit = parseInt(req.query.limit) || 100;

  const leaves = await LeaveRequest.find(filter).sort(sort).limit(limit);
  res.json(leaves);
});

// @desc    Get leave request by ID
// @route   GET /api/leave/:id
// @access  Private
export const getLeaveById = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    return res.status(404).json({ error: "Leave request not found" });
  }

  // Users can only see their own, admins can see any
  if (req.user.role !== "admin" && leave.employee_email !== req.user.email) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json(leave);
});

// @desc    Approve leave request (admin)
// @route   PUT /api/leave/:id/approve
// @access  Private/Admin
export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    return res.status(404).json({ error: "Leave request not found" });
  }
  if (leave.status !== "pending") {
    return res.status(400).json({ error: `Leave is already ${leave.status}` });
  }

  leave.status = "approved";
  leave.approved_by = req.user.full_name;
  leave.approved_at = new Date();
  await leave.save();

  // Auto-mark attendance as on_leave for each day in range
  const start = new Date(leave.start_date);
  const end = new Date(leave.end_date);
  const attendanceRecords = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const existing = await Attendance.findOne({
      employee_email: leave.employee_email,
      date: dateStr,
    });

    if (!existing) {
      attendanceRecords.push({
        employee_id: leave.employee_id,
        employee_email: leave.employee_email,
        employee_name: leave.employee_name,
        date: dateStr,
        status: "on_leave",
        notes: `Leave: ${leave.leave_type}`,
        has_active_session: false,
      });
    }
  }

  if (attendanceRecords.length) {
    await Attendance.insertMany(attendanceRecords);
  }

  // Notify employee
  await Notification.create({
    user_email: leave.employee_email,
    title: "Leave Request Approved",
    message: `Your ${leave.leave_type} leave from ${leave.start_date} to ${leave.end_date} has been approved.`,
    type: "leave_approved",
    related_id: leave._id.toString(),
  });

  // Send email (fire & forget)
  sendLeaveApprovalEmail(
    leave.employee_email,
    leave.employee_name,
    leave.leave_type,
    leave.start_date,
    leave.end_date,
    "approved",
  ).catch((err) => console.error("Email error:", err.message));

  res.json(leave);
});

// @desc    Reject leave request (admin)
// @route   PUT /api/leave/:id/reject
// @access  Private/Admin
export const rejectLeave = asyncHandler(async (req, res) => {
  const { rejection_reason } = req.body;

  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    return res.status(404).json({ error: "Leave request not found" });
  }
  if (leave.status !== "pending") {
    return res.status(400).json({ error: `Leave is already ${leave.status}` });
  }

  leave.status = "rejected";
  leave.rejection_reason = rejection_reason || "No reason provided";
  leave.approved_by = req.user.full_name;
  leave.approved_at = new Date();
  await leave.save();

  // Notify employee
  await Notification.create({
    user_email: leave.employee_email,
    title: "Leave Request Rejected",
    message: `Your ${leave.leave_type} leave from ${leave.start_date} to ${leave.end_date} has been rejected. Reason: ${leave.rejection_reason}`,
    type: "leave_rejected",
    related_id: leave._id.toString(),
  });

  // Send email
  sendLeaveApprovalEmail(
    leave.employee_email,
    leave.employee_name,
    leave.leave_type,
    leave.start_date,
    leave.end_date,
    "rejected",
  ).catch((err) => console.error("Email error:", err.message));

  res.json(leave);
});

// @desc    Update leave request (user can only update pending, admin can update any)
// @route   PUT /api/leave/:id
// @access  Private
export const updateLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    return res.status(404).json({ error: "Leave request not found" });
  }

  // Permission check
  const isOwner = leave.employee_email === req.user.email;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Users can only edit pending requests
  if (isOwner && !isAdmin && leave.status !== "pending") {
    return res
      .status(400)
      .json({ error: "Cannot edit approved/rejected requests" });
  }

  // Admins can update status fields; regular users cannot
  const allowedFields = isAdmin
    ? [
        "leave_type",
        "start_date",
        "end_date",
        "reason",
        "status",
        "reviewed_by",
        "reviewed_at",
        "approved_by",
        "approved_at",
        "rejection_reason",
        "total_days",
      ]
    : ["leave_type", "start_date", "end_date", "reason"];

  // Apply allowed field updates
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      leave[field] = req.body[field];
    }
  });

  // Recalc days if dates changed
  if (req.body.start_date || req.body.end_date) {
    leave.total_days = calculateDays(leave.start_date, leave.end_date);
  }

  await leave.save();

  // If admin approved/rejected, create notification
  const isAdmin = req.user.role === "admin";
  if (isAdmin && req.body.status === "approved") {
    await (await import('../models/Notification.js')).default.create({
      user_email: leave.employee_email,
      title: 'Leave Approved',
      message: `Your ${leave.leave_type} leave has been approved.`,
      type: 'leave_approved',
      related_id: leave._id.toString(),
    });
  }
  if (isAdmin && req.body.status === "rejected") {
    await (await import('../models/Notification.js')).default.create({
      user_email: leave.employee_email,
      title: 'Leave Rejected',
      message: `Your ${leave.leave_type} leave was rejected.`,
      type: 'leave_rejected',
      related_id: leave._id.toString(),
    });
  }

  res.json(leave);
});

// @desc    Cancel/delete leave request
// @route   DELETE /api/leave/:id
// @access  Private
export const deleteLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    return res.status(404).json({ error: "Leave request not found" });
  }

  const isOwner = leave.employee_email === req.user.email;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Access denied" });
  }

  // If approved leave is deleted, also remove the auto-generated attendance records
  if (leave.status === "approved") {
    await Attendance.deleteMany({
      employee_email: leave.employee_email,
      date: { $gte: leave.start_date, $lte: leave.end_date },
      status: "on_leave",
    });
  }

  await leave.deleteOne();
  res.json({ message: "Leave request deleted" });
});

// @desc    Get leave stats
// @route   GET /api/leave/stats
// @access  Private
export const getLeaveStats = asyncHandler(async (req, res) => {
  const { employee_email } = req.query;
  const email = employee_email || req.user.email;

  const leaves = await LeaveRequest.find({ employee_email: email });

  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
    total_days_approved: leaves
      .filter((l) => l.status === "approved")
      .reduce((sum, l) => sum + (l.total_days || 0), 0),
    by_type: {
      sick: leaves.filter((l) => l.leave_type === "sick").length,
      casual: leaves.filter((l) => l.leave_type === "casual").length,
      annual: leaves.filter((l) => l.leave_type === "annual").length,
      unpaid: leaves.filter((l) => l.leave_type === "unpaid").length,
      maternity: leaves.filter((l) => l.leave_type === "maternity").length,
      other: leaves.filter((l) => l.leave_type === "other").length,
    },
  };

  res.json(stats);
});
