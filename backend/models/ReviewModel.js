import pool from '../config/db.js'
import UserModel from './UserModel.js'

class ReviewModel {
  static async findByProductId(productId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM reviews WHERE productId = ? ORDER BY createdAt DESC',
        [productId]
      )
      return rows
    } catch (error) {
      console.error('Error in ReviewModel.findByProductId:', error)
      throw error
    }
  }

  static async findAll() {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, p.name as productName 
         FROM reviews r 
         LEFT JOIN products p ON r.productId = p.id 
         ORDER BY r.createdAt DESC`
      )
      return rows
    } catch (error) {
      console.error('Error in ReviewModel.findAll:', error)
      throw error
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM reviews WHERE id = ?',
        [id]
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error in ReviewModel.findById:', error)
      throw error
    }
  }

  static async findByUserAndProduct(userId, productId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM reviews WHERE userId = ? AND productId = ?',
        [userId, productId]
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error in ReviewModel.findByUserAndProduct:', error)
      throw error
    }
  }

  static async create(reviewData) {
    try {
      const { productId, userId, rating, comment } = reviewData

      // Get user info
      const user = await UserModel.findById(userId)
      if (!user) {
        return { error: 'User not found' }
      }

      const [result] = await pool.execute(
        'INSERT INTO reviews (productId, userId, userName, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [productId, userId, user.name, rating, comment || '']
      )

      return await this.findById(result.insertId)
    } catch (error) {
      console.error('Error in ReviewModel.create:', error)
      throw error
    }
  }

  static async update(id, reviewData) {
    try {
      const fields = []
      const values = []

      Object.keys(reviewData).forEach(key => {
        fields.push(`${key} = ?`)
        values.push(reviewData[key])
      })

      if (fields.length === 0) {
        return await this.findById(id)
      }

      values.push(id)

      await pool.execute(
        `UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`,
        values
      )

      return await this.findById(id)
    } catch (error) {
      console.error('Error in ReviewModel.update:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM reviews WHERE id = ?',
        [id]
      )
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error in ReviewModel.delete:', error)
      throw error
    }
  }

  static async getAverageRating(productId) {
    try {
      const [rows] = await pool.execute(
        'SELECT AVG(rating) as avgRating FROM reviews WHERE productId = ?',
        [productId]
      )
      return rows[0].avgRating ? parseFloat(rows[0].avgRating).toFixed(1) : '0.0'
    } catch (error) {
      console.error('Error in ReviewModel.getAverageRating:', error)
      return '0.0'
    }
  }

  static async getRatingCount(productId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM reviews WHERE productId = ?',
        [productId]
      )
      return rows[0].count
    } catch (error) {
      console.error('Error in ReviewModel.getRatingCount:', error)
      return 0
    }
  }

  static async getRatingDistribution(productId) {
    try {
      const [rows] = await pool.execute(
        `SELECT rating, COUNT(*) as count 
         FROM reviews 
         WHERE productId = ? 
         GROUP BY rating`,
        [productId]
      )

      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      rows.forEach(row => {
        if (row.rating >= 1 && row.rating <= 5) {
          distribution[row.rating] = row.count
        }
      })

      return distribution
    } catch (error) {
      console.error('Error in ReviewModel.getRatingDistribution:', error)
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
  }
}

export default ReviewModel
