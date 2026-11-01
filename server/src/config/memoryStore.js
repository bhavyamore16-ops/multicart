import bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory tables
// ─────────────────────────────────────────────────────────────────────────────
const usersTable           = [];
const vendorProfilesTable  = [];
const productsTable        = [];
const categoriesTable      = [];

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
                     'stock','category','images','thumbnail','isAvailable','tags','specifications'];
    for (const key of allowed) {
      if (updates[key] !== undefined) product[key] = updates[key];
    }
    if (updates.images && updates.images.length > 0) {
      product.thumbnail = updates.images[0];
    }
    product.slug = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${product._id}`;
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
