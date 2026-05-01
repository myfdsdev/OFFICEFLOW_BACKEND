import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
      unique: true,
    },
    start_time: {
      type: String,
      required: true,
      default: '09:00',
    },
    end_time: {
      type: String,
      required: true,
      default: '18:00',
    },
    created_by: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Shift', shiftSchema);
