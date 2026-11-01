import { getCategoryModel } from '../models/dataAccess.js';

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

// ── POST /api/admin/categories  (admin only) ────────────────────────────────
export const createCategory = async (req, res) => {
  try {
    const { name, description, icon, image, displayOrder } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const CategoryModel = getCategoryModel();
    const category = await CategoryModel.create({ name, description, icon, image, displayOrder });
    res.status(201).json({ success: true, message: 'Category created successfully.', category });
  } catch (err) {
    if (err.code === 11000 || err.message?.includes('already exists')) {
      return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/categories/:id  (admin only) ─────────────────────────────
export const updateCategory = async (req, res) => {
  try {
    const CategoryModel = getCategoryModel();
    const category = await CategoryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category updated successfully.', category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/admin/categories/:id  (admin only) ──────────────────────────
export const deleteCategory = async (req, res) => {
  try {
    const CategoryModel = getCategoryModel();
    const category = await CategoryModel.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
