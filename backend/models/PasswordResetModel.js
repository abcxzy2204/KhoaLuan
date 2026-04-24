import pool from '../config/db.js'

class PasswordResetModel {
  static async initTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expiresAt DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_used (email, used),
        INDEX idx_expires (expiresAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  }

  static async createCode(email, code, expiresAt) {
    await this.initTable()
    await pool.execute('UPDATE password_resets SET used = 1 WHERE email = ? AND used = 0', [email])
    await pool.execute(
      'INSERT INTO password_resets (email, code, expiresAt, used) VALUES (?, ?, ?, 0)',
      [email, code, expiresAt]
    )
  }

  static async findValidCode(email, code) {
    await this.initTable()
    const [rows] = await pool.execute(
      `SELECT * FROM password_resets
       WHERE email = ? AND code = ? AND used = 0 AND expiresAt > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email, code]
    )
    return rows.length > 0 ? rows[0] : null
  }

  static async markUsed(id) {
    await pool.execute('UPDATE password_resets SET used = 1 WHERE id = ?', [id])
  }
}

export default PasswordResetModel
