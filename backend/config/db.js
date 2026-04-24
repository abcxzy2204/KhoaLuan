import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '2204',
  database: process.env.DB_NAME || 'quan_ao_tre_em',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database')
    connection.release()
  })
  .catch(error => {
    console.error('❌ Error connecting to MySQL:', error.message)
    console.log('⚠️  Make sure MySQL is running and database exists')
  })

export default pool

