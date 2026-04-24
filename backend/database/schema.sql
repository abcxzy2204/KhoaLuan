-- Script tạo database và tables cho MySQL
-- Chạy script này trong MySQL: mysql -u root -p < backend/database/schema.sql
-- Hoặc copy và paste vào MySQL Workbench
 
-- Tạo database
CREATE DATABASE IF NOT EXISTS quan_ao_tre_em CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE quan_ao_tre_em;

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  phone VARCHAR(20),
  dob DATE,
  gender ENUM('Nam', 'Nữ'),
  avatar LONGTEXT,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  originalPrice DECIMAL(10, 2) NULL,
  image TEXT,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  sizes JSON,
  colors JSON,
  stock INT DEFAULT 0,
  sale INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng reviews
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  userId INT NOT NULL,
  userName VARCHAR(255) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (userId, productId),
  INDEX idx_productId (productId),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  customerName VARCHAR(255) NOT NULL,
  customerPhone VARCHAR(20) NOT NULL,
  customerAddress VARCHAR(500) NOT NULL,
  totalAmount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
  paymentMethod ENUM('cod', 'online') DEFAULT 'cod',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId_orders (userId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng order_items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  productId INT NOT NULL,
  productName VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  selectedSize VARCHAR(50) NULL,
  selectedColor VARCHAR(50) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_orderId (orderId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng contacts
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(500),
  message TEXT NOT NULL,
  status ENUM('pending', 'read', 'replied') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng password_resets
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expiresAt DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_used (email, used),
  INDEX idx_expires (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
-- Users (password: admin123 - đã hash)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', '$2a$10$iayW/LTnuFLaY/JumrDfbuR.S0cPkGBMNG7NvjBpYOI2wJfcJQY96', 'admin')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role);

-- Products
INSERT INTO products (id, name, price, originalPrice, image, category, description, sizes, colors, stock, sale) VALUES
(1, 'Bộ Thun Cotton Bé Trai (Áo + Quần)', 189000, 229000, '/images/products/1.webp', 'Áo', 'Bộ đồ cotton mềm mịn, thấm hút tốt, phù hợp mặc nhà và đi chơi. Chất liệu an toàn cho da bé.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 60, 17),
(2, 'Váy Xòe Công Chúa Bé Gái', 259000, 319000, '/images/products/2.webp', 'Đầm', 'Váy xòe nhẹ, thiết kế đáng yêu, phù hợp dự tiệc/sinh nhật. Đường may êm, không gây ngứa.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 35, 19),
(3, 'Áo Thun In Hình Khủng Long', 129000, 159000, '/images/products/3.webp', 'Áo', 'Áo thun cổ tròn thoáng mát, form dễ vận động, họa tiết dễ thương cho bé.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 80, 19),
(4, 'Quần Short Jean Mềm Cho Bé', 149000, 189000, '/images/products/4.webp', 'Quần', 'Chất jean mềm, co giãn nhẹ, cạp chun dễ mặc. Phù hợp mùa hè năng động.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 55, 21),
(5, 'Áo Khoác Gió Chống Nắng', 219000, 279000, '/images/products/5.webp', 'Áo', 'Áo khoác gió mỏng nhẹ, che nắng tốt, dễ gấp gọn mang theo. Khóa kéo mượt.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 40, 22),
(6, 'Quần Legging Cotton Bé Gái', 99000, 129000, '/images/products/6.webp', 'Quần', 'Legging cotton co giãn tốt, mềm mại, phù hợp đi học/đi chơi. Không xù lông.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 70, 23),
(7, 'Pijama Dài Tay Cho Bé', 199000, 249000, '/images/products/7.webp', 'Áo', 'Bộ pijama dài tay ấm áp, chất liệu cotton thoáng khí, phù hợp mùa lạnh và phòng máy lạnh.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 50, 20),
(8, 'Đầm Hoa Mùa Hè Mát Mẻ', 229000, 289000, '/images/products/8.webp', 'Đầm', 'Đầm hoa nhẹ nhàng, thoáng mát, dễ phối phụ kiện. Phù hợp dạo phố/du lịch.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 38, 21),
(9, 'Áo Polo Bé Trai Cổ Bẻ', 169000, 199000, '/images/products/9.webp', 'Áo', 'Áo polo lịch sự, dễ phối quần short/jean. Vải thấm hút, không bí nóng.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 65, 15),
(10, 'Quần Jogger Nỉ Mỏng', 179000, 219000, '/images/products/10.webp', 'Quần', 'Jogger nỉ mỏng êm, cạp chun thoải mái, phù hợp vận động và đi học.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 45, 18),
(11, 'Áo Sơ Mi Trắng Bé Trai', 189000, 239000, '/images/products/11.webp', 'Áo', 'Sơ mi chất liệu mềm, ít nhăn, phù hợp dịp lễ/tốt nghiệp/mặc cùng quần tây.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 30, 21),
(12, 'Áo Len Mỏng Mùa Thu', 159000, 199000, '/images/products/12.webp', 'Áo', 'Áo len mỏng ấm vừa, mềm không ngứa, phù hợp thời tiết se lạnh.', JSON_ARRAY('1-2T', '3-4T', '5-6T'), JSON_ARRAY('Đen', 'Trắng', 'Đỏ'), 42, 20)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  originalPrice = VALUES(originalPrice),
  image = VALUES(image),
  category = VALUES(category),
  description = VALUES(description),
  sizes = VALUES(sizes),
  stock = VALUES(stock),
  sale = VALUES(sale);

-- Hiển thị thông báo thành công
SELECT 'Database quan_ao_tre_em đã được tạo thành công!' AS message;
SELECT 'Tables: users, products, reviews, orders, order_items, contacts' AS tables;
SELECT COUNT(*) AS total_products FROM products;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_reviews FROM reviews;
SELECT COUNT(*) AS total_orders FROM orders;
SELECT COUNT(*) AS total_contacts FROM contacts;

