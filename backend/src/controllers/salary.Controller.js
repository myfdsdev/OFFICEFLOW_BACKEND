import SalaryConfig from '../models/SalaryConfig.js';
import Payslip from '../models/Payslip.js';
import User from '../models/User.js';
import AppSettings from '../models/AppSettings.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  calculateSalaryForUser,
  calculateSalariesForMonth,
} from '../utils/salaryCalculator.js';
import { generatePayslipPDF } from '../utils/payslipGenerator.js';
import { sendSalaryPaidEmail } from '../utils/sendEmail.js';
import { emitNotification } from '../sockets/index.js';

// @desc    Get all salary configs (admin only)
// @route   GET /api/salary/config
// @access  Admin
export const getAllSalaryConfigs = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Only admins can view salary configs' });
  }

  const configs = await SalaryConfig.find().populate('user_id', 'full_name email employee_id department');
  res.json(configs);
});

// @desc    Get salary config for a specific user (admin or own user)
// @route   GET /api/salary/config/:userId
// @access  Admin or own user
export const getSalaryConfig = asyncHandler(async (req, res) => {
  const userId = req.params.userId === 'me' ? req.user._id.toString() : req.params.userId;

  if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const config = await SalaryConfig.findOne({ user_id: userId }).populate(
    'user_id',
    'full_name email employee_id department'
  );

  if (!config) {
    return res.status(404).json({ error: 'Salary config not found' });
  }

  res.json(config);
});

// @desc    Create or update salary config (admin only)
// @route   POST /api/salary/config
// @access  Admin
export const createOrUpdateSalaryConfig = asyncHandler(
  async (req, res) => {
    if (req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Only admins can manage salary configs' });
    }

    const { base_salary, allowances, bonuses, effective_from } = req.body;
    const user_id = req.body.user_id || req.params.userId;

    if (!user_id || !base_salary) {
      return res
        .status(400)
        .json({ error: 'user_id and base_salary are required' });
    }

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let config = await SalaryConfig.findOne({ user_id });

    if (config) {
      // Update existing
      config.base_salary = base_salary;
      if (allowances) config.allowances = { ...config.allowances, ...allowances };
      if (bonuses !== undefined) config.bonuses = bonuses;
      if (effective_from) config.effective_from = effective_from;
    } else {
      // Create new
      config = new SalaryConfig({
        user_id,
        base_salary,
        allowances: allowances || {},
        bonuses: bonuses || 0,
        effective_from: effective_from || new Date(),
      });
    }

    config.updated_by = req.user.email;
    await config.save();

    res.json(config);
  }
);

// @desc    Get salary board for a month (all employees with calculations)
// @route   GET /api/salary/board
// @access  Admin
export const getSalaryBoard = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view salary board' });
  }

  const { month = new Date().toISOString().slice(0, 7) } = req.query;

  // Get all users with salary config
  const configs = await SalaryConfig.find().populate('user_id');

  if (!configs.length) {
    return res.json([]);
  }

  const results = [];

  for (const config of configs) {
    if (!config.user_id) continue;

    try {
      const calcData = await calculateSalaryForUser(
        config.user_id._id.toString(),
        month
      );

      // Check if payslip exists
      const payslip = await Payslip.findOne({
        user_id: config.user_id._id,
        month,
      });

      results.push({
        user: {
          _id: config.user_id._id,
          full_name: config.user_id.full_name,
          email: config.user_id.email,
          employee_id: config.user_id.employee_id,
        },
        calcData,
        payslip_status: payslip ? payslip.status : 'none',
        payslip_id: payslip?._id,
      });
    } catch (error) {
      console.error(
        `Error calculating salary for ${config.user_id.email}:`,
        error.message
      );
    }
  }

  res.json(results);
});

// @desc    Get detailed salary breakdown for a user
// @route   GET /api/salary/breakdown/:userId
// @access  Admin or own user
export const getSalaryBreakdown = asyncHandler(async (req, res) => {
  const userId = req.params.userId === 'me' ? req.user._id.toString() : req.params.userId;
  const { month = new Date().toISOString().slice(0, 7) } = req.query;

  if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const calcData = await calculateSalaryForUser(userId, month);
  res.json(calcData);
});

// @desc    Generate payslip for a user
// @route   POST /api/salary/payslip/generate
// @access  Admin
export const generatePayslip = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can generate payslips' });
  }

  const { user_id, month } = req.body;

  if (!user_id || !month) {
    return res.status(400).json({ error: 'user_id and month are required' });
  }

  // Calculate salary
  const calcData = await calculateSalaryForUser(user_id, month);

  // Find or create payslip
  let payslip = await Payslip.findOne({ user_id, month });

  if (!payslip) {
    payslip = new Payslip();
  }

  // Update payslip with calculated data
  Object.assign(payslip, calcData, {
    status: payslip.status === 'paid' ? 'paid' : 'draft',
    generated_by: req.user.email,
    generated_at: new Date(),
  });

  await payslip.save();

  res.json(payslip);
});

// @desc    Generate payslips for all employees
// @route   POST /api/salary/payslip/generate-bulk
// @access  Admin
export const generatePayslipBulk = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can generate payslips' });
  }

  const { month = new Date().toISOString().slice(0, 7) } = req.body;

  const calcResults = await calculateSalariesForMonth(month);

  const payslips = [];

  for (const calcData of calcResults) {
    let payslip = await Payslip.findOne({
      user_id: calcData.user_id,
      month,
    });

    if (!payslip) {
      payslip = new Payslip();
    }

    Object.assign(payslip, calcData, {
      status: payslip.status === 'paid' ? 'paid' : 'draft',
      generated_by: req.user.email,
      generated_at: new Date(),
    });

    await payslip.save();
    payslips.push(payslip);
  }

  res.json({ message: `Generated ${payslips.length} payslips`, payslips });
});

// @desc    Approve a payslip
// @route   PUT /api/salary/payslip/:id/approve
// @access  Admin
export const approvePayslip = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can approve payslips' });
  }

  const payslip = await Payslip.findByIdAndUpdate(
    req.params.id,
    { status: 'approved' },
    { new: true }
  );

  if (!payslip) {
    return res.status(404).json({ error: 'Payslip not found' });
  }

  res.json(payslip);
});

// @desc    Mark payslip as paid
// @route   PUT /api/salary/payslip/:id/mark-paid
// @access  Admin
export const markPayslipAsPaid = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can mark payslips paid' });
  }

  const { payment_method, transaction_id, paid_date } = req.body;

  const payslip = await Payslip.findById(req.params.id);
  if (!payslip) {
    return res.status(404).json({ error: 'Payslip not found' });
  }

  payslip.status = 'paid';
  payslip.payment_method = payment_method || '';
  payslip.transaction_id = transaction_id || '';
  payslip.paid_date = paid_date || new Date();

  // Generate PDF
  try {
    const user = await User.findById(payslip.user_id);
    const appSettings = await AppSettings.getSingleton();

    const pdfUrl = await generatePayslipPDF(payslip, user, appSettings);
    payslip.payslip_pdf_url = pdfUrl;

    await payslip.save();

    // Send email to employee
    try {
      await sendSalaryPaidEmail(
        payslip.employee_email,
        payslip.employee_name,
        payslip.month,
        payslip.net_salary,
        payslip.payment_method,
        payslip.transaction_id,
        payslip.paid_date,
        pdfUrl,
        appSettings.currency_symbol
      );
    } catch (emailError) {
      console.error('Error sending salary email:', emailError.message);
    }

    // Create notification
    try {
      const notification = await Notification.create({
        user_email: payslip.employee_email,
        title: 'Salary Paid',
        message: `Your salary for ${payslip.month} has been paid. View your payslip.`,
        type: 'salary',
        is_read: false,
      });
      emitNotification(payslip.employee_email, notification);
    } catch (notifError) {
      console.error('Error creating notification:', notifError.message);
    }

    try {
      const { getIO } = await import('../sockets/index.js');
      const io = getIO();
      io?.emit('salary_paid', {
        payslip_id: payslip._id,
        user_id: payslip.user_id,
        month: payslip.month,
        status: payslip.status,
      });
    } catch (socketError) {
      console.error('Error emitting salary paid event:', socketError.message);
    }

    res.json(payslip);
  } catch (error) {
    console.error('Error marking payslip as paid:', error);
    return res.status(500).json({
      error: 'Failed to mark payslip as paid',
      message: error.message,
    });
  }
});

// @desc    Get all payslips with filters
// @route   GET /api/salary/payslips
// @access  Admin
export const getAllPayslips = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view all payslips' });
  }

  const { month, status, user_id } = req.query;

  const filter = {};
  if (month) filter.month = month;
  if (status) filter.status = status;
  if (user_id) filter.user_id = user_id;

  const payslips = await Payslip.find(filter)
    .populate('user_id', 'full_name email employee_id')
    .sort({ month: -1, employee_name: 1 });

  res.json(payslips);
});

// @desc    Get current user's payslips
// @route   GET /api/salary/payslips/me
// @access  User
export const getMyPayslips = asyncHandler(async (req, res) => {
  const payslips = await Payslip.find({ user_id: req.user._id }).sort({
    month: -1,
  });

  res.json(payslips);
});

// @desc    Get a specific payslip
// @route   GET /api/salary/payslips/:id
// @access  Admin or own user
export const getPayslip = asyncHandler(async (req, res) => {
  const payslip = await Payslip.findById(req.params.id).populate(
    'user_id',
    'full_name email employee_id department'
  );

  if (!payslip) {
    return res.status(404).json({ error: 'Payslip not found' });
  }

  if (
    req.user.role !== 'admin' &&
    req.user._id.toString() !== payslip.user_id._id.toString()
  ) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  res.json(payslip);
});

// @desc    Delete a payslip (admin only, only if draft)
// @route   DELETE /api/salary/payslips/:id
// @access  Admin
export const deletePayslip = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete payslips' });
  }

  const payslip = await Payslip.findById(req.params.id);

  if (!payslip) {
    return res.status(404).json({ error: 'Payslip not found' });
  }

  if (payslip.status !== 'draft') {
    return res
      .status(400)
      .json({ error: 'Can only delete draft payslips' });
  }

  await Payslip.findByIdAndDelete(req.params.id);

  res.json({ message: 'Payslip deleted' });
});
