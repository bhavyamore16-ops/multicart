import mongoose from 'mongoose';

const checkoutItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const checkoutSessionSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkoutKey: { type: String, required: true, trim: true },
  masterOrderId: { type: String, required: true, unique: true },
  paymentMethod: { type: String, enum: ['cod', 'razorpay'], required: true },
  status: {
    type: String,
    enum: ['processing', 'creating_payment', 'pending_payment', 'placed', 'payment_failed', 'refund_pending', 'refunded'],
    required: true,
    index: true
  },
  items: { type: [checkoutItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  shippingCost: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  shippingAddress: { type: mongoose.Schema.Types.Mixed, required: true },
  contactEmail: { type: String, required: true, trim: true, lowercase: true },
  contactPhone: { type: String, required: true },
  razorpayOrderId: { type: String, default: '', index: true },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignatureVerified: { type: Boolean, default: false },
  orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  expiresAt: { type: Date, default: null },
  failureReason: { type: String, default: '' }
}, { timestamps: true });

checkoutSessionSchema.index({ customer: 1, checkoutKey: 1 }, { unique: true });

const CheckoutSession = mongoose.models.CheckoutSession || mongoose.model('CheckoutSession', checkoutSessionSchema);
export default CheckoutSession;
