import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images as static files at /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'MultiCart Multi-Vendor REST API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount modular routes
app.use('/api/auth',    authRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/vendor',  vendorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api',         contactRoutes);
app.use('/api',         reviewRoutes);
app.use('/api',         shoppingRoutes); // Authenticated customer cart + wishlist
app.use('/api',         orderRoutes);    // Checkout, customer orders, and vendor fulfillment
app.use('/api',         publicRoutes);   // Public: /api/products, /api/categories

// Catch 404 and global error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
