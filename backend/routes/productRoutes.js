import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js'

const router = express.Router()

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', getProducts)

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', getProductById)

// @route   POST /api/products
// @desc    Create new product
// @access  Private/Admin
router.post('/', protect, authorize('admin'), createProduct)

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), updateProduct)

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteProduct)

export default router

