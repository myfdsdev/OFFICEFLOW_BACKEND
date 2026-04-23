import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  company_name: {
    type: String,
    required: true,
    trim: true,
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner_email: { type: String, required: true },
  subscription_plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free',
  },
  subscription_status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired'],
    default: 'active',
  },
  payment_method: { type: String, default: '' },
  stripe_customer_id: { type: String, default: '' },
  logo: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },
  max_users: { type: Number, default: 5 },
}, { timestamps: true });

export default mongoose.model('Company', companySchema);