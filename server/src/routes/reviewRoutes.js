import express from 'express';
import { createProductReview, getProductReviews, getReviewEligibility } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();
const customerOnly = [protect, requireRole('customer')];
router.get('/products/:id/reviews', getProductReviews);
router.get('/reviews/products/:id/eligibility', ...customerOnly, getReviewEligibility);
router.post('/products/:id/reviews', ...customerOnly, createProductReview);

export default router;
