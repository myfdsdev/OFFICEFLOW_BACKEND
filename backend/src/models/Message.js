import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sender_email: { type: String, required: true },
    sender_name: { type: String, required: true },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver_email: { type: String, required: true },
    receiver_name: { type: String, required: true },
    message_text: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    is_edited: { type: Boolean, default: false },
    edited_at: { type: Date },
    is_pinned: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    muted_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachment_url: { type: String, default: '' },
    attachment_type: { type: String, default: '' },
}, { timestamps: true });

// Index for faster chat queries between two users
messageSchema.index({ sender_id: 1, receiver_id: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);