# Backend API - Shop Quần Áo Trẻ Em

Backend được xây dựng với kiến trúc MVC (Model-View-Controller) chuyên nghiệp.

## Cấu Trúc Thư Mục

```
backend/
├── config/
│   └── database.js          # Database configuration & sample data
├── controllers/
│   └── productController.js # Business logic cho products
├── models/
│   └── ProductModel.js      # Data access layer
├── routes/
│   └── productRoutes.js     # API routes definition
├── middleware/
│   ├── errorHandler.js      # Error handling middleware
│   └── logger.js            # Request logging
├── utils/
│   └── validators.js        # Validation utilities
└── server.js                # Entry point
```

## Kiến Trúc MVC

### Models (`models/`)
- Chịu trách nhiệm truy cập và thao tác dữ liệu
- Tách biệt logic database khỏi business logic
- Dễ dàng thay thế bằng database thật (MongoDB, MySQL, PostgreSQL)

### Controllers (`controllers/`)
- Xử lý HTTP requests và responses
- Chứa business logic
- Gọi Models để lấy/cập nhật dữ liệu
- Trả về response chuẩn với format `{ success, data, message }`

### Routes (`routes/`)
- Định nghĩa các endpoint API
- Map URL patterns với Controllers
- Có thể thêm middleware (auth, validation) tại đây

### Middleware (`middleware/`)
- **errorHandler**: Xử lý lỗi tập trung
- **logger**: Log tất cả requests
- Có thể thêm: authentication, rate limiting, validation

### Utils (`utils/`)
- Các hàm tiện ích tái sử dụng
- Validation functions
- Helper functions

## API Response Format

Tất cả API responses đều tuân theo format chuẩn:

```json
{
  "success": true,
  "data": [...],
  "message": "Optional message",
  "count": 12
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Validation errors"]
}
```

## Lợi Ích Của Cấu Trúc Này

1. **Separation of Concerns**: Mỗi layer có trách nhiệm riêng
2. **Maintainability**: Dễ bảo trì và mở rộng
3. **Testability**: Dễ viết unit tests cho từng layer
4. **Scalability**: Dễ thêm features mới
5. **Team Collaboration**: Nhiều người có thể làm việc song song

## Mở Rộng Trong Tương Lai

- Thêm authentication middleware
- Tích hợp database thật (MongoDB/MySQL/PostgreSQL)
- Thêm caching layer (Redis)
- API rate limiting
- Request validation middleware
- File upload handling
- Email service integration

