import express from 'express';
import {
  addCartItem,
  addWishlistProduct,
  clearCustomerCart,
  getCustomerCart,
  getCustomerWishlist,
  mergeGuestCart,
  removeCartItem,
  removeWishlistProduct,
  updateCartItem,
  validateCustomerCart
} from '../controllers/shoppingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();
const customerOnly = [protect, requireRole('customer')];

router.get('/cart', ...customerOnly, getCustomerCart);
router.post('/cart/items', ...customerOnly, addCartItem);
router.patch('/cart/items/:productId', ...customerOnly, updateCartItem);
router.delete('/cart/items/:productId', ...customerOnly, removeCartItem);
router.delete('/cart', ...customerOnly, clearCustomerCart);
router.post('/cart/merge', ...customerOnly, mergeGuestCart);
router.post('/cart/validate', ...customerOnly, validateCustomerCart);

router.get('/wishlist', ...customerOnly, getCustomerWishlist);
router.post('/wishlist/items', ...customerOnly, addWishlistProduct);
router.delete('/wishlist/items/:productId', ...customerOnly, removeWishlistProduct);

export default router;
