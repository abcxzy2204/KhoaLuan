import express from 'express';
import { chatWithAI, suggestDescription } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/ai/chat
 * @access  Public
 */
router.post('/chat', chatWithAI);

/**
 * @route   POST /api/ai/suggest-description
 * @access  Private/Admin
 */
router.post('/suggest-description', protect, authorize('admin'), suggestDescription);

export default router;
