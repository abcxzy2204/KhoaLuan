import express from 'express'
import {
  getCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '../controllers/couponController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// Public
router.post('/validate', validateCoupon)

// Admin only
router.route('/')
  .get(protect, authorize('admin'), getCoupons)
  .post(protect, authorize('admin'), createCoupon)

router.route('/:id')
  .put(protect, authorize('admin'), updateCoupon)
  .delete(protect, authorize('admin'), deleteCoupon)

export default router
