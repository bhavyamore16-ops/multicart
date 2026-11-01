import express from 'express';
import {
  getAllUsers,
  getVendorApplications,
  updateVendorStatus,
  toggleUserStatus
} from '../controllers/adminController.js';
import { getAllProductsAdmin } from '../controllers/productController.js';
import { createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All admin routes require authentication and the 'admin' role
router.use(protect);
router.use(requireRole('admin'));

// User management
router.get('/users',                    getAllUsers);
router.put('/users/:id/toggle-status',  toggleUserStatus);

// Vendor management
router.get('/vendors',                  getVendorApplications);
router.put('/vendors/:id/status',       updateVendorStatus);

// Product management (admin view)
router.get('/products',                 getAllProductsAdmin);

// Category management
router.post('/categories',              createCategory);
router.put('/categories/:id',           updateCategory);
router.delete('/categories/:id',        deleteCategory);

export default router;
