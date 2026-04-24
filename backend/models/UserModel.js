import pool from '../config/db.js'
import bcrypt from 'bcryptjs'

class UserModel {
  static async findAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, email, role, phone, dob, gender, avatar, isActive, createdAt, updatedAt FROM users'
      )
      return rows
    } catch (error) {
      console.error('Error in UserModel.findAll:', error)
      throw error
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, email, role, phone, dob, gender, avatar, isActive, createdAt, updatedAt FROM users WHERE id = ?',
        [id]
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error in UserModel.findById:', error)
      throw error
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error in UserModel.findByEmail:', error)
      throw error
    }
  }

  static async create(userData) {
    try {
      const { name, email, password } = userData

      // Check if user already exists
      const existingUser = await this.findByEmail(email)
      if (existingUser) {
        return { error: 'Email already exists' }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'user']
      )

      return await this.findById(result.insertId)
    } catch (error) {
      console.error('Error in UserModel.create:', error)
      throw error
    }
  }

  static async verifyPassword(email, password) {
    try {
      const user = await this.findByEmail(email)
      if (!user) {
        return { error: 'Invalid credentials' }
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return { error: 'Invalid credentials' }
      }

      // Chỉ chặn khi bị khóa rõ ràng (0/false). Tránh khóa nhầm dữ liệu cũ chưa có cột isActive.
      if (user.isActive === 0 || user.isActive === false) {
        return { error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' }
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user
      return userWithoutPassword
    } catch (error) {
      console.error('Error in UserModel.verifyPassword:', error)
      throw error
    }
  }

  static async update(id, userData) {
    try {
      const { password, ...updateData } = userData
      const fields = []
      const values = []

      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = ?`)
        values.push(updateData[key])
      })

      if (fields.length === 0) {
        return await this.findById(id)
      }

      values.push(id)

      await pool.execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      )

      return await this.findById(id)
    } catch (error) {
      console.error('Error in UserModel.update:', error)
      throw error
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      
      const [orders] = await connection.execute('SELECT id FROM orders WHERE userId = ?', [id])
      for (const o of orders) {
        await connection.execute('DELETE FROM order_items WHERE orderId = ?', [o.id])
      }
      await connection.execute('DELETE FROM orders WHERE userId = ?', [id])
      
      try { await connection.execute('DELETE FROM reviews WHERE userId = ?', [id]) } catch (e) {}
      
      const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [id])
      
      await connection.commit()
      return result.affectedRows > 0
    } catch (error) {
      await connection.rollback()
      console.error('Error in UserModel.delete:', error)
      throw error
    } finally {
      connection.release()
    }
  }

  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const [result] = await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      )
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error in UserModel.updatePassword:', error)
      throw error
    }
  }

  static async setActiveStatus(id, isActive) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET isActive = ? WHERE id = ?',
        [isActive ? 1 : 0, id]
      )
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error in UserModel.setActiveStatus:', error)
      throw error
    }
  }

  static async setRole(id, role) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, id]
      )
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error in UserModel.setRole:', error)
      throw error
    }
  }
}


export default UserModel
