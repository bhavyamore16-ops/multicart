import express from 'express';
import {
  getProducts,
  getProductById
} from '../controllers/productController.js';
import { getCategories, getCategoryById } from '../controllers/categoryController.js';

const router = express.Router();

// Public product routes
router.get('/products', getProducts);
router.get('/products/:idOrSlug', getProductById);

// Public category routes
router.get('/categories', getCategories);
router.get('/categories/:id', getCategoryById);

export default router;
