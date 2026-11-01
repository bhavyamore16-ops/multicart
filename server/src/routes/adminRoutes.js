import express from 'express';
import {
  getAllUsers,
  getVendorApplications,
  updateVendorStatus,
  toggleUserStatus,
  getAdminOverview,
  getAdminReports
} from '../controllers/adminController.js';
import { getAllProductsAdmin, updateAdminProduct, deleteAdminProduct } from '../controllers/productController.js';
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { getAdminTransactions, getAllAdminOrders, updateAdminOrderStatus } from '../controllers/orderController.js';
import { deleteAdminContactMessage, getAdminContactMessages, updateAdminContactMessage } from '../controllers/contactController.js';

const router = express.Router();

// All admin routes require authentication and the 'admin' role
router.use(protect);
router.use(requireRole('admin'));

// User management
router.get('/overview', getAdminOverview);
router.get('/reports', getAdminReports);
router.get('/users',                    getAllUsers);
router.put('/users/:id/toggle-status',  toggleUserStatus);

// Order and payment transaction oversight
router.get('/orders', getAllAdminOrders);
router.get('/orders/transactions', getAdminTransactions);
router.patch('/orders/:id/status', updateAdminOrderStatus);

// Vendor management
router.get('/vendors',                  getVendorApplications);
router.put('/vendors/:id/status',       updateVendorStatus);

// Product management (admin view)
router.get('/products',                 getAllProductsAdmin);
router.patch('/products/:id',           updateAdminProduct);
router.delete('/products/:id',          deleteAdminProduct);

// Category management
router.get('/categories',             getAdminCategories);
router.post('/categories',              createCategory);
router.put('/categories/:id',           updateCategory);
router.delete('/categories/:id',        deleteCategory);

// Customer support inbox
router.get('/messages', getAdminContactMessages);
router.patch('/messages/:id', updateAdminContactMessage);
router.delete('/messages/:id', deleteAdminContactMessage);

export default router;
