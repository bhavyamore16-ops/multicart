import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String, required: true, trim: true, lowercase: true, maxlength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.']
  },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['new', 'in_progress', 'resolved'], default: 'new', index: true },
  adminReply: { type: String, trim: true, maxlength: 5000, default: '' }
}, { timestamps: true });

contactMessageSchema.index({ createdAt: -1 });

export default mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactMessageSchema);
