import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { getDashboardStats } from '../controllers/statsController.js'

const router = express.Router()

router.get('/', protect, authorize('admin'), getDashboardStats)

export default router
