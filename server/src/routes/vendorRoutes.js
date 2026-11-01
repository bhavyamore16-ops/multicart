import express from 'express';
import {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorStats
} from '../controllers/productController.js';
import { getMyVendorProfile, updateVendorProfile } from '../controllers/vendorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireApprovedVendor, requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply auth + role check to all routes
router.use(protect);
router.use(requireRole('vendor'));

// Vendor profile
router.get('/profile',    getMyVendorProfile);
router.put('/profile',    updateVendorProfile);

// Vendor stats/dashboard overview
router.get('/stats',      requireApprovedVendor, getVendorStats);

// Product CRUD
router.get('/products',        requireApprovedVendor, getMyProducts);
router.post('/products',       requireApprovedVendor, createProduct);
router.put('/products/:id',    requireApprovedVendor, updateProduct);
router.delete('/products/:id', requireApprovedVendor, deleteProduct);

export default router;
