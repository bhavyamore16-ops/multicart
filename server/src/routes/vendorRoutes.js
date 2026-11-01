import express from 'express';
import {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorStats,
  getVendorSalesReport
} from '../controllers/productController.js';
import { getMyVendorProfile, updateVendorProfile } from '../controllers/vendorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireApprovedVendor, requireRole } from '../middleware/roleMiddleware.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

const handleImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : (error.status || 400);
    return res.status(status).json({
      success: false,
      message: error.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 5 MB or smaller.'
        : error.message
    });
  });
};

// Apply auth + role check to all routes
router.use(protect);
router.use(requireRole('vendor'));

// Vendor profile
router.get('/profile',    getMyVendorProfile);
router.put('/profile',    updateVendorProfile);

// Vendor stats/dashboard overview
router.get('/stats',      requireApprovedVendor, getVendorStats);

// Sales report for reports tab
router.get('/sales-report', requireApprovedVendor, getVendorSalesReport);

// Image upload — POST /api/vendor/upload  (multipart/form-data, field: "image")
router.post('/upload', requireApprovedVendor, handleImageUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided.' });
  }
  // Build the public URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Image uploaded successfully.',
    imageUrl,
    filename: req.file.filename,
    size: req.file.size
  });
});

// Product CRUD
router.get('/products',        requireApprovedVendor, getMyProducts);
router.post('/products',       requireApprovedVendor, createProduct);
router.put('/products/:id',    requireApprovedVendor, updateProduct);
router.delete('/products/:id', requireApprovedVendor, deleteProduct);

export default router;
