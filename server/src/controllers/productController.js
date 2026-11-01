import { getProductModel, getCategoryModel, getVendorProfileModel } from '../models/dataAccess.js';
import mongoose from 'mongoose';

const isMongoId = (v) => mongoose.Types.ObjectId.isValid(v);

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/products  — list all available products (public)
export const getProducts = async (req, res) => {
  try {
    const ProductModel = getCategoryModel()._isMemory
      ? (await import('../models/dataAccess.js')).getProductModel()
      : (await import('../models/dataAccess.js')).getProductModel();

    const PM = getProductModel();
    const { category, vendor, search, sort = 'newest', page = 1, limit = 20 } = req.query;

    const filter = { isAvailable: true, isApproved: true };
    if (category) filter.category = category;
    if (vendor)   filter.vendor   = vendor;

    // Sort map
    const sortMap = {
      newest:      { createdAt: -1 },
      oldest:      { createdAt:  1 },
      price_asc:   { price:      1 },
      price_desc:  { price:     -1 },
      rating:      { 'rating.average': -1 }
    };
    const sortObj = sortMap[sort] || { createdAt: -1 };

    let products;
    let total;

    // Mongoose path
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      if (search) {
        filter.$or = [
          { name:        { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags:        { $in: [new RegExp(search, 'i')] } }
        ];
      }
      total    = await PM.countDocuments(filter);
      products = await PM.find(filter)
        .populate('category', 'name slug icon')
        .populate('vendor', 'name avatar')
        .populate('vendorProfile', 'storeName storeSlug')
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();
    } else {
      // Memory path
      let all = await PM.find(filter);
      if (typeof all.then === 'function') all = await all;
      if (!Array.isArray(all)) all = [];
      if (search) {
        const re = new RegExp(search, 'i');
        all = all.filter(p => re.test(p.name) || re.test(p.description));
      }
      total    = all.length;
      products = all;
    }

    res.json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      products
    });
  } catch (err) {
    console.error('[Products] getProducts error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:idOrSlug  — single product (public)
export const getProductById = async (req, res) => {
  try {
    const PM = getProductModel();
    const { idOrSlug } = req.params;
    let product;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      product = isMongoId(idOrSlug)
        ? await PM.findById(idOrSlug).populate('category', 'name slug').populate('vendor', 'name avatar').populate('vendorProfile', 'storeName')
        : await PM.findOne({ slug: idOrSlug }).populate('category', 'name slug').populate('vendor', 'name avatar').populate('vendorProfile', 'storeName');
    } else {
      product = await PM.findById(idOrSlug) || await PM.findOne({ slug: idOrSlug });
    }

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR ENDPOINTS  (requireApprovedVendor middleware applied in routes)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendor/products  — vendor's own products
export const getMyProducts = async (req, res) => {
  try {
    const PM  = getProductModel();
    const vid = req.user._id;
    let products;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      products = await PM.find({ vendor: vid })
        .populate('category', 'name slug icon')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      products = await PM.find({ vendor: vid.toString() });
      if (typeof products.then === 'function') products = await products;
      if (!Array.isArray(products)) products = [];
    }

    // Stats summary
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isAvailable).length;
    const lowStockProducts = products.filter(p => p.stock <= 5).length;
    const totalSales = products.reduce((s, p) => s + (p.totalSales || 0), 0);

    res.json({
      success: true,
      stats: { totalProducts, activeProducts, lowStockProducts, totalSales },
      products
    });
  } catch (err) {
    console.error('[Products] getMyProducts error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/vendor/products  — add new product
export const createProduct = async (req, res) => {
  try {
    const PM  = getProductModel();
    const VPM = getVendorProfileModel();

    const {
      name, description, shortDescription, price, discountPercent,
      stock, category, images, thumbnail, isAvailable, tags, specifications
    } = req.body;

    // Validation
    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, description, price, category, stock.'
      });
    }
    if (isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
    }
    if (isNaN(stock) || Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative integer.' });
    }
    if (discountPercent !== undefined && (isNaN(discountPercent) || Number(discountPercent) < 0 || Number(discountPercent) > 100)) {
      return res.status(400).json({ success: false, message: 'Discount must be between 0 and 100.' });
    }

    // Find vendor profile ID
    const vendorProfile = await VPM.findOne({ userId: req.user._id });

    const productData = {
      name:             name.trim(),
      description:      description.trim(),
      shortDescription: (shortDescription || '').trim(),
      price:            Number(price),
      discountPercent:  Number(discountPercent || 0),
      stock:            Number(stock),
      category,
      vendor:           req.user._id,
      vendorProfile:    vendorProfile?._id,
      images:           Array.isArray(images) ? images : (images ? [images] : []),
      thumbnail:        thumbnail || (Array.isArray(images) && images[0]) || '',
      isAvailable:      isAvailable !== undefined ? Boolean(isAvailable) : true,
      tags:             Array.isArray(tags) ? tags : [],
      specifications:   specifications || {}
    };

    const product = await PM.create(productData);
    res.status(201).json({ success: true, message: 'Product created successfully.', product });
  } catch (err) {
    console.error('[Products] createProduct error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A product with this name/slug already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/vendor/products/:id  — update own product
export const updateProduct = async (req, res) => {
  try {
    const PM = getProductModel();
    const product = await PM.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Ownership check
    if (product.vendor?.toString() !== req.user._id?.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this product.' });
    }

    const allowed = ['name','description','shortDescription','price','discountPercent',
                     'stock','category','images','thumbnail','isAvailable','tags','specifications'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.price !== undefined)           updates.price           = Number(updates.price);
    if (updates.discountPercent !== undefined) updates.discountPercent = Number(updates.discountPercent);
    if (updates.stock !== undefined)           updates.stock           = Number(updates.stock);
    if (updates.isAvailable !== undefined)     updates.isAvailable     = Boolean(updates.isAvailable);
    if (updates.images && updates.images.length > 0 && !updates.thumbnail) {
      updates.thumbnail = updates.images[0];
    }

    // Mongoose
    let updatedProduct;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      updatedProduct = await PM.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    } else {
      updatedProduct = await PM.findByIdAndUpdate(req.params.id, updates);
    }

    res.json({ success: true, message: 'Product updated successfully.', product: updatedProduct });
  } catch (err) {
    console.error('[Products] updateProduct error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/vendor/products/:id  — delete own product
export const deleteProduct = async (req, res) => {
  try {
    const PM = getProductModel();
    const product = await PM.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Ownership check
    if (product.vendor?.toString() !== req.user._id?.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this product.' });
    }

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await PM.findByIdAndDelete(req.params.id);
    } else {
      await PM.findByIdAndDelete(req.params.id);
    }

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('[Products] deleteProduct error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR STATS ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
export const getVendorStats = async (req, res) => {
  try {
    const PM  = getProductModel();
    const VPM = getVendorProfileModel();
    const vid = req.user._id;

    const vendorProfile = await VPM.findOne({ userId: vid });

    let products = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      products = await PM.find({ vendor: vid }).lean();
    } else {
      products = await PM.find({ vendor: vid.toString() });
      if (typeof products.then === 'function') products = await products;
      if (!Array.isArray(products)) products = [];
    }

    const totalProducts    = products.length;
    const activeProducts   = products.filter(p => p.isAvailable).length;
    const outOfStock       = products.filter(p => p.stock === 0).length;
    const lowStock         = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const totalRevenue     = vendorProfile?.totalEarnings || 0;
    const withdrawable     = vendorProfile?.withdrawableBalance || 0;
    const commissionRate   = vendorProfile?.commissionRate || 10;

    res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        outOfStock,
        lowStock,
        totalOrders: 0,        // Orders module comes in Phase 5
        totalRevenue,
        withdrawable,
        commissionRate,
        recentOrders: []       // Orders module comes in Phase 5
      }
    });
  } catch (err) {
    console.error('[Products] getVendorStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/products  — all products for admin
export const getAllProductsAdmin = async (req, res) => {
  try {
    const PM = getProductModel();
    let products;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      products = await PM.find({})
        .populate('category', 'name slug')
        .populate('vendor', 'name email')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      products = await PM.find({});
      if (typeof products.then === 'function') products = await products;
      if (!Array.isArray(products)) products = [];
    }
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
