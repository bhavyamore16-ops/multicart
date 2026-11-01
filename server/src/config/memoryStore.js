import bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory tables
// ─────────────────────────────────────────────────────────────────────────────
const usersTable           = [];
const vendorProfilesTable  = [];
const productsTable        = [];
const categoriesTable      = [];
const cartsTable           = [];
const wishlistsTable       = [];
const checkoutSessionsTable = [];
const reviewsTable          = [];
const notificationsTable     = [];
const contactMessagesTable   = [];

let idCounter = 1;
const genId = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${idCounter++}`;

// ─────────────────────────────────────────────────────────────────────────────
// MemoryUser
// ─────────────────────────────────────────────────────────────────────────────
export class MemoryUser {
  constructor(data) {
    this._id       = data._id || genId('usr');
    this.name      = data.name;
    this.email     = (data.email || '').toLowerCase().trim();
    this.password  = data.password;
    this.role      = data.role || 'customer';
    this.phone     = data.phone || '';
    this.avatar    = data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    this.address   = data.address || { street: '', city: '', state: '', postalCode: '', country: 'India' };
    this.isActive  = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async matchPassword(entered) { return bcrypt.compare(entered, this.password); }
  toJSON()   { const c = { ...this }; delete c.password; return c; }
  toObject() { return this.toJSON(); }

  static async findOne(q) {
    return usersTable.find(u => {
      for (const k in q) {
        if (k === 'email' && u.email !== (q[k] || '').toLowerCase().trim()) return false;
        if (k === '_id'   && u._id.toString() !== q[k].toString()) return false;
        if (k !== 'email' && k !== '_id' && u[k] !== q[k]) return false;
      }
      return true;
    }) || null;
  }

  static async findById(id) {
    return usersTable.find(u => u._id.toString() === id.toString()) || null;
  }

  static async find(q = {}) {
    return usersTable.filter(u => {
      for (const k in q) {
        if (u[k] !== q[k]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(data.password, salt);
    const user   = new MemoryUser({ ...data, password: hashed });
    usersTable.push(user);
    return user;
  }

  static async findByIdAndUpdate(id, updates) {
    const user = await MemoryUser.findById(id);
    if (!user) return null;
    if (updates.name      !== undefined) user.name      = updates.name;
    if (updates.phone     !== undefined) user.phone     = updates.phone;
    if (updates.address   !== undefined) user.address   = { ...user.address, ...updates.address };
    if (updates.avatar    !== undefined) user.avatar    = updates.avatar;
    if (updates.isActive  !== undefined) user.isActive  = updates.isActive;
    if (updates.password  !== undefined) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(updates.password, salt);
    }
    user.updatedAt = new Date();
    return user;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MemoryVendorProfile
// ─────────────────────────────────────────────────────────────────────────────
export class MemoryVendorProfile {
  constructor(data) {
    this._id                = data._id || genId('vnd');
    this.userId             = data.userId;
    this.storeName          = data.storeName;
    this.storeSlug          = data.storeSlug || data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.businessEmail      = (data.businessEmail || '').toLowerCase().trim();
    this.businessPhone      = data.businessPhone || '';
    this.businessAddress    = data.businessAddress || '';
    this.storeDescription   = data.storeDescription || 'Independent retail vendor offering quality products on MultiCart.';
    this.storeLogo          = data.storeLogo  || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80';
    this.storeBanner        = data.storeBanner || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80';
    this.status             = data.status || 'pending';
    this.commissionRate     = data.commissionRate || 10.0;
    this.isVerified         = data.isVerified !== undefined ? data.isVerified : false;
    this.totalEarnings      = data.totalEarnings || 0.0;
    this.withdrawableBalance= data.withdrawableBalance || 0.0;
    this.rejectionReason    = data.rejectionReason || '';
    this.createdAt          = data.createdAt || new Date();
    this.updatedAt          = data.updatedAt || new Date();
  }

  static async findOne(q) {
    return vendorProfilesTable.find(v => {
      for (const k in q) {
        if (k === 'userId'    && v.userId.toString()    !== q[k].toString()) return false;
        if (k === '_id'       && v._id.toString()       !== q[k].toString()) return false;
        if (k === 'storeName' && v.storeName.toLowerCase() !== q[k].toLowerCase()) return false;
        if (k !== 'userId' && k !== '_id' && k !== 'storeName' && v[k] !== q[k]) return false;
      }
      return true;
    }) || null;
  }

  static async findById(id) {
    return vendorProfilesTable.find(v => v._id.toString() === id.toString()) || null;
  }

  static async find(q = {}) {
    return vendorProfilesTable.filter(v => {
      for (const k in q) { if (v[k] !== q[k]) return false; }
      return true;
    });
  }

  static async create(data) {
    const p = new MemoryVendorProfile(data);
    vendorProfilesTable.push(p);
    return p;
  }

  static async findByIdAndUpdate(id, updates) {
    const p = await MemoryVendorProfile.findById(id);
    if (!p) return null;
    Object.assign(p, updates);
    p.updatedAt = new Date();
    return p;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MemoryCategory
// ─────────────────────────────────────────────────────────────────────────────
export class MemoryCategory {
  constructor(data) {
    this._id          = data._id || genId('cat');
    this.name         = data.name;
    this.slug         = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.description  = data.description || '';
    this.icon         = data.icon || '🛍️';
    this.image        = data.image || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80';
    this.isActive     = data.isActive !== undefined ? data.isActive : true;
    this.displayOrder = data.displayOrder || 0;
    this.createdAt    = data.createdAt || new Date();
    this.updatedAt    = data.updatedAt || new Date();
  }

  static async findOne(q) {
    return categoriesTable.find(c => {
      for (const k in q) {
        if (k === '_id'  && c._id.toString()  !== q[k].toString()) return false;
        if (k === 'slug' && c.slug !== q[k])  return false;
        if (k === 'name' && c.name.toLowerCase() !== q[k].toLowerCase()) return false;
        if (!['_id','slug','name'].includes(k) && c[k] !== q[k]) return false;
      }
      return true;
    }) || null;
  }

  static async findById(id) {
    return categoriesTable.find(c => c._id.toString() === id.toString()) || null;
  }

  static async find(q = {}) {
    return categoriesTable.filter(c => {
      for (const k in q) { if (c[k] !== q[k]) return false; }
      return true;
    }).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async create(data) {
    // Prevent duplicate name
    const exists = await MemoryCategory.findOne({ name: data.name });
    if (exists) throw new Error(`Category "${data.name}" already exists`);
    const cat = new MemoryCategory(data);
    categoriesTable.push(cat);
    return cat;
  }

  static async findByIdAndUpdate(id, updates) {
    const cat = await MemoryCategory.findById(id);
    if (!cat) return null;
    if (updates.name && categoriesTable.some(other => other._id !== cat._id && other.name.toLowerCase() === updates.name.toLowerCase())) {
      throw new Error(`Category "${updates.name}" already exists`);
    }
    Object.assign(cat, updates);
    cat.updatedAt = new Date();
    return cat;
  }

  static async findByIdAndDelete(id) {
    const idx = categoriesTable.findIndex(c => c._id.toString() === id.toString());
    if (idx === -1) return null;
    return categoriesTable.splice(idx, 1)[0];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MemoryProduct
// ─────────────────────────────────────────────────────────────────────────────
export class MemoryProduct {
  constructor(data) {
    this._id              = data._id || genId('prd');
    this.name             = data.name;
    this.slug             = data.slug || `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    this.description      = data.description;
    this.shortDescription = data.shortDescription || '';
    this.price            = Number(data.price);
    this.discountPercent  = Number(data.discountPercent || 0);
    this.stock            = Number(data.stock || 0);
    this.category         = data.category;
    this.vendor           = data.vendor;
    this.vendorProfile    = data.vendorProfile;
    this.images           = data.images || [];
    this.thumbnail        = data.thumbnail || (data.images && data.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
    this.isAvailable      = data.isAvailable !== undefined ? data.isAvailable : true;
    this.isApproved       = data.isApproved  !== undefined ? data.isApproved  : true;
    this.rating           = data.rating || { average: 0, count: 0 };
    this.totalSales       = data.totalSales || 0;
    this.tags             = data.tags || [];
    this.specifications   = data.specifications || {};
    this.createdAt        = data.createdAt || new Date();
    this.updatedAt        = data.updatedAt || new Date();
  }

  get discountedPrice() {
    if (!this.discountPercent) return this.price;
    return Math.round(this.price * (1 - this.discountPercent / 100));
  }

  toJSON()   { return { ...this, discountedPrice: this.discountedPrice }; }
  toObject() { return this.toJSON(); }

  // ── Static query helpers ──────────────────────────────────────────────────

  static async findOne(q) {
    return productsTable.find(p => MemoryProduct._match(p, q)) || null;
  }

  static async findById(id) {
    return productsTable.find(p => p._id.toString() === id.toString()) || null;
  }

  static async find(q = {}, options = {}) {
    let results = productsTable.filter(p => MemoryProduct._match(p, q));
    // Basic sort support: { createdAt: -1 } or { price: 1 }
    if (options.sort) {
      const [field, dir] = Object.entries(options.sort)[0];
      results = results.sort((a, b) => dir === -1 ? (b[field] > a[field] ? 1 : -1) : (a[field] > b[field] ? 1 : -1));
    }
    if (options.limit) results = results.slice(0, options.limit);
    return results;
  }

  static async countDocuments(q = {}) {
    return productsTable.filter(p => MemoryProduct._match(p, q)).length;
  }

  static async create(data) {
    const product = new MemoryProduct(data);
    productsTable.push(product);
    return product;
  }

  static async findByIdAndUpdate(id, updates) {
    const product = await MemoryProduct.findById(id);
    if (!product) return null;
    const allowed = ['name','description','shortDescription','price','discountPercent',
                     'stock','category','images','thumbnail','isAvailable','isApproved','rating','tags','specifications'];
    for (const key of allowed) {
      if (updates[key] !== undefined) product[key] = updates[key];
    }
    if (updates.images && updates.images.length > 0) {
      product.thumbnail = updates.images[0];
    }
    if (updates.name !== undefined) product.slug = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${product._id}`;
    product.updatedAt = new Date();
    return product;
  }

  static async adjustInventory(id, stockDelta, salesDelta = 0) {
    const product = await MemoryProduct.findById(id);
    if (!product || product.stock + stockDelta < 0 || (stockDelta < 0 && (product.isAvailable === false || product.isApproved === false))) return null;
    product.stock += stockDelta;
    product.totalSales = Math.max(0, Number(product.totalSales || 0) + salesDelta);
    product.updatedAt = new Date();
    return product;
  }

  static async findByIdAndDelete(id) {
    const idx = productsTable.findIndex(p => p._id.toString() === id.toString());
    if (idx === -1) return null;
    return productsTable.splice(idx, 1)[0];
  }

  // ── Internal matcher ──────────────────────────────────────────────────────
  static _match(product, q) {
    for (const k in q) {
      const qv = q[k];
      // Handle $ne operator: { vendor: { $ne: someId } }
      if (qv !== null && typeof qv === 'object' && '$ne' in qv) {
        if (product[k]?.toString() === qv['$ne']?.toString()) return false;
        continue;
      }
      if (k === 'vendor' || k === 'category' || k === 'vendorProfile') {
        if (product[k]?.toString() !== qv?.toString()) return false;
      } else if (k === '_id') {
        if (product._id.toString() !== qv.toString()) return false;
      } else {
        if (product[k] !== qv) return false;
      }
    }
    return true;
  }

  // Support .populate()-like chaining (no-op for memory store — data already flat)
  populate() { return this; }
  sort()     { return this; }
}

// Give MemoryProduct a static sort/populate passthrough for chained calls
MemoryProduct.find = async (q = {}, options = {}) => {
  let results = productsTable.filter(p => MemoryProduct._match(p, q));
  return {
    sort(sortObj) {
      const [field, dir] = Object.entries(sortObj)[0];
      results = results.sort((a, b) => dir === -1 ? (b[field] > a[field] ? 1 : -1) : (a[field] > b[field] ? 1 : -1));
      return this;
    },
    limit(n) { results = results.slice(0, n); return this; },
    populate() { return this; },
    lean()    { return Promise.resolve(results.map(p => p.toJSON())); },
    then(resolve) { return Promise.resolve(results).then(resolve); },
    [Symbol.iterator]() { return results[Symbol.iterator](); }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MemoryOrder (used when MongoDB is disconnected)
// ─────────────────────────────────────────────────────────────────────────────
const ordersTable = [];

export class MemoryOrder {
  constructor(data) {
    this._id           = data._id || genId('ord');
    this.orderNumber   = data.orderNumber || `MC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*9000+1000)}`;
    this.masterOrderId = data.masterOrderId || '';
    this.checkoutSession = data.checkoutSession || '';
    this.customer      = data.customer;
    this.vendor        = data.vendor;
    this.items         = data.items || [];
    this.subtotal      = Number(data.subtotal || 0);
    this.shippingCost  = Number(data.shippingCost || 0);
    this.total         = Number(data.total || 0);
    this.masterSubtotal = Number(data.masterSubtotal || data.subtotal || 0);
    this.masterShippingCost = Number(data.masterShippingCost || data.shippingCost || 0);
    this.masterTotal = Number(data.masterTotal || data.total || 0);
    this.status        = data.status || 'pending';
    this.statusHistory = data.statusHistory || [];
    this.paymentStatus = data.paymentStatus || 'pending';
    this.paymentMethod = data.paymentMethod || 'cod';
    this.paymentProvider = data.paymentProvider || data.paymentMethod || 'cod';
    this.razorpayOrderId = data.razorpayOrderId || '';
    this.razorpayPaymentId = data.razorpayPaymentId || '';
    this.razorpayRefundId = data.razorpayRefundId || '';
    this.refundStatus = data.refundStatus || 'none';
    this.shippingAddress = data.shippingAddress || {};
    this.contactEmail = data.contactEmail || '';
    this.contactPhone = data.contactPhone || data.shippingAddress?.phone || '';
    this.courier = data.courier || '';
    this.trackingNumber = data.trackingNumber || '';
    this.shippedAt = data.shippedAt || null;
    this.deliveredAt = data.deliveredAt || null;
    this.stockRestored = data.stockRestored || false;
    this.transitionLock = data.transitionLock || false;
    this.notes         = data.notes || '';
    this.createdAt     = data.createdAt || new Date();
    this.updatedAt     = data.updatedAt || new Date();
  }

  toJSON()   { return { ...this }; }
  toObject() { return this.toJSON(); }

  static async findById(id) {
    return ordersTable.find(o => o._id.toString() === id.toString()) || null;
  }

  static async findOne(q) {
    return ordersTable.find(o => MemoryOrder.matches(o, q)) || null;
  }

  static find(q = {}) {
    let results = ordersTable.filter(o => MemoryOrder.matches(o, q));
    return {
      sort(spec = {}) {
        const [key, direction] = Object.entries(spec)[0] || ['createdAt', -1];
        results = results.sort((a, b) => (new Date(a[key]).getTime() - new Date(b[key]).getTime()) * direction);
        return this;
      },
      limit(n) { results.splice(n); return this; },
      populate() { return this; },
      lean()     { return Promise.resolve(results.map(o => o.toJSON())); },
      then(resolve) { return Promise.resolve(results).then(resolve); }
    };
  }

  static async countDocuments(q = {}) {
    return ordersTable.filter(o => MemoryOrder.matches(o, q)).length;
  }

  static async create(data) {
    if (data.checkoutSession && ordersTable.some(order =>
      order.checkoutSession?.toString() === data.checkoutSession?.toString() &&
      order.vendor?.toString() === data.vendor?.toString())) {
      const duplicate = new Error('A vendor order already exists for this checkout.');
      duplicate.code = 11000;
      throw duplicate;
    }
    const order = new MemoryOrder(data);
    ordersTable.push(order);
    return order;
  }

  static async findByIdAndUpdate(id, updates) {
    const order = await MemoryOrder.findById(id);
    if (!order) return null;
    MemoryOrder.applyUpdates(order, updates);
    order.updatedAt = new Date();
    return order;
  }

  static async findOneAndUpdate(query, updates) {
    const order = ordersTable.find(candidate => MemoryOrder.matches(candidate, query));
    if (!order) return null;
    MemoryOrder.applyUpdates(order, updates);
    order.updatedAt = new Date();
    return order;
  }

  static async deleteMany(query = {}) {
    let deletedCount = 0;
    for (let index = ordersTable.length - 1; index >= 0; index -= 1) {
      if (MemoryOrder.matches(ordersTable[index], query)) {
        ordersTable.splice(index, 1);
        deletedCount += 1;
      }
    }
    return { deletedCount };
  }

  static matches(order, query = {}) {
    for (const [key, expected] of Object.entries(query)) {
      if (key === 'items.vendor') {
        if (!(order.items || []).some(item => item.vendor?.toString() === expected?.toString())) return false;
        continue;
      }
      const actual = key === '_id' ? order._id : order[key];
      if (expected && typeof expected === 'object' && '$ne' in expected) {
        if (actual?.toString() === expected.$ne?.toString()) return false;
      } else if (actual?.toString() !== expected?.toString()) return false;
    }
    return true;
  }

  static applyUpdates(order, updates = {}) {
    if (updates.$set) Object.assign(order, updates.$set);
    else Object.assign(order, updates);
    if (updates.$push) {
      for (const [key, value] of Object.entries(updates.$push)) {
        if (!Array.isArray(order[key])) order[key] = [];
        order[key].push(value);
      }
    }
  }
}

// MemoryCheckoutSession (idempotency and payment-attempt storage fallback)
// ─────────────────────────────────────────────────────────────────────────────
export class MemoryCheckoutSession {
  constructor(data) {
    this._id = data._id || genId('chk');
    this.customer = data.customer;
    this.checkoutKey = data.checkoutKey;
    this.masterOrderId = data.masterOrderId || `MC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    this.paymentMethod = data.paymentMethod;
    this.status = data.status || 'processing';
    this.items = data.items || [];
    this.subtotal = Number(data.subtotal || 0);
    this.shippingCost = Number(data.shippingCost || 0);
    this.total = Number(data.total || 0);
    this.shippingAddress = data.shippingAddress || {};
    this.contactEmail = data.contactEmail || '';
    this.contactPhone = data.contactPhone || '';
    this.razorpayOrderId = data.razorpayOrderId || '';
    this.razorpayPaymentId = data.razorpayPaymentId || '';
    this.razorpaySignatureVerified = Boolean(data.razorpaySignatureVerified);
    this.orderIds = data.orderIds || [];
    this.expiresAt = data.expiresAt || null;
    this.failureReason = data.failureReason || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() { return { ...this, items: [...this.items], orderIds: [...this.orderIds] }; }
  toObject() { return this.toJSON(); }

  async save() {
    this.updatedAt = new Date();
    const index = checkoutSessionsTable.findIndex(row => row._id.toString() === this._id.toString());
    if (index === -1) checkoutSessionsTable.push(this);
    else checkoutSessionsTable[index] = this;
    return this;
  }

  static async findOne(query = {}) {
    return checkoutSessionsTable.find(session => Object.entries(query).every(([key, value]) =>
      session[key]?.toString() === value?.toString())) || null;
  }

  static async findById(id) {
    return checkoutSessionsTable.find(session => session._id.toString() === id.toString()) || null;
  }

  static find(query = {}) {
    let results = checkoutSessionsTable.filter(session => Object.entries(query).every(([key, value]) =>
      session[key]?.toString() === value?.toString()));
    return {
      sort(spec = {}) {
        const [key, direction] = Object.entries(spec)[0] || ['createdAt', -1];
        results = results.sort((a, b) => (new Date(a[key]).getTime() - new Date(b[key]).getTime()) * direction);
        return this;
      },
      limit(count) { results = results.slice(0, count); return this; },
      then(resolve) { return Promise.resolve(results).then(resolve); }
    };
  }

  static async create(data) {
    const duplicate = checkoutSessionsTable.find(session =>
      session.customer?.toString() === data.customer?.toString() && session.checkoutKey === data.checkoutKey);
    if (duplicate) {
      const error = new Error('Checkout key has already been used.');
      error.code = 11000;
      throw error;
    }
    const session = new MemoryCheckoutSession(data);
    checkoutSessionsTable.push(session);
    return session;
  }

  static async findByIdAndUpdate(id, updates) {
    const session = await MemoryCheckoutSession.findById(id);
    if (!session) return null;
    Object.assign(session, updates.$set || updates);
    session.updatedAt = new Date();
    return session;
  }

  static async findOneAndUpdate(query, updates) {
    const session = checkoutSessionsTable.find(candidate => Object.entries(query).every(([key, value]) => {
      const actual = candidate[key];
      if (value && typeof value === 'object' && '$ne' in value) return actual?.toString() !== value.$ne?.toString();
      return actual?.toString() === value?.toString();
    }));
    if (!session) return null;
    Object.assign(session, updates.$set || updates);
    session.updatedAt = new Date();
    return session;
  }
}

export class MemoryReview {
  constructor(data) {
    this._id = data._id || genId('rev');
    this.product = data.product;
    this.customer = data.customer;
    this.order = data.order;
    this.rating = Number(data.rating);
    this.title = data.title || '';
    this.comment = data.comment;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() { return { ...this }; }
  toObject() { return this.toJSON(); }

  static async find(query = {}) {
    return reviewsTable.filter(review => Object.entries(query).every(([key, value]) => review[key]?.toString() === value?.toString()));
  }

  static async findOne(query = {}) {
    return (await MemoryReview.find(query))[0] || null;
  }

  static async create(data) {
    if (reviewsTable.some(review => review.product?.toString() === data.product?.toString() && review.customer?.toString() === data.customer?.toString() && review.order?.toString() === data.order?.toString())) {
      const duplicate = new Error('A review already exists for this purchase.');
      duplicate.code = 11000;
      throw duplicate;
    }
    const review = new MemoryReview(data);
    reviewsTable.push(review);
    return review;
  }
}

export class MemoryNotification {
  constructor(data) {
    this._id = data._id || genId('ntf');
    this.user = data.user;
    this.type = data.type || 'general';
    this.title = data.title || '';
    this.message = data.message || '';
    this.href = data.href || '';
    this.readAt = data.readAt || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() { return { ...this }; }
  toObject() { return this.toJSON(); }

  static async find(query = {}) {
    return notificationsTable.filter(notification => Object.entries(query).every(([key, value]) => {
      if (value === null) return notification[key] === null;
      return notification[key]?.toString() === value?.toString();
    }));
  }

  static async findById(id) {
    return notificationsTable.find(notification => notification._id.toString() === id.toString()) || null;
  }

  static async create(data) {
    const notification = new MemoryNotification(data);
    notificationsTable.push(notification);
    return notification;
  }

  static async findByIdAndUpdate(id, updates = {}) {
    const notification = await MemoryNotification.findById(id);
    if (!notification) return null;
    Object.assign(notification, updates);
    notification.updatedAt = new Date();
    return notification;
  }
}

export class MemoryContactMessage {
  constructor(data) {
    this._id = data._id || genId('msg');
    this.customer = data.customer || null;
    this.name = data.name;
    this.email = (data.email || '').toLowerCase().trim();
    this.subject = data.subject;
    this.message = data.message;
    this.status = data.status || 'new';
    this.adminReply = data.adminReply || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() { return { ...this }; }
  toObject() { return this.toJSON(); }

  static async create(data) {
    const message = new MemoryContactMessage(data);
    contactMessagesTable.push(message);
    return message;
  }

  static async find(query = {}) {
    return contactMessagesTable
      .filter(message => Object.entries(query).every(([key, value]) => message[key]?.toString() === value?.toString()))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    return contactMessagesTable.find(message => message._id.toString() === id.toString()) || null;
  }

  static async findByIdAndUpdate(id, updates = {}) {
    const message = await MemoryContactMessage.findById(id);
    if (!message) return null;
    Object.assign(message, updates);
    message.updatedAt = new Date();
    return message;
  }

  static async findByIdAndDelete(id) {
    const index = contactMessagesTable.findIndex(message => message._id.toString() === id.toString());
    return index < 0 ? null : contactMessagesTable.splice(index, 1)[0];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MemoryCart (used only when MongoDB is not connected)
// ─────────────────────────────────────────────────────────────────────────────
export class MemoryCart {
  constructor(data) {
    this._id = data._id || genId('cart');
    this.customer = data.customer;
    this.items = (data.items || []).map(item => ({ product: item.product, quantity: Number(item.quantity) }));
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() { return { ...this, items: this.items.map(item => ({ ...item })) }; }
  toObject() { return this.toJSON(); }

  async save() {
    this.updatedAt = new Date();
    const index = cartsTable.findIndex(cart => cart.customer?.toString() === this.customer?.toString());
    if (index === -1) cartsTable.push(this);
    else cartsTable[index] = this;
    return this;
  }

  static async findOne(query = {}) {
    return cartsTable.find(cart => Object.entries(query).every(([key, value]) =>
      cart[key]?.toString() === value?.toString())) || null;
  }

  static async create(data) {
    const cart = new MemoryCart(data);
    await cart.save();
    return cart;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MemoryWishlist (used only when MongoDB is not connected)
// ─────────────────────────────────────────────────────────────────────────────
export class MemoryWishlist {
  constructor(data) {
    this._id = data._id || genId('wishlist');
    this.customer = data.customer;
    this.products = [...new Set((data.products || []).map(product => product?.toString()))];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() { return { ...this, products: [...this.products] }; }
  toObject() { return this.toJSON(); }

  async save() {
    this.updatedAt = new Date();
    const index = wishlistsTable.findIndex(wishlist => wishlist.customer?.toString() === this.customer?.toString());
    if (index === -1) wishlistsTable.push(this);
    else wishlistsTable[index] = this;
    return this;
  }

  static async findOne(query = {}) {
    return wishlistsTable.find(wishlist => Object.entries(query).every(([key, value]) =>
      wishlist[key]?.toString() === value?.toString())) || null;
  }

  static async create(data) {
    const wishlist = new MemoryWishlist(data);
    await wishlist.save();
    return wishlist;
  }
}

