-- Tạo database (chạy với quyền sa)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'shoe_shop')
  CREATE DATABASE shoe_shop;
GO

USE shoe_shop;
GO

-- Bảng người dùng
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  full_name    NVARCHAR(255) NOT NULL,
  email        NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  role         NVARCHAR(50)  NOT NULL DEFAULT 'user',
  created_at   DATETIME2     DEFAULT GETDATE()
);
GO

-- Bảng sản phẩm
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'products')
CREATE TABLE products (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  name       NVARCHAR(255) NOT NULL,
  brand      NVARCHAR(100),
  sku        NVARCHAR(100),
  category   NVARCHAR(100),
  price      DECIMAL(12,0) NOT NULL,
  sizes      NVARCHAR(MAX),
  image      NVARCHAR(MAX),
  info       NVARCHAR(MAX),
  details    NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Bảng đơn hàng
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
CREATE TABLE orders (
  id                INT IDENTITY(1,1) PRIMARY KEY,
  customer_name     NVARCHAR(255) NOT NULL,
  customer_phone    NVARCHAR(20)  NOT NULL,
  customer_address  NVARCHAR(MAX) NOT NULL,
  payment_method    NVARCHAR(50)  NOT NULL,
  total_amount      DECIMAL(12,0) NOT NULL,
  user_id           INT,
  status            NVARCHAR(50)  NOT NULL DEFAULT 'pending',
  created_at        DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
GO

-- Bảng chi tiết đơn hàng
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'order_items')
CREATE TABLE order_items (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  order_id     INT NOT NULL,
  product_id   INT,
  product_name NVARCHAR(255),
  price        DECIMAL(12,0),
  quantity     INT NOT NULL,
  size         INT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
GO

-- Nhập dữ liệu sản phẩm (chỉ chạy khi bảng trống)
IF NOT EXISTS (SELECT TOP 1 1 FROM products)
BEGIN
  INSERT INTO products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Nike Air Force 1', N'Nike', N'SP000101', N'giay-dep', 2500000,
   N'[38,39,40,41,42,43]',
   N'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Nike","Xuất xứ: Mỹ","Phân loại: Giày thể thao nam","Mã sản phẩm: CW2288-111","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp, dây giày dự phòng"]',
   N'["Chất liệu: Da tổng hợp cao cấp","Màu sắc: White / White","Đế giày: Cao su nguyên chất","Phù hợp: Đi học, đi chơi, thể thao nhẹ"]'),
  (N'Adidas Stan Smith', N'Adidas', N'SP000202', N'giay-dep', 2800000,
   N'[39,40,41,42,43,44]',
   N'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Adidas","Xuất xứ: Đức","Phân loại: Giày thể thao unisex","Mã sản phẩm: FX5502","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp, dây giày dự phòng"]',
   N'["Chất liệu: Da thật","Màu sắc: Cloud White / Green","Đế giày: Cao su","Phù hợp: Casual, streetwear"]'),
  (N'Converse Chuck 70', N'Converse', N'SP000303', N'giay-dep', 1800000,
   N'[36,37,38,39,40,41]',
   N'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Converse","Xuất xứ: Mỹ","Phân loại: Giày canvas unisex","Mã sản phẩm: 162058C","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp, dây giày dự phòng"]',
   N'["Chất liệu: Canvas cao cấp","Màu sắc: White / Black","Đế giày: Cao su lưu hóa","Phù hợp: Đi học, đi chơi, dã ngoại"]'),
  (N'New Balance 574', N'New Balance', N'SP000404', N'giay-dep', 3200000,
   N'[39,40,41,42,43]',
   N'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: New Balance","Xuất xứ: Mỹ","Phân loại: Giày chạy bộ","Mã sản phẩm: ML574EVG","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp"]',
   N'["Chất liệu: Mesh + Da tổng hợp","Màu sắc: Grey / White","Đế giày: ENCAP midsole","Phù hợp: Chạy bộ, gym, casual"]'),
  (N'Jordan 1 Retro High', N'Jordan', N'SP000505', N'giay-dep', 4500000,
   N'[40,41,42,43,44,45]',
   N'https://images.unsplash.com/photo-1608231387042-66d1773d3028?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Jordan (Nike)","Xuất xứ: Mỹ","Phân loại: Giày bóng rổ / Lifestyle nam","Mã sản phẩm: 555088-134","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp, túi giày"]',
   N'["Chất liệu: Da thật cao cấp","Màu sắc: University Blue / White","Đế giày: Air-Sole unit","Phù hợp: Streetwear, sưu tầm"]'),
  (N'Vans Old Skool', N'Vans', N'SP000606', N'giay-dep', 1600000,
   N'[36,37,38,39,40]',
   N'https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Vans","Xuất xứ: Mỹ","Phân loại: Giày skate unisex","Mã sản phẩm: VN000D3HY28","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp"]',
   N'["Chất liệu: Canvas + Da tổng hợp","Màu sắc: Black / White","Đế giày: Waffle outsole","Phù hợp: Skate, casual, streetwear"]'),
  (N'Puma RS-X', N'Puma', N'SP000707', N'giay-dep', 2100000,
   N'[39,40,41,42,43]',
   N'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Puma","Xuất xứ: Đức","Phân loại: Giày thể thao unisex","Mã sản phẩm: 369579-07","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp"]',
   N'["Chất liệu: Mesh + synthetic","Màu sắc: White / Multi","Đế giày: RS (Running System)","Phù hợp: Retro, casual, streetwear"]'),
  (N'Reebok Classic', N'Reebok', N'SP000808', N'giay-dep', 1900000,
   N'[37,38,39,40,41,42]',
   N'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Reebok","Xuất xứ: Mỹ","Phân loại: Giày thể thao nữ","Mã sản phẩm: FV7260","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp"]',
   N'["Chất liệu: Leather + Canvas","Màu sắc: White / Light Grey","Đế giày: EVA midsole","Phù hợp: Gym, casual, vintage"]');
ENDs
GO
