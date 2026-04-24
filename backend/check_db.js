import pool from './config/db.js'

async function check() {
  try {
    const [rows] = await pool.execute('DESCRIBE orders')
    console.log('Columns in orders:')
    rows.forEach(row => console.log(`- ${row.Field}`))
    
    const [rows2] = await pool.execute('DESCRIBE coupons')
    console.log('Columns in coupons:')
    rows2.forEach(row => console.log(`- ${row.Field}`))
    
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

check()
