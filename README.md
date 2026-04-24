# Website Bán Quần Áo Trẻ Em

Website bán quần áo trẻ em được xây dựng với ReactJS (Frontend) và Node.js/Express (Backend).

## Công Nghệ Sử Dụng

### Frontend
- ReactJS 18
- React Router DOM
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- CORS
- JWT (JSON Web Tokens) - Authentication
- bcryptjs - Password hashing
- MySQL2 - Database connection
- dotenv - Environment variables

## Cài Đặt

### 1. Cài đặt Frontend

```bash
npm install
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

### 3. Cài đặt và Cấu hình MySQL

#### Bước 1: Cài đặt MySQL
- **Windows**: Tải từ https://dev.mysql.com/downloads/installer/
- **macOS**: `brew install mysql && brew services start mysql`
- **Linux**: `sudo apt install mysql-server`

#### Bước 2: Tạo Database
1. Đăng nhập MySQL:
```bash
mysql -u root -p
```

2. Chạy file schema:
```sql
source backend/database/schema.sql
```

Hoặc mở file `backend/database/schema.sql` trong MySQL Workbench và chạy.

#### Bước 3: Cấu hình .env
1. Copy file `env.example`:
```bash
cd backend
cp env.example .env
```

2. Chỉnh sửa file `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=quan_ao_tre_em
```

## Chạy Ứng Dụng

### Chạy Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Backend sẽ chạy tại: http://localhost:5000

### Chạy Frontend (Terminal 2)

```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## Tính Năng

- ✅ Trang chủ với sản phẩm nổi bật
- ✅ Danh sách sản phẩm với tìm kiếm và lọc theo danh mục
- ✅ Chi tiết sản phẩm
- ✅ Giỏ hàng với thêm/xóa/cập nhật số lượng
- ✅ **Đăng nhập / Đăng ký** với JWT authentication
- ✅ Quản lý phiên đăng nhập (persistent login)
- ✅ Protected routes
- ✅ **Đánh giá sản phẩm** với số sao (1-5 sao)
- ✅ Hiển thị average rating và số lượng đánh giá
- ✅ Phân phối rating (rating distribution)
- ✅ Chỉ user đã đăng nhập mới có thể đánh giá
- ✅ User có thể xóa đánh giá của mình
- ✅ Responsive design (mobile-friendly)
- ✅ API RESTful cho quản lý sản phẩm, authentication và reviews

## Cấu Trúc Dự Án

```
KLTN/
├── src/                    # Frontend React
│   ├── components/         # Các component React
│   ├── pages/              # Các trang
│   ├── context/            # Context API (Cart)
│   └── App.jsx             # Component chính
├── backend/                # Backend Node.js/Express
│   ├── config/             # Cấu hình (database, env)
│   ├── controllers/        # Xử lý logic business
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── middleware/         # Middleware (error, logger)
│   ├── utils/              # Utilities (validators)
│   └── server.js           # Entry point
├── package.json
└── vite.config.js
```

### Kiến Trúc Backend (MVC Pattern)

- **Models**: Quản lý dữ liệu và logic truy cập database
- **Controllers**: Xử lý request/response và business logic
- **Routes**: Định nghĩa các endpoint API
- **Middleware**: Xử lý lỗi, logging, authentication
- **Utils**: Các hàm tiện ích (validation, helpers)

## API Endpoints

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại (cần token)

### Reviews
- `GET /api/products/:productId/reviews` - Lấy danh sách đánh giá của sản phẩm
- `POST /api/products/:productId/reviews` - Tạo đánh giá mới (cần token)
- `PUT /api/reviews/:id` - Cập nhật đánh giá (cần token, chỉ chủ sở hữu)
- `DELETE /api/reviews/:id` - Xóa đánh giá (cần token, chỉ chủ sở hữu)

### System
- `GET /api/health` - Kiểm tra trạng thái server

## Ghi Chú

- ✅ **Database**: Dữ liệu được lưu trong MySQL database (persistent)
- Giỏ hàng được lưu trong localStorage của browser
- JWT token được lưu trong localStorage, tự động gửi kèm mỗi request
- Mật khẩu được hash bằng bcryptjs trước khi lưu
- Mỗi user chỉ có thể đánh giá 1 lần cho mỗi sản phẩm
- Rating từ 1-5 sao, có thể kèm comment

## Database Schema

Database bao gồm các bảng:
- **users**: Thông tin người dùng
- **products**: Thông tin sản phẩm
- **reviews**: Đánh giá sản phẩm
- **orders**: Đơn hàng
- **order_items**: Chi tiết đơn hàng
- **contacts**: Tin nhắn liên hệ

Xem chi tiết trong file `backend/database/schema.sql`

## Troubleshooting MySQL

### Lỗi kết nối
- Kiểm tra MySQL service đang chạy
- Kiểm tra thông tin trong file `.env`
- Kiểm tra database `quan_ao_tre_em` đã được tạo
- Kiểm tra user có quyền truy cập database

### Xem hướng dẫn chi tiết
Xem file `backend/database/README.md` để biết thêm chi tiết về setup MySQL.

## Sử Dụng Authentication

1. **Đăng ký tài khoản mới**: Truy cập `/register` và điền thông tin
2. **Đăng nhập**: Truy cập `/login` với email và password đã đăng ký
3. **Token tự động lưu**: Sau khi đăng nhập, token được lưu và tự động gửi kèm các request
4. **Đăng xuất**: Click "Đăng Xuất" trong header để xóa token

## Sử Dụng Đánh Giá Sản Phẩm

1. **Xem đánh giá**: Vào trang chi tiết sản phẩm, scroll xuống phần "Đánh Giá Sản Phẩm"
2. **Đánh giá sản phẩm**: 
   - Phải đăng nhập trước
   - Chọn số sao (1-5)
   - Có thể thêm nhận xét (tùy chọn)
   - Click "Gửi đánh giá"
3. **Xóa đánh giá**: Chỉ có thể xóa đánh giá của chính mình
4. **Xem rating**: 
   - Average rating hiển thị trên ProductCard và ProductDetail
   - Rating distribution hiển thị trong trang chi tiết sản phẩm

