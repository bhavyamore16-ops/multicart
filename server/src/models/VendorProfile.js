import mongoose from 'mongoose';

const vendorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  storeName: {
    type: String,
    required: [true, 'Please provide a store name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  storeSlug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  businessEmail: {
    type: String,
    required: [true, 'Please provide a business contact email'],
    lowercase: true,
    trim: true
  },
  businessPhone: {
    type: String,
    required: [true, 'Please provide a business phone number'],
    trim: true
  },
  businessAddress: {
    type: String,
    required: [true, 'Please provide physical business address'],
    trim: true
  },
  storeDescription: {
    type: String,
    default: 'Independent retail vendor offering quality products on MultiCart.',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  storeLogo: {
    type: String,
    default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'
  },
  storeBanner: {
    type: String,
    default: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  commissionRate: {
    type: Number,
    default: 10.0,
    min: 0,
    max: 100
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  totalEarnings: {
    type: Number,
    default: 0.0
  },
  withdrawableBalance: {
    type: Number,
    default: 0.0
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Auto-generate slug before saving
vendorProfileSchema.pre('save', function(next) {
  if (this.isModified('storeName') && !this.storeSlug) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

const VendorProfile = mongoose.models.VendorProfile || mongoose.model('VendorProfile', vendorProfileSchema);

export default VendorProfile;
