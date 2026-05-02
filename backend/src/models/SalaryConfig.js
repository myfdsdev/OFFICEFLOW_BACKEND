import mongoose from 'mongoose';

const salaryConfigSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    base_salary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: [0, 'Base salary cannot be negative'],
    },
    allowances: {
      hra: {
        type: Number,
        default: 0,
      },
      travel: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },
    bonuses: {
      type: Number,
      default: 0,
    },
    effective_from: {
      type: Date,
      default: () => new Date(),
    },
    effective_until: {
      type: Date,
      default: null,
    },
    updated_by: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('SalaryConfig', salaryConfigSchema);
