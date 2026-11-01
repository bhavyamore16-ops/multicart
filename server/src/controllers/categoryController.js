import { getCategoryModel, getProductModel } from '../models/dataAccess.js';

// ── GET /api/categories  (public) ───────────────────────────────────────────
export const getCategories = async (req, res) => {
  try {
    const CategoryModel = getCategoryModel();
    const categories = await CategoryModel.find({ isActive: true });
    res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/categories/:id  (public) ───────────────────────────────────────
export const getCategoryById = async (req, res) => {
  try {
    const CategoryModel = getCategoryModel();
    const category = await CategoryModel.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/categories (admin only) ──────────────────────────────────
export const getAdminCategories = async (req, res, next) => {
  try {
    const CategoryModel = getCategoryModel();
    const categories = await CategoryModel.find({});
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/admin/categories  (admin only) ────────────────────────────────
export const createCategory = async (req, res) => {
  try {
    const { name, description, icon, image, displayOrder } = req.body;
    const normalizedName = String(name || '').trim();
    if (!normalizedName || normalizedName.length > 80) {
      return res.status(400).json({ success: false, message: 'Category name must be between 1 and 80 characters.' });
    }
    if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
      return res.status(400).json({ success: false, message: 'Category description cannot exceed 500 characters.' });
    }
    if (displayOrder !== undefined && (!Number.isInteger(Number(displayOrder)) || Number(displayOrder) < 0)) {
      return res.status(400).json({ success: false, message: 'Display order must be a non-negative whole number.' });
    }

    const CategoryModel = getCategoryModel();
    const category = await CategoryModel.create({ name: normalizedName, description, icon, image, displayOrder: Number(displayOrder || 0) });
    res.status(201).json({ success: true, message: 'Category created successfully.', category });
  } catch (err) {
    if (err.code === 11000 || err.message?.includes('already exists')) {
      return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/categories/:id  (admin only) ─────────────────────────────
export const updateCategory = async (req, res) => {
  try {
    const CategoryModel = getCategoryModel();
    const allowed = ['name', 'description', 'icon', 'image', 'displayOrder', 'isActive'];
    const updates = Object.fromEntries(allowed
      .filter(key => req.body?.[key] !== undefined)
      .map(key => [key, req.body[key]]));
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string') return res.status(400).json({ success: false, message: 'Category name must be text.' });
      updates.name = String(updates.name).trim();
      if (!updates.name || updates.name.length > 80) {
        return res.status(400).json({ success: false, message: 'Category name must be between 1 and 80 characters.' });
      }
      updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (updates.description !== undefined && (typeof updates.description !== 'string' || updates.description.length > 500)) {
      return res.status(400).json({ success: false, message: 'Category description cannot exceed 500 characters.' });
    }
    if (updates.icon !== undefined && (typeof updates.icon !== 'string' || updates.icon.length > 16)) {
      return res.status(400).json({ success: false, message: 'Category icon must be text up to 16 characters.' });
    }
    if (updates.image !== undefined && (typeof updates.image !== 'string' || updates.image.length > 2048)) {
      return res.status(400).json({ success: false, message: 'Category image must be a valid text reference up to 2048 characters.' });
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Provide at least one category field to update.' });
    if (updates.displayOrder !== undefined && (!Number.isInteger(Number(updates.displayOrder)) || Number(updates.displayOrder) < 0)) {
      return res.status(400).json({ success: false, message: 'Display order must be a non-negative whole number.' });
    }
    if (updates.displayOrder !== undefined) updates.displayOrder = Number(updates.displayOrder);
    if (updates.isActive !== undefined && typeof updates.isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be true or false.' });
    }
    const category = await CategoryModel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category updated successfully.', category });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/admin/categories/:id  (admin only) ──────────────────────────
export const deleteCategory = async (req, res) => {
  try {
    const CategoryModel = getCategoryModel();
    const ProductModel = getProductModel();
    const assignedProducts = await ProductModel.find({ category: req.params.id });
    if (assignedProducts.length) {
      return res.status(409).json({ success: false, message: 'This category is assigned to products. Reassign or delete those products first.' });
    }
    const category = await CategoryModel.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
