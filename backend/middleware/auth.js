import jwt from 'jsonwebtoken'
import UserModel from '../models/UserModel.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      })
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET)
      
      // Check if user still exists
      const user = await UserModel.findById(decoded.userId)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        })
      }

      // Chỉ chặn khi bị khóa rõ ràng (0/false). Tránh khóa nhầm dữ liệu cũ chưa có cột isActive.
      if (user.isActive === 0 || user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        })
      }

      // Attach user to request
      req.user = decoded
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// Grant access to specific roles
export const authorize = (...roles) => {
  return async (req, res, next) => {
    const user = await UserModel.findById(req.user.userId)
    
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${user?.role}' is not authorized to access this route`
      })
    }
    next()
  }
}

