import pool from '../config/db.js'

class ProductModel {
  static async findAll(filters = {}) {
    try {
      let query = "SELECT *, (SELECT COALESCE(SUM(quantity), 0) FROM order_items oi JOIN orders o ON oi.orderId = o.id WHERE oi.productId = products.id AND o.status != 'cancelled') AS soldCount FROM products WHERE 1=1"
      const params = []

      // Filter by category
      if (filters.category && filters.category !== 'all') {
        query += ' AND category = ?'
        params.push(filters.category)
      }

      // Filter by search term
      if (filters.search) {
        query += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)'
        const searchTerm = `%${filters.search}%`
        params.push(searchTerm, searchTerm, searchTerm)
      }

      // Sort by price or popularity
      if (filters.sortBy === 'price-asc') {
        query += ' ORDER BY price ASC'
      } else if (filters.sortBy === 'price-desc') {
        query += ' ORDER BY price DESC'
      } else if (filters.sortBy === 'popular') {
        query += ' ORDER BY soldCount DESC, createdAt DESC'
      } else {
        query += ' ORDER BY createdAt DESC'
      }

      // Limit results
      if (filters.limit) {
        // MySQL prepared statements may not accept LIMIT ? placeholders in some versions/configs.
        // Inject a validated integer to avoid ER_WRONG_ARGUMENTS (1210).
        const limit = Number.parseInt(filters.limit, 10)
        if (Number.isFinite(limit) && limit > 0) {
          query += ` LIMIT ${limit}`
        }
      }

      const [rows] = await pool.execute(query, params)
      
      // Parse JSON fields
      return rows.map(row => ({
        ...row,
        colors: row.colors
          ? (typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors)
          : [],
        sizes: row.sizes
          ? (typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes)
          : [],
        price: parseFloat(row.price),
        costPrice: row.costPrice ? parseFloat(row.costPrice) : null,
        originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : null
      }))
    } catch (error) {
      console.error('Error in ProductModel.findAll:', error)
      throw error
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM products WHERE id = ?',
        [id]
      )

      if (rows.length === 0) {
        return null
      }

      const product = rows[0]
      return {
        ...product,
        colors: product.colors
          ? (typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors)
          : [],
        sizes: product.sizes
          ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes)
          : [],
        price: parseFloat(product.price),
        costPrice: product.costPrice ? parseFloat(product.costPrice) : null,
        originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null
      }
    } catch (error) {
      console.error('Error in ProductModel.findById:', error)
      throw error
    }
  }

  static async create(productData) {
    try {
      const {
        name,
        price,
        costPrice,
        category,
        description,
        image,
        sizes,
        colors,
        stock,
        originalPrice,
        sale
      } = productData

      const [result] = await pool.execute(
        `INSERT INTO products (name, price, costPrice, originalPrice, image, category, description, sizes, colors, stock, sale)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          price,
          costPrice || null,
          originalPrice || null,
          image || 'https://via.placeholder.com/400x400',
          category,
          description || '',
          JSON.stringify(sizes || []),
          JSON.stringify(colors || []),
          stock || 0,
          sale || null
        ]
      )

      return await this.findById(result.insertId)
    } catch (error) {
      console.error('Error in ProductModel.create:', error)
      throw error
    }
  }

  static async update(id, productData) {
    try {
      const fields = []
      const values = []

      Object.keys(productData).forEach(key => {
        if (key === 'sizes' || key === 'colors') {
          fields.push(`${key} = ?`)
          values.push(JSON.stringify(productData[key]))
        } else {
          fields.push(`${key} = ?`)
          values.push(productData[key])
        }
      })

      if (fields.length === 0) {
        return await this.findById(id)
      }

      values.push(id)

      await pool.execute(
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        values
      )

      return await this.findById(id)
    } catch (error) {
      console.error('Error in ProductModel.update:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM products WHERE id = ?',
        [id]
      )
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error in ProductModel.delete:', error)
      throw error
    }
  }

  static async getCategories() {
    try {
      const [rows] = await pool.execute(
        'SELECT DISTINCT category FROM products ORDER BY category'
      )
      return rows.map(row => row.category)
    } catch (error) {
      console.error('Error in ProductModel.getCategories:', error)
      throw error
    }
  }
}

export default ProductModel
