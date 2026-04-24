import pool from '../config/db.js'

class OrderModel {
  static paymentColumnsEnsured = false

  static async ensurePaymentColumns() {
    if (this.paymentColumnsEnsured) return

    try {
      const dbName = process.env.DB_NAME

      const hasColumn = async (columnName) => {
        const [rows] = await pool.execute(
          `SELECT 1
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = ?
           LIMIT 1`,
          [dbName, columnName]
        )
        return rows.length > 0
      }

      if (!(await hasColumn('paymentStatus'))) {
        await pool.execute("ALTER TABLE orders ADD COLUMN paymentStatus ENUM('unpaid','pending','paid','failed','refunded') DEFAULT 'unpaid'")
      }
      if (!(await hasColumn('paymentProvider'))) {
        await pool.execute('ALTER TABLE orders ADD COLUMN paymentProvider VARCHAR(50) NULL')
      }
      if (!(await hasColumn('paymentRef'))) {
        await pool.execute('ALTER TABLE orders ADD COLUMN paymentRef VARCHAR(100) NULL')
      }
      if (!(await hasColumn('transactionId'))) {
        await pool.execute('ALTER TABLE orders ADD COLUMN transactionId VARCHAR(120) NULL')
      }
      if (!(await hasColumn('paymentExpiresAt'))) {
        await pool.execute('ALTER TABLE orders ADD COLUMN paymentExpiresAt DATETIME NULL')
      }
      if (!(await hasColumn('paidAt'))) {
        await pool.execute('ALTER TABLE orders ADD COLUMN paidAt DATETIME NULL')
      }

      const [idxRows] = await pool.execute(
        `SELECT 1
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_paymentRef'
         LIMIT 1`,
        [dbName]
      )
      if (!idxRows.length) {
        await pool.execute('CREATE INDEX idx_orders_paymentRef ON orders(paymentRef)')
      }

      this.paymentColumnsEnsured = true
    } catch (error) {
      console.error('Error ensuring payment columns:', error)
      throw error
    }
  }

  static async createOrder(userId, orderData, items) {
    const connection = await pool.getConnection()
    try {
      await this.ensurePaymentColumns()
      await connection.beginTransaction()

      const {
        customerName,
        customerPhone,
        customerAddress,
        totalAmount,
        paymentMethod = 'cod',
        couponCode = null,
        discountAmount = 0,
        paymentStatus,
        paymentProvider = null,
        paymentRef = null,
        transactionId = null,
        paymentExpiresAt = null,
        paidAt = null
      } = orderData

      const computedPaymentStatus = paymentStatus || (paymentMethod === 'cod' ? 'unpaid' : 'pending')

      const [orderResult] = await connection.execute(
        `INSERT INTO orders (userId, customerName, customerPhone, customerAddress, totalAmount, paymentMethod, couponCode, discountAmount, paymentStatus, paymentProvider, paymentRef, transactionId, paymentExpiresAt, paidAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          customerName,
          customerPhone,
          customerAddress,
          totalAmount,
          paymentMethod,
          couponCode,
          discountAmount,
          computedPaymentStatus,
          paymentProvider,
          paymentRef,
          transactionId,
          paymentExpiresAt,
          paidAt
        ]
      )

      const orderId = orderResult.insertId

      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items (orderId, productId, productName, price, quantity, selectedSize, selectedColor)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.productId,
            item.productName,
            item.price,
            item.quantity,
            item.selectedSize || null,
            item.selectedColor || null,
          ]
        )
      }

      await connection.commit()
      return await this.findById(orderId)
    } catch (error) {
      await connection.rollback()
      console.error('Error in OrderModel.createOrder:', error)
      throw error
    } finally {
      connection.release()
    }
  }

  static async findById(id) {
    try {
      const [orders] = await pool.execute(
        'SELECT * FROM orders WHERE id = ?',
        [id]
      )
      if (!orders || orders.length === 0) return null

      const order = orders[0]
      const [items] = await pool.execute(
        `SELECT i.*, p.image as productImage 
         FROM order_items i 
         LEFT JOIN products p ON i.productId = p.id 
         WHERE i.orderId = ?`,
        [id]
      )

      return { ...order, items }
    } catch (error) {
      console.error('Error in OrderModel.findById:', error)
      throw error
    }
  }

  static async findByUser(userId) {
    try {
      const [orders] = await pool.execute(
        'SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      )
      const results = []
      for (const order of orders) {
        const [items] = await pool.execute(
          `SELECT i.*, p.image as productImage 
           FROM order_items i 
           LEFT JOIN products p ON i.productId = p.id 
           WHERE i.orderId = ?`,
          [order.id]
        )
        results.push({ ...order, items })
      }
      return results
    } catch (error) {
      console.error('Error in OrderModel.findByUser:', error)
      throw error
    }
  }

  static async findAll() {
    try {
      const [orders] = await pool.execute(
        `SELECT o.*, u.name as userName, u.email as userEmail
         FROM orders o
         LEFT JOIN users u ON o.userId = u.id
         ORDER BY o.createdAt DESC`
      )
      return orders
    } catch (error) {
      console.error('Error in OrderModel.findAll:', error)
      throw error
    }
  }

  static async getCompletedOrdersWithItems() {
    try {
      const [rows] = await pool.execute(
        `SELECT o.id as orderId, o.createdAt, o.totalAmount, o.status,
                oi.price as itemPrice, oi.quantity, p.costPrice
         FROM orders o
         JOIN order_items oi ON o.id = oi.orderId
         LEFT JOIN products p ON oi.productId = p.id
         WHERE o.status = 'completed'`
      )
      return rows
    } catch (error) {
      console.error('Error in OrderModel.getCompletedOrdersWithItems:', error)
      throw error
    }
  }

  static async updateStatus(id, status) {
    try {
      await pool.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, id]
      )
      return await this.findById(id)
    } catch (error) {
      console.error('Error in OrderModel.updateStatus:', error)
      throw error
    }
  }

  static async updatePayment(id, payload = {}) {
    try {
      await this.ensurePaymentColumns()

      const allowed = [
        'paymentStatus',
        'paymentProvider',
        'paymentRef',
        'transactionId',
        'paymentExpiresAt',
        'paidAt',
        'paymentMethod'
      ]

      const fields = []
      const values = []

      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          fields.push(`${key} = ?`)
          values.push(payload[key])
        }
      }

      if (fields.length === 0) return await this.findById(id)

      values.push(id)
      await pool.execute(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values)
      return await this.findById(id)
    } catch (error) {
      console.error('Error in OrderModel.updatePayment:', error)
      throw error
    }
  }

  static async findByPaymentRef(paymentRef) {
    try {
      await this.ensurePaymentColumns()
      const [rows] = await pool.execute('SELECT id FROM orders WHERE paymentRef = ? LIMIT 1', [paymentRef])
      if (!rows?.length) return null
      return await this.findById(rows[0].id)
    } catch (error) {
      console.error('Error in OrderModel.findByPaymentRef:', error)
      throw error
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await connection.execute('DELETE FROM order_items WHERE orderId = ?', [id])
      const [result] = await connection.execute('DELETE FROM orders WHERE id = ?', [id])
      await connection.commit()
      return result.affectedRows > 0
    } catch (error) {
      await connection.rollback()
      console.error('Error in OrderModel.delete:', error)
      throw error
    } finally {
      connection.release()
    }
  }
}

export default OrderModel

