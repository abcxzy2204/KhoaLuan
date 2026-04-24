// In-memory reviews database
// Trong production, thay thế bằng MongoDB, MySQL, PostgreSQL, etc.

let reviews = [
  // Sample reviews - có thể xóa hoặc giữ để test
  {
    id: 1,
    productId: 1,
    userId: 1,
    userName: 'Admin',
    rating: 5,
    comment: 'Sản phẩm rất đẹp, chất lượng tốt!',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    productId: 1,
    userId: 1,
    userName: 'Admin',
    rating: 4,
    comment: 'Tốt nhưng giá hơi cao',
    createdAt: new Date().toISOString()
  }
]

export default reviews

