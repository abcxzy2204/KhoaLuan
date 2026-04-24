import UserModel from '../models/UserModel.js'
import PasswordResetModel from '../models/PasswordResetModel.js'
import { sendResetPasswordCode } from '../utils/mailer.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  })
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    // Check if user exists
    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được đăng ký'
      })
    }

    // Create user
    const user = await UserModel.create({ name, email, password })

    if (user.error) {
      return res.status(400).json({
        success: false,
        message: user.error
      })
    }

    // Generate token
    const token = generateToken(user.id)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      })
    }

    // Verify credentials
    const user = await UserModel.verifyPassword(email, password)

    if (user.error) {
      return res.status(401).json({
        success: false,
        message: user.error
      })
    }

    // Generate token
    const token = generateToken(user.id)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, dob, gender, phone, email, avatar } = req.body;
    
    // Validate if email is changed to an existing one
    if (email) {
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.userId) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng bởi người dùng khác'
        });
      }
    }

    // Filter out undefined fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (dob !== undefined) updateData.dob = dob ? dob : null; 
    if (gender !== undefined) updateData.gender = gender;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await UserModel.update(req.user.userId, updateData);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Get user email to verify password
    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Verify current password
    const verifiedUser = await UserModel.verifyPassword(user.email, currentPassword);
    if (verifiedUser.error) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    // Update password
    await UserModel.updatePassword(req.user.userId, newPassword);

    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
}

// @desc    Request forgot password code
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email' })
    }

    const user = await UserModel.findByEmail(email)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email chưa được đăng ký tài khoản.'
      })
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await PasswordResetModel.createCode(email, code, expiresAt)
    const sendResult = await sendResetPasswordCode(email, code)

    if (sendResult?.skipped) {
      return res.status(500).json({
        success: false,
        message: 'SMTP chưa cấu hình đúng. Chưa thể gửi email mã xác thực.'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Mã xác thực đã được gửi về email của bạn.'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message })
  }
}

// @desc    Verify reset password code
// @route   POST /api/auth/verify-reset-code
// @access  Public
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mã xác thực' })
    }

    const validCode = await PasswordResetModel.findValidCode(email, String(code))
    if (!validCode) {
      return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn' })
    }

    return res.status(200).json({ success: true, message: 'Mã xác thực hợp lệ' })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message })
  }
}

// @desc    Reset password by email + code
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' })
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 6 ký tự' })
    }

    const validCode = await PasswordResetModel.findValidCode(email, String(code))
    if (!validCode) {
      return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn' })
    }

    const user = await UserModel.findByEmail(email)
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email không tồn tại' })
    }

    await UserModel.updatePassword(user.id, newPassword)
    await PasswordResetModel.markUsed(validCode.id)

    res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message })
  }
}

