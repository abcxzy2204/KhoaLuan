import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { getUsers, getUserById, deleteUser, adminChangePassword, adminToggleUserStatus, adminChangeUserRole } from '../controllers/userController.js'

const router = express.Router()

// Admin xem tất cả người dùng
router.get('/', protect, authorize('admin'), getUsers)

// Admin xem chi tiết người dùng
router.get('/:id', protect, authorize('admin'), getUserById)

// Admin xóa người dùng
router.delete('/:id', protect, authorize('admin'), deleteUser)

// Admin đổi mật khẩu người dùng
router.patch('/:id/password', protect, authorize('admin'), adminChangePassword)

// Admin khóa/mở tài khoản người dùng
router.patch('/:id/status', protect, authorize('admin'), adminToggleUserStatus)

// Admin phân quyền tài khoản (user/admin)
router.patch('/:id/role', protect, authorize('admin'), adminChangeUserRole)

export default router
