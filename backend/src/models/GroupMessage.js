import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  group_name: { type: String, required: true },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender_email: { type: String, required: true },
  sender_name: { type: String, required: true },
  message_text: { type: String, required: true },
  is_edited: { type: Boolean, default: false },
  edited_at: { type: Date },
  is_deleted: { type: Boolean, default: false },
  read_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachment_url: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('GroupMessage', groupMessageSchema);