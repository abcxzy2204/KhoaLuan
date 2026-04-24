import pool from '../config/db.js'

class ContactModel {
  static async create(contactData) {
    try {
      const { name, email, phone, address, message } = contactData
      const [result] = await pool.execute(
        'INSERT INTO contacts (name, email, phone, address, message) VALUES (?, ?, ?, ?, ?)',
        [name, email, phone, address, message]
      )
      return { id: result.insertId, ...contactData }
    } catch (error) {
      console.error('Error in ContactModel.create:', error)
      throw error
    }
  }

  static async findAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM contacts ORDER BY createdAt DESC'
      )
      return rows
    } catch (error) {
      console.error('Error in ContactModel.findAll:', error)
      throw error
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM contacts WHERE id = ?',
        [id]
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error in ContactModel.findById:', error)
      throw error
    }
  }

  static async updateStatus(id, status) {
    try {
      const [result] = await pool.execute(
        'UPDATE contacts SET status = ? WHERE id = ?',
        [status, id]
      )
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error in ContactModel.updateStatus:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM contacts WHERE id = ?',
        [id]
      )
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error in ContactModel.delete:', error)
      throw error
    }
  }
}

export default ContactModel
