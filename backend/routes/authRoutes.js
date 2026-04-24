import express from 'express'
import { register, login, getMe, updateProfile, changePassword, forgotPassword, verifyResetCode, resetPassword } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', register)

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login)

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe)

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfile)

// @route   PUT /api/auth/change-password
// @desc    User changes their password
// @access  Private
router.put('/change-password', protect, changePassword)

// @route   POST /api/auth/forgot-password
// @desc    Request reset password code via email
// @access  Public
router.post('/forgot-password', forgotPassword)

// @route   POST /api/auth/verify-reset-code
// @desc    Verify reset code before showing new password form
// @access  Public
router.post('/verify-reset-code', verifyResetCode)

// @route   POST /api/auth/reset-password
// @desc    Reset password with email + code
// @access  Public
router.post('/reset-password', resetPassword)

export default router

