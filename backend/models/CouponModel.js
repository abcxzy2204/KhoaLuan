import pool from '../config/db.js'

class CouponModel {
  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM coupons ORDER BY createdAt DESC')
      return rows
    } catch (error) {
      console.error('Error in CouponModel.findAll:', error)
      throw error
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM coupons WHERE id = ?', [id])
      return rows[0] || null
    } catch (error) {
      console.error('Error in CouponModel.findById:', error)
      throw error
    }
  }

  static async findByCode(code) {
    try {
      const [rows] = await pool.execute('SELECT * FROM coupons WHERE code = ? AND status = 1', [code])
      return rows[0] || null
    } catch (error) {
      console.error('Error in CouponModel.findByCode:', error)
      throw error
    }
  }

  static async create(couponData) {
    try {
      const { code, type, value, minAmount, startDate, endDate, usageLimit } = couponData
      const [result] = await pool.execute(
        `INSERT INTO coupons (code, type, value, minAmount, startDate, endDate, usageLimit)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          type,
          value,
          minAmount || 0,
          startDate && startDate !== '' ? startDate : null,
          endDate && endDate !== '' ? endDate : null,
          usageLimit && usageLimit !== '' ? usageLimit : null
        ]
      )
      return await this.findById(result.insertId)
    } catch (error) {
      console.error('Error in CouponModel.create:', error)
      throw error
    }
  }

  static async update(id, couponData) {
    try {
      const fields = []
      const values = []
      const allowedFields = ['code', 'type', 'value', 'minAmount', 'startDate', 'endDate', 'usageLimit', 'status']

      Object.keys(couponData).forEach(key => {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`)
          let value = couponData[key]
          // Xử lý giá trị trống cho các trường date/number
          if ((key === 'startDate' || key === 'endDate' || key === 'usageLimit') && value === '') {
            value = null
          }
          values.push(value)
        }
      })

      if (fields.length === 0) return await this.findById(id)

      values.push(id)
      await pool.execute(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`, values)
      return await this.findById(id)
    } catch (error) {
      console.error('Error in CouponModel.update:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM coupons WHERE id = ?', [id])
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error in CouponModel.delete:', error)
      throw error
    }
  }

  static async incrementUsedCount(code) {
    try {
      await pool.execute('UPDATE coupons SET usedCount = usedCount + 1 WHERE code = ?', [code])
    } catch (error) {
      console.error('Error in CouponModel.incrementUsedCount:', error)
      throw error
    }
  }
}

export default CouponModel
