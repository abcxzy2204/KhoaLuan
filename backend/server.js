import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import productRoutes from './routes/productRoutes.js'
import authRoutes from './routes/authRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import userRoutes from './routes/userRoutes.js'
import statsRoutes from './routes/statsRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import couponRoutes from './routes/couponRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { logger } from './middleware/logger.js'
import pool from './config/db.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(logger)

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.use('/api/products', productRoutes)
app.use('/api/auth', authRoutes)
app.use('/api', reviewRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/contacts', contactRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/ai', aiRoutes)

// Folder static lưu trữ ảnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Error handling middleware (must be last)
app.use(notFound)
app.use(errorHandler)

// Start server (auto fallback port if current one is busy)
const startServer = async (port) => {
  const server = app
    .listen(port, async () => {
      console.log(`🚀 Server is running on http://localhost:${port}`)
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)

      // Test database connection
      try {
        const connection = await pool.getConnection()
        console.log('✅ MySQL database connected')
        connection.release()

        // Ensure column for user lock/unlock exists (compatible with older MySQL)
        const [isActiveColumn] = await pool.execute(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'users'
             AND COLUMN_NAME = 'isActive'
           LIMIT 1`
        )

        if (!isActiveColumn || isActiveColumn.length === 0) {
          await pool.execute('ALTER TABLE users ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1')
          console.log('✅ Added users.isActive column')
        }

        // Ensure admin user exists (email: admin@example.com, password: admin123)
        const adminEmail = 'admin@example.com'
        const [rows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail])
        if (!rows || rows.length === 0) {
          const hash = await bcrypt.hash('admin123', 10)
          await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Admin', adminEmail, hash, 'admin']
          )
          console.log('✅ Admin user created: admin@example.com / admin123')
        }
      } catch (error) {
        console.error('❌ MySQL connection error:', error.message)
        console.log('⚠️  Make sure MySQL is running and .env file is configured')
      }
    })
    .on('error', (error) => {
      if (error?.code === 'EADDRINUSE') {
        const nextPort = Number(port) + 1
        console.warn(`⚠️ Port ${port} is in use. Retrying on ${nextPort}...`)
        startServer(nextPort)
        return
      }

      console.error('❌ Failed to start server:', error)
      process.exit(1)
    })

  return server
}

startServer(Number(PORT))
