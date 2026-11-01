import express from 'express';
import { createContactMessage, getMyContactMessages } from '../controllers/contactController.js';
import { optionalProtect, protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();
router.post('/messages', optionalProtect, createContactMessage);
router.get('/messages/mine', protect, requireRole('customer'), getMyContactMessages);

export default router;
