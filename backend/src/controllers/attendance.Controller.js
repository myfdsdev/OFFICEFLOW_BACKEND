import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Helper: determine status based on check-in time
const getCheckInStatus = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  // After 10:15 AM = late
  return totalMinutes > 615 ? "late" : "present";
};

// @desc    Check in
// @route   POST /api/attendance/check-in
// @access  Private
export const checkIn = asyncHandler(async (req, res) => {
  const user = req.user;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Prevent duplicate
  const existing = await Attendance.findOne({
    employee_email: user.email,
    date: today,
  });
  if (existing) {
    return res
      .status(400)
      .json({ error: "Attendance already marked for today" });
  }

  // Check if user is on approved leave today
  const onLeave = await LeaveRequest.findOne({
    employee_email: user.email,
    status: "approved",
    start_date: { $lte: today },
    end_date: { $gte: today },
  });
  if (onLeave) {
    return res.status(400).json({
      error: "You have approved leave today. Contact admin to cancel it first.",
    });
  }

  const now = new Date();
  const status = getCheckInStatus(now);
  const clockInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const attendance = await Attendance.create({
    employee_id: user._id,
    employee_email: user.email,
    employee_name: user.full_name,
    date: today,
    first_check_in: now,
    status,
    has_active_session: true,
    location: req.body.location || "",
  });

  // Notify user
  await Notification.create({
    user_email: user.email,
    title: "Check-in Successful",
    message: `You checked in at ${clockInTime}${status === "late" ? " (Late Entry)" : ""}`,
    type: "check_in",
    related_id: attendance._id.toString(),
  });

  // Notify admins
  const admins = await User.find({ role: "admin" }).select("email");
  const adminNotifications = admins.map((admin) => ({
    user_email: admin.email,
    title: `${user.full_name} checked in`,
    message: `Checked in at ${clockInTime}${status === "late" ? " (Late)" : ""}`,
    type: "check_in",
    related_id: attendance._id.toString(),
  }));
  if (adminNotifications.length)
    await Notification.insertMany(adminNotifications);

  res.status(201).json(attendance);
});

// @desc    Check out
// @route   POST /api/attendance/check-out
// @access  Private
export const checkOut = asyncHandler(async (req, res) => {
  const user = req.user;
  const today = new Date().toISOString().split("T")[0];

  const attendance = await Attendance.findOne({
    employee_email: user.email,
    date: today,
  });
  if (!attendance) {
    return res.status(404).json({ error: "No check-in found for today" });
  }
  if (!attendance.has_active_session) {
    return res.status(400).json({ error: "Already checked out" });
  }

  const now = new Date();
  const workHours = (now - attendance.first_check_in) / (1000 * 60 * 60); // hours

  attendance.last_check_out = now;
  attendance.has_active_session = false;
  attendance.work_hours = parseFloat(workHours.toFixed(2));
  await attendance.save();

  const checkOutTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  await Notification.create({
    user_email: user.email,
    title: "Check-out Successful",
    message: `You checked out at ${checkOutTime} (${workHours.toFixed(2)} hrs)`,
    type: "check_out",
    related_id: attendance._id.toString(),
  });

  res.json(attendance);
});

// @desc    Get my attendance history
// @route   GET /api/attendance/me
// @access  Private
export const getMyAttendance = asyncHandler(async (req, res) => {
  const { limit = 30, startDate, endDate, status } = req.query;

  const filter = { employee_email: req.user.email };
  if (startDate) filter.date = { ...filter.date, $gte: startDate };
  if (endDate) filter.date = { ...filter.date, $lte: endDate };
  if (status) filter.status = status;

  const attendance = await Attendance.find(filter)
    .sort("-date")
    .limit(parseInt(limit));

  res.json(attendance);
});

// @desc    Get today's attendance status for current user
// @route   GET /api/attendance/today
// @access  Private
export const getTodayAttendance = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const attendance = await Attendance.findOne({
    employee_email: req.user.email,
    date: today,
  });
  res.json(attendance || null);
});

// @desc    Get all attendance (admin, with filters)
// @route   GET /api/attendance
// @access  Private/Admin
export const getAllAttendance = asyncHandler(async (req, res) => {
  const {
    date,
    employee_email,
    status,
    startDate,
    endDate,
    limit = 100,
    page = 1,
  } = req.query;

  const filter = {};
  if (date) filter.date = date;
  if (employee_email) filter.employee_email = employee_email;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate) filter.date.$lte = endDate;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const records = await Attendance.find(filter)
    .sort("-date")
    .limit(parseInt(limit))
    .skip(skip);
  const total = await Attendance.countDocuments(filter);

  res.json({
    records,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// @desc    Filter attendance (matches base44 filter pattern)
// @route   GET /api/attendance/filter
// @access  Private
export const filterAttendance = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  delete filter.limit;
  delete filter.sort;

  // Handle date range passed as object: date[$gte], date[$lte]
  if (filter.date && typeof filter.date === 'object') {
    const dateRange = {};
    if (filter.date.$gte) dateRange.$gte = filter.date.$gte;
    if (filter.date.$lte) dateRange.$lte = filter.date.$lte;
    if (filter.date.$gt) dateRange.$gt = filter.date.$gt;
    if (filter.date.$lt) dateRange.$lt = filter.date.$lt;
    filter.date = dateRange;
  }

  const sort = req.query.sort || '-date';
  const limit = parseInt(req.query.limit) || 100;

  const records = await Attendance.find(filter).sort(sort).limit(limit);
  res.json(records);
});

// @desc    Get attendance by ID
// @route   GET /api/attendance/:id
// @access  Private
export const getAttendanceById = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) {
    return res.status(404).json({ error: "Attendance not found" });
  }
  res.json(attendance);
});

// @desc    Update attendance (admin — manual edit)
// @route   PUT /api/attendance/:id
// @access  Private/Admin
export const updateAttendance = asyncHandler(async (req, res) => {
  const updates = req.body;

  // Recalc work_hours if both times provided
  if (updates.first_check_in && updates.last_check_out) {
    const inTime = new Date(updates.first_check_in);
    const outTime = new Date(updates.last_check_out);
    updates.work_hours = parseFloat(
      ((outTime - inTime) / (1000 * 60 * 60)).toFixed(2),
    );
  }

  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    updates,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!attendance) {
    return res.status(404).json({ error: "Attendance not found" });
  }

  res.json(attendance);
});

// @desc    Delete attendance (admin)
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
export const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByIdAndDelete(req.params.id);
  if (!attendance) {
    return res.status(404).json({ error: "Attendance not found" });
  }
  res.json({ message: "Attendance deleted" });
});

// @desc    Create attendance manually (admin — e.g. mark someone present retroactively)
// @route   POST /api/attendance
// @access  Private/Admin
export const createAttendance = asyncHandler(async (req, res) => {
  const user = req.user;
  const isAdmin = user.role === "admin";

  // If not admin, force the attendance to be for themselves
  const employeeEmail = isAdmin
    ? req.body.employee_email || user.email
    : user.email;
  const employeeId = isAdmin ? req.body.employee_id || user._id : user._id;
  const employeeName = isAdmin
    ? req.body.employee_name || user.full_name
    : user.full_name;

  const { date, status, notes, first_check_in, has_active_session, location } =
    req.body;

  if (!date) {
    return res.status(400).json({ error: "date is required" });
  }

  const existing = await Attendance.findOne({
    employee_email: employeeEmail,
    date,
  });
  if (existing) {
    return res
      .status(400)
      .json({ error: "Attendance already exists for this date" });
  }

  const attendance = await Attendance.create({
    employee_id: employeeId,
    employee_email: employeeEmail,
    employee_name: employeeName,
    date,
    status: status || "present",
    notes: notes || "",
    first_check_in: first_check_in || new Date(),
    has_active_session: has_active_session ?? true,
    location: location || "",
  });

  res.status(201).json(attendance);
});

// @desc    Get attendance stats (for dashboard)
// @route   GET /api/attendance/stats
// @access  Private
export const getAttendanceStats = asyncHandler(async (req, res) => {
  const { employee_email, startDate, endDate } = req.query;
  const email = employee_email || req.user.email;

  const filter = { employee_email: email };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate) filter.date.$lte = endDate;
  }

  const records = await Attendance.find(filter);

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    absent: records.filter((r) => r.status === "absent").length,
    on_leave: records.filter((r) => r.status === "on_leave").length,
    half_day: records.filter((r) => r.status === "half_day").length,
    total_hours: records
      .reduce((sum, r) => sum + (r.work_hours || 0), 0)
      .toFixed(2),
  };

  res.json(stats);
});
