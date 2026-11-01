import { getProductModel, getCategoryModel, getVendorProfileModel, getOrderModel } from '../models/dataAccess.js';
import { approvedVendorIds, idOf, isProductFromApprovedVendor, presentProduct } from '../utils/productPresentation.js';
import mongoose from 'mongoose';

const isMongoId = (v) => mongoose.Types.ObjectId.isValid(v);
const isMongoConnected = () => mongoose.connection?.readyState === 1;

const parseBoolean = (value) => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const isValidImageReference = (value) => {
  if (!value) return true;
  if (value.startsWith('/uploads/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const normalizeProductInput = async (input, existing = {}) => {
  const errors = [];
  const name = input.name ?? existing.name;
  const description = input.description ?? existing.description;
  const shortDescription = input.shortDescription ?? existing.shortDescription ?? '';
  const priceValue = input.price ?? existing.price;
  const stockValue = input.stock ?? existing.stock;
  const discountValue = input.discountPercent ?? existing.discountPercent ?? 0;
  const categoryValue = input.category ?? existing.category?._id ?? existing.category;

  if (typeof name !== 'string' || !name.trim()) errors.push('Product name is required.');
  else if (name.trim().length > 200) errors.push('Product name cannot exceed 200 characters.');
  if (typeof description !== 'string' || !description.trim()) errors.push('Product description is required.');
  else if (description.trim().length > 3000) errors.push('Description cannot exceed 3000 characters.');
  if (typeof shortDescription !== 'string' || shortDescription.length > 300) errors.push('Short description cannot exceed 300 characters.');

  const price = Number(priceValue);
  if (priceValue === '' || priceValue === undefined || !Number.isFinite(price) || price <= 0) errors.push('Price must be a number greater than 0.');
  const stock = Number(stockValue);
  if (stockValue === '' || stockValue === undefined || !Number.isInteger(stock) || stock < 0) errors.push('Stock must be a whole number of 0 or more.');
  const discountPercent = Number(discountValue);
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) errors.push('Discount must be between 0 and 100.');

  const categoryId = categoryValue?.toString?.() || '';
  if (!categoryId) {
    errors.push('Product category is required.');
  } else {
    if (isMongoConnected() && !isMongoId(categoryId)) errors.push('Product category is invalid.');
    else {
      const category = await getCategoryModel().findById(categoryId);
      if (!category || category.isActive === false) errors.push('Select an active product category.');
    }
  }

  const rawImages = input.images ?? existing.images ?? [];
  const images = Array.isArray(rawImages) ? rawImages : (typeof rawImages === 'string' ? [rawImages] : null);
  if (!images || images.length > 10 || images.some(image => typeof image !== 'string' || !isValidImageReference(image.trim()))) {
    errors.push('Product images must contain up to 10 valid HTTP(S) or uploaded image URLs.');
  }
  const cleanedImages = (images || []).map(image => image.trim()).filter(Boolean);
  const requestedThumbnail = input.thumbnail ?? existing.thumbnail ?? '';
  if (typeof requestedThumbnail !== 'string' || !isValidImageReference(requestedThumbnail.trim())) {
    errors.push('Product thumbnail must be a valid HTTP(S) or uploaded image URL.');
  }
  const thumbnail = requestedThumbnail.trim();
  const finalImages = thumbnail
    ? [thumbnail, ...cleanedImages.filter(image => image !== thumbnail)]
    : cleanedImages;

  let isAvailable = existing.isAvailable ?? true;
  if (input.isAvailable !== undefined) {
    isAvailable = parseBoolean(input.isAvailable);
    if (isAvailable === undefined) errors.push('Availability must be true or false.');
  }

  const rawTags = input.tags ?? existing.tags ?? [];
  const tags = Array.isArray(rawTags) ? rawTags : null;
  if (!tags || tags.length > 30 || tags.some(tag => typeof tag !== 'string' || tag.trim().length > 40)) {
    errors.push('Tags must be an array of up to 30 strings, each no longer than 40 characters.');
  }

  const specifications = input.specifications ?? existing.specifications ?? {};
  if (!specifications || typeof specifications !== 'object' || Array.isArray(specifications)) {
    errors.push('Specifications must be an object of key-value pairs.');
  }

  return {
    errors,
    product: {
      name: name?.trim(),
      description: description?.trim(),
      shortDescription: shortDescription?.trim(),
      price,
      discountPercent,
      stock,
      category: categoryId,
      images: finalImages,
      thumbnail: finalImages[0] || '',
      isAvailable,
      tags: (tags || []).map(tag => tag.trim()),
      specifications
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/products — approved-vendor listings with searchable filters and paging.
export const getProducts = async (req, res) => {
  try {
    const PM = getProductModel();
    const CategoryModel = getCategoryModel();
    const { category, vendor, sort = 'newest' } = req.query;
    const search = String(req.query.search || req.query.q || '').trim().slice(0, 100);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const minPrice = req.query.minPrice === undefined || req.query.minPrice === '' ? undefined : Number(req.query.minPrice);
    const maxPrice = req.query.maxPrice === undefined || req.query.maxPrice === '' ? undefined : Number(req.query.maxPrice);
    const minRating = req.query.minRating === undefined || req.query.minRating === '' ? undefined : Number(req.query.minRating);
    if ((minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
        (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
        (minRating !== undefined && (!Number.isFinite(minRating) || minRating < 0 || minRating > 5)) ||
        (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
      return res.status(400).json({ success: false, message: 'Price and rating filters are invalid.' });
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1, _id: 1 },
      price_desc: { price: -1, _id: 1 },
      rating: { 'rating.average': -1, createdAt: -1 }
    };
    const sortObject = sortMap[sort] || sortMap.newest;
    let categoryId = '';
    if (category) {
      if (isMongoConnected() && isMongoId(category)) {
        categoryId = category;
      } else {
        const match = await CategoryModel.findOne({ slug: category });
        if (!match) return res.json({ success: true, count: 0, total: 0, page, pages: 0, products: [] });
        categoryId = idOf(match._id);
      }
    }

    let products = [];
    let total = 0;
    if (isMongoConnected()) {
      const approvedIds = await approvedVendorIds();
      if (vendor && !approvedIds.includes(vendor)) {
        return res.json({ success: true, count: 0, total: 0, page, pages: 0, products: [] });
      }
      const filter = {
        isAvailable: true,
        isApproved: true,
        vendor: vendor || { $in: approvedIds }
      };
      if (categoryId) filter.category = categoryId;
      if (search) filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
      }
      if (minRating !== undefined && minRating > 0) filter['rating.average'] = { $gte: minRating };
      total = await PM.countDocuments(filter);
      products = await PM.find(filter)
        .populate('category', 'name slug icon')
        .populate('vendor', 'name avatar')
        .populate('vendorProfile', 'storeName storeSlug storeLogo status isVerified')
        .sort(sortObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else {
      let all = await PM.find({});
      if (typeof all.then === 'function') all = await all;
      if (!Array.isArray(all)) all = [];
      const approvedSet = new Set(await approvedVendorIds());
      const searchNeedle = search.toLowerCase();
      all = all.filter(product => {
        const productVendor = idOf(product.vendor);
        const price = Number(product.price || 0);
        const rating = Number(product.rating?.average || 0);
        const productCategoryId = idOf(product.category);
        const productCategorySlug = product.category?.slug || '';
        return product.isAvailable !== false && product.isApproved !== false && approvedSet.has(productVendor) &&
          (!vendor || productVendor === vendor) &&
          (!category || productCategoryId === categoryId || productCategorySlug === category || productCategoryId === category) &&
          (!searchNeedle || String(product.name || '').toLowerCase().includes(searchNeedle)) &&
          (minPrice === undefined || price >= minPrice) &&
          (maxPrice === undefined || price <= maxPrice) &&
          (minRating === undefined || rating >= minRating);
      });
      const [sortField, sortDirection] = Object.entries(sortObject)[0];
      all.sort((a, b) => {
        const av = sortField === 'rating.average' ? Number(a.rating?.average || 0) : (a[sortField] instanceof Date ? a[sortField].getTime() : a[sortField]);
        const bv = sortField === 'rating.average' ? Number(b.rating?.average || 0) : (b[sortField] instanceof Date ? b[sortField].getTime() : b[sortField]);
        const difference = av > bv ? 1 : av < bv ? -1 : 0;
        return difference * sortDirection;
      });
      total = all.length;
      products = all.slice((page - 1) * limit, page * limit);
    }

    const presented = await Promise.all(products.map(presentProduct));
    res.json({ success: true, count: presented.length, total, page, pages: Math.ceil(total / limit), products: presented });
  } catch (err) {
    console.error('[Products] getProducts error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:idOrSlug — product details from persisted catalog data.
export const getProductById = async (req, res) => {
  try {
    const PM = getProductModel();
    const { idOrSlug } = req.params;
    let product;
    if (isMongoConnected()) {
      product = isMongoId(idOrSlug)
        ? await PM.findOne({ _id: idOrSlug, isApproved: true })
            .populate('category', 'name slug icon')
            .populate('vendor', 'name avatar')
            .populate('vendorProfile', 'storeName storeSlug storeLogo status isVerified')
        : await PM.findOne({ slug: idOrSlug, isApproved: true })
            .populate('category', 'name slug icon')
            .populate('vendor', 'name avatar')
            .populate('vendorProfile', 'storeName storeSlug storeLogo status isVerified');
    } else {
      product = await PM.findById(idOrSlug) || await PM.findOne({ slug: idOrSlug });
    }
    if (!product || !await isProductFromApprovedVendor(product)) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, product: await presentProduct(product) });
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
      const CM = getCategoryModel();
      products = await Promise.all(products.map(async (product) => {
        const raw = typeof product.toJSON === 'function' ? product.toJSON() : product;
        return { ...raw, category: await CM.findById(raw.category) };
      }));
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
    const validation = await normalizeProductInput(req.body || {});
    if (validation.errors.length) {
      return res.status(400).json({ success: false, message: validation.errors.join(' ') });
    }

    // Find vendor profile ID
    const vendorProfile = await VPM.findOne({ userId: req.user._id });
    const productData = {
      ...validation.product,
      vendor:           req.user._id,
      vendorProfile:    vendorProfile?._id
    };

    const product = await PM.create(productData);
    res.status(201).json({ success: true, message: 'Product created successfully.', product });
  } catch (err) {
    console.error('[Products] createProduct error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A product with this name/slug already exists.' });
    }
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/vendor/products/:id  — update own product
export const updateProduct = async (req, res) => {
  try {
    const PM = getProductModel();
    if (isMongoConnected() && !isMongoId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Product ID is invalid.' });
    }
    const product = await PM.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Ownership check
    if (product.vendor?.toString() !== req.user._id?.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this product.' });
    }

    const validation = await normalizeProductInput(req.body || {}, product);
    if (validation.errors.length) {
      return res.status(400).json({ success: false, message: validation.errors.join(' ') });
    }

    let updatedProduct;
    if (isMongoConnected()) {
      Object.assign(product, validation.product);
      updatedProduct = await product.save();
    } else {
      updatedProduct = await PM.findByIdAndUpdate(req.params.id, validation.product);
    }

    res.json({ success: true, message: 'Product updated successfully.', product: updatedProduct });
  } catch (err) {
    console.error('[Products] updateProduct error:', err);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/vendor/products/:id  — delete own product
export const deleteProduct = async (req, res) => {
  try {
    const PM = getProductModel();
    if (isMongoConnected() && !isMongoId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Product ID is invalid.' });
    }
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
const getVendorOrders = async (OrderModel, vendorId) => {
  const query = { 'items.vendor': vendorId };
  let orders;
  if (isMongoConnected()) {
    orders = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
  } else {
    orders = await OrderModel.find({ 'items.vendor': vendorId.toString() });
  }
  return (Array.isArray(orders) ? orders : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getVendorOrderItems = (order, vendorId) =>
  (order.items || []).filter(item => item.vendor?.toString() === vendorId.toString());

const isRevenueOrder = (order) =>
  !['cancelled', 'refunded'].includes(order.status) &&
  !['failed', 'refunded'].includes(order.paymentStatus);

const summarizeVendorOrder = (order, vendorId) => {
  const items = getVendorOrderItems(order, vendorId);
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    total: items.reduce((sum, item) => sum + Number(item.subtotal || (item.price * item.quantity) || 0), 0),
    status: order.status,
    createdAt: order.createdAt,
    itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  };
};

export const getVendorStats = async (req, res) => {
  try {
    const PM  = getProductModel();
    const VPM = getVendorProfileModel();
    const OM  = getOrderModel();
    const vid = req.user._id;

    const vendorProfile = await VPM.findOne({ userId: vid });

    let products = [];
    if (isMongoConnected()) {
      products = await PM.find({ vendor: vid }).lean();
    } else {
      products = await PM.find({ vendor: vid.toString() });
      if (typeof products.then === 'function') products = await products;
      if (!Array.isArray(products)) products = [];
    }

    const orders = await getVendorOrders(OM, vid);
    const revenueOrders = orders.filter(isRevenueOrder);
    const ordersRevenue = revenueOrders.reduce((sum, order) =>
      sum + getVendorOrderItems(order, vid).reduce((itemsSum, item) =>
        itemsSum + Number(item.subtotal || (item.price * item.quantity) || 0), 0), 0);
    const totalOrders = orders.length;
    const totalRevenue = ordersRevenue || vendorProfile?.totalEarnings || 0;
    const recentOrders = orders.slice(0, 5).map(order => summarizeVendorOrder(order, vid));

    const totalProducts    = products.length;
    const activeProducts   = products.filter(p => p.isAvailable).length;
    const outOfStock       = products.filter(p => p.stock === 0).length;
    const lowStock         = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const totalSales       = products.reduce((s, p) => s + (p.totalSales || 0), 0);
    const withdrawable     = vendorProfile?.withdrawableBalance || 0;
    const commissionRate   = vendorProfile?.commissionRate || 10;

    res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        outOfStock,
        lowStock,
        totalOrders,
        totalSales,
        totalRevenue,
        withdrawable,
        commissionRate,
        recentOrders
      }
    });
  } catch (err) {
    console.error('[Products] getVendorStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR SALES REPORT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendor/sales-report — monthly breakdown + top products
export const getVendorSalesReport = async (req, res) => {
  try {
    const PM  = getProductModel();
    const OM  = getOrderModel();
    const vid = req.user._id;

    // Get vendor's products
    let products = [];
    if (isMongoConnected()) {
      products = await PM.find({ vendor: vid }).lean();
    } else {
      products = await PM.find({ vendor: vid.toString() });
      if (typeof products.then === 'function') products = await products;
      if (!Array.isArray(products)) products = [];
    }

    // Build top-performing products by totalSales
    const topProducts = [...products]
      .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
      .slice(0, 5)
      .map(p => ({
        _id:        p._id,
        name:       p.name,
        thumbnail:  p.thumbnail,
        price:      p.price,
        totalSales: p.totalSales || 0,
        revenue:    Math.round(p.price * (1 - (p.discountPercent || 0) / 100) * (p.totalSales || 0))
      }));

    const orders = await getVendorOrders(OM, vid);
    const revenueOrders = orders.filter(isRevenueOrder);
    const now = new Date();
    const monthlyBuckets = new Map();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyBuckets.set(key, {
        month: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        revenue: 0,
        orderIds: new Set()
      });
    }

    for (const order of revenueOrders) {
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthlyBuckets.get(key);
      if (!bucket) continue;
      const items = getVendorOrderItems(order, vid);
      bucket.revenue += items.reduce((sum, item) =>
        sum + Number(item.subtotal || (item.price * item.quantity) || 0), 0);
      bucket.orderIds.add(order._id.toString());
    }

    const monthlyData = Array.from(monthlyBuckets.values()).map(bucket => ({
      month: bucket.month,
      revenue: Math.round(bucket.revenue),
      orders: bucket.orderIds.size
    }));
    const totalRevenue = revenueOrders.reduce((sum, order) =>
      sum + getVendorOrderItems(order, vid).reduce((itemsSum, item) =>
        itemsSum + Number(item.subtotal || (item.price * item.quantity) || 0), 0), 0);
    const totalOrders = revenueOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    res.json({
      success: true,
      report: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        monthlyData,
        topProducts
      }
    });
  } catch (err) {
    console.error('[Products] getVendorSalesReport error:', err);
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

// PATCH /api/admin/products/:id — administrator product moderation
export const updateAdminProduct = async (req, res) => {
  try {
    const updates = {};
    const textFields = ['name', 'description'];
    for (const field of textFields) {
      if (req.body?.[field] !== undefined) {
        if (typeof req.body[field] !== 'string' || !req.body[field].trim()) {
          return res.status(400).json({ success: false, message: `${field} is required.` });
        }
        updates[field] = req.body[field].trim();
      }
    }
    if (updates.name && updates.name.length > 200) {
      return res.status(400).json({ success: false, message: 'Product name cannot exceed 200 characters.' });
    }
    if (updates.name) {
      const suffix = String(req.params.id).replace(/[^a-z0-9]/gi, '').slice(-12).toLowerCase();
      updates.slug = `${updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${suffix}`;
    }
    if (updates.description && updates.description.length > 3000) {
      return res.status(400).json({ success: false, message: 'Product description cannot exceed 3000 characters.' });
    }
    for (const field of ['price', 'discountPercent', 'stock']) {
      if (req.body?.[field] !== undefined) {
        const value = Number(req.body[field]);
        const valid = Number.isFinite(value) && value >= 0 &&
          (field !== 'discountPercent' || value <= 100) &&
          (field !== 'stock' || Number.isInteger(value));
        if (!valid) return res.status(400).json({ success: false, message: `Invalid ${field} value.` });
        updates[field] = value;
      }
    }
    for (const field of ['isAvailable', 'isApproved']) {
      if (req.body?.[field] !== undefined) {
        if (typeof req.body[field] !== 'boolean') {
          return res.status(400).json({ success: false, message: `${field} must be true or false.` });
        }
        updates[field] = req.body[field];
      }
    }
    if (req.body?.category !== undefined) {
      if (typeof req.body.category !== 'string' || !req.body.category.trim()) {
        return res.status(400).json({ success: false, message: 'A product category is required.' });
      }
      const category = await getCategoryModel().findById(req.body.category);
      if (!category) return res.status(400).json({ success: false, message: 'Selected category was not found.' });
      updates.category = req.body.category;
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'Provide at least one product field to update.' });
    }

    const PM = getProductModel();
    const product = await PM.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Unable to update product.' });
  }
};

// DELETE /api/admin/products/:id — administrator product removal
export const deleteAdminProduct = async (req, res) => {
  try {
    const PM = getProductModel();
    const product = await PM.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Unable to delete product.' });
  }
};
