import express from 'express';
import {
  cancelCustomerOrder,
  createCheckout,
  decideVendorOrder,
  getCheckoutOptions,
  getOrderDetails,
  getOrders,
  updateVendorShipment,
  verifyRazorpayCheckout
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();
const authenticated = [protect, requireRole('customer', 'vendor', 'admin')];
const customerOnly = [protect, requireRole('customer')];
const vendorOnly = [protect, requireRole('vendor')];

router.get('/checkout/options', ...customerOnly, getCheckoutOptions);
router.post('/checkout', ...customerOnly, createCheckout);
router.post('/checkout/verify', ...customerOnly, verifyRazorpayCheckout);

router.get('/orders', ...authenticated, getOrders);
router.get('/orders/:id', ...authenticated, getOrderDetails);
router.post('/orders/:id/cancel', ...customerOnly, cancelCustomerOrder);
router.post('/orders/:id/decision', ...vendorOnly, decideVendorOrder);
router.patch('/orders/:id/status', ...vendorOnly, updateVendorShipment);

export default router;
