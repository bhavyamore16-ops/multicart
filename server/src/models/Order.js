import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  thumbnail: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, default: 'India', trim: true },
  phone: { type: String, required: true, trim: true }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    required: true
  },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['customer', 'vendor', 'admin', 'system'], default: 'system' },
  note: { type: String, default: '' },
  at: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, trim: true },
  masterOrderId: { type: String, required: true, index: true },
  checkoutSession: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckoutSession', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  shippingCost: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  masterSubtotal: { type: Number, required: true, min: 0 },
  masterShippingCost: { type: Number, default: 0, min: 0 },
  masterTotal: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  statusHistory: { type: [statusHistorySchema], default: [] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },
  paymentMethod: { type: String, enum: ['cod', 'razorpay'], required: true },
  paymentProvider: { type: String, enum: ['cod', 'razorpay'], required: true },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpayRefundId: { type: String, default: '' },
  refundStatus: { type: String, enum: ['none', 'processing', 'failed', 'refunded'], default: 'none' },
  shippingAddress: { type: addressSchema, required: true },
  contactEmail: { type: String, required: true, trim: true, lowercase: true },
  contactPhone: { type: String, required: true },
  courier: { type: String, default: '' },
  trackingNumber: { type: String, default: '' },
  shippedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  stockRestored: { type: Boolean, default: false },
  transitionLock: { type: Boolean, default: false, select: false },
  notes: { type: String, default: '' }
}, { timestamps: true });

orderSchema.index({ checkoutSession: 1, vendor: 1 }, { unique: true });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ vendor: 1, createdAt: -1 });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 9000 + 1000);
    this.orderNumber = `MC-${ts}-${rand}`;
  }
  next();
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
