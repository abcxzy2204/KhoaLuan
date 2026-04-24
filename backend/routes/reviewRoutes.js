import express from 'express'
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviews
} from '../controllers/reviewController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/products/:productId/reviews
// @desc    Get reviews for a product
// @access  Public
router.get('/products/:productId/reviews', getProductReviews)

// @route   POST /api/products/:productId/reviews
// @desc    Create review
// @access  Private
router.post('/products/:productId/reviews', protect, createReview)

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private
router.put('/reviews/:id', protect, updateReview)

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private
router.delete('/reviews/:id', protect, deleteReview)

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Private/Admin
router.get('/reviews', protect, getAllReviews)

export default router

