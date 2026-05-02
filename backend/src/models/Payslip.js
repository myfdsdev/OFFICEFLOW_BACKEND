import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    employee_email: {
      type: String,
      required: [true, 'Employee email is required'],
    },
    employee_name: {
      type: String,
      required: [true, 'Employee name is required'],
    },
    month: {
      type: String,
      required: [true, 'Month (YYYY-MM) is required'],
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
    },
    currency: {
      type: String,
      default: 'INR',
    },

    // Earnings
    base_salary: {
      type: Number,
      default: 0,
    },
    allowances: {
      hra: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    overtime_hours: {
      type: Number,
      default: 0,
    },
    overtime_pay: {
      type: Number,
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },

    // Attendance Summary
    days_worked: {
      type: Number,
      default: 0,
    },
    days_present: {
      type: Number,
      default: 0,
    },
    days_late: {
      type: Number,
      default: 0,
    },
    days_half_day: {
      type: Number,
      default: 0,
    },
    days_absent: {
      type: Number,
      default: 0,
    },
    paid_leaves: {
      type: Number,
      default: 0,
    },
    unpaid_leaves: {
      type: Number,
      default: 0,
    },

    // Deductions
    late_deduction: {
      type: Number,
      default: 0,
    },
    half_day_deduction: {
      type: Number,
      default: 0,
    },
    absent_deduction: {
      type: Number,
      default: 0,
    },
    unpaid_leave_deduction: {
      type: Number,
      default: 0,
    },
    total_deductions: {
      type: Number,
      default: 0,
    },

    // Salary Summary
    gross_salary: {
      type: Number,
      default: 0,
    },
    net_salary: {
      type: Number,
      default: 0,
    },

    // Payment Status
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
    },
    payment_method: {
      type: String,
      default: '',
    },
    transaction_id: {
      type: String,
      default: '',
    },
    paid_date: {
      type: Date,
      default: null,
    },
    payslip_pdf_url: {
      type: String,
      default: '',
    },

    // Metadata
    generated_by: {
      type: String,
      default: '',
    },
    generated_at: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

// Unique compound index on user_id and month
payslipSchema.index({ user_id: 1, month: 1 }, { unique: true });
// Index for common queries
payslipSchema.index({ month: 1, status: 1 });
payslipSchema.index({ employee_email: 1, month: 1 });

export default mongoose.model('Payslip', payslipSchema);
