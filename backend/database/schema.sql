-- SQL Server (T-SQL)
-- Khuyến nghị chạy bằng SQL Server Management Studio (SSMS)

IF DB_ID('shoe_shop') IS NULL
BEGIN
  CREATE DATABASE shoe_shop;
END
GO

USE shoe_shop;
GO

-- USERS
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    phone NVARCHAR(20) NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL CONSTRAINT DF_users_role DEFAULT ('user'),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_users_role CHECK (role IN ('admin', 'manager', 'user'))
  );
END
GO

-- Thêm cột role nếu bảng đã tồn tại trước đó
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='role')
  ALTER TABLE dbo.users ADD role NVARCHAR(20) NOT NULL CONSTRAINT DF_users_role DEFAULT ('user');
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name='CK_users_role')
  ALTER TABLE dbo.users ADD CONSTRAINT CK_users_role CHECK (role IN ('admin', 'manager', 'user'));
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='phone')
  ALTER TABLE dbo.users ADD phone NVARCHAR(20) NULL;
GO

-- PRODUCTS
IF OBJECT_ID('dbo.products', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    brand NVARCHAR(100) NULL,
    sku NVARCHAR(100) NULL,
    category NVARCHAR(100) NULL,
    price DECIMAL(12,0) NOT NULL,
    sizes NVARCHAR(MAX) NULL,   -- JSON string
    image NVARCHAR(MAX) NULL,
    info NVARCHAR(MAX) NULL,    -- JSON string
    details NVARCHAR(MAX) NULL, -- JSON string
    created_at DATETIME2 NOT NULL CONSTRAINT DF_products_created_at DEFAULT (SYSUTCDATETIME())
  );
END
GO

-- ORDERS
IF OBJECT_ID('dbo.orders', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_name NVARCHAR(255) NOT NULL,
    customer_phone NVARCHAR(20) NOT NULL,
    customer_address NVARCHAR(MAX) NOT NULL,
    payment_method NVARCHAR(20) NOT NULL, -- 'bank' | 'momo'
    total_amount DECIMAL(12,0) NOT NULL,
    status NVARCHAR(20) NOT NULL CONSTRAINT DF_orders_status DEFAULT ('pending'),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_orders_created_at DEFAULT (SYSUTCDATETIME())
  );
END
GO

-- ORDER_ITEMS
IF OBJECT_ID('dbo.order_items', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NULL,
    product_name NVARCHAR(255) NULL,
    price DECIMAL(12,0) NULL,
    quantity INT NOT NULL,
    size INT NULL,
    CONSTRAINT FK_order_items_orders FOREIGN KEY (order_id)
      REFERENCES dbo.orders(id)
      ON DELETE CASCADE
  );
END
GO

-- CART_ITEMS
IF OBJECT_ID('dbo.cart_items', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.cart_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    size INT NOT NULL,
    quantity INT NOT NULL CONSTRAINT DF_cart_items_quantity DEFAULT (1),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_cart_items_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_cart_items_users FOREIGN KEY (user_id)
      REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT FK_cart_items_products FOREIGN KEY (product_id)
      REFERENCES dbo.products(id) ON DELETE CASCADE,
    CONSTRAINT UQ_cart_user_product_size UNIQUE (user_id, product_id, size)
  );
END
GO

-- REVIEWS
IF OBJECT_ID('dbo.reviews', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_reviews_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT FK_reviews_users FOREIGN KEY (user_id)
      REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT FK_reviews_products FOREIGN KEY (product_id)
      REFERENCES dbo.products(id) ON DELETE CASCADE,
    CONSTRAINT UQ_reviews_user_product UNIQUE (user_id, product_id)
  );
END
GO

-- ADDRESSES
IF OBJECT_ID('dbo.addresses', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.addresses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    address NVARCHAR(MAX) NOT NULL,
    is_default BIT NOT NULL CONSTRAINT DF_addresses_is_default DEFAULT (0),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_addresses_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_addresses_users FOREIGN KEY (user_id)
      REFERENCES dbo.users(id) ON DELETE CASCADE
  );
END
GO

-- NOTIFICATIONS
IF OBJECT_ID('dbo.notifications', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT NULL,
    message NVARCHAR(MAX) NOT NULL,
    is_read BIT NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT (0),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_notifications_users FOREIGN KEY (user_id)
      REFERENCES dbo.users(id) ON DELETE CASCADE
  );
END
GO

-- Add user_id to orders if missing
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='user_id')
  ALTER TABLE dbo.orders ADD user_id INT NULL;
GO

-- Add payment_status to orders
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='payment_status')
  ALTER TABLE dbo.orders ADD payment_status NVARCHAR(20) NOT NULL CONSTRAINT DF_orders_payment_status DEFAULT ('unpaid');
GO

-- Add stock to products
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='stock')
  ALTER TABLE dbo.products ADD stock INT NOT NULL CONSTRAINT DF_products_stock DEFAULT (100);
GO

-- Add colors to products (JSON string: [{"name":"Đen","hex":"#000000"}, ...])
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='colors')
  ALTER TABLE dbo.products ADD colors NVARCHAR(MAX) NULL;
GO

-- Add color to cart_items / order_items
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='cart_items' AND COLUMN_NAME='color')
  ALTER TABLE dbo.cart_items ADD color NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='order_items' AND COLUMN_NAME='color')
  ALTER TABLE dbo.order_items ADD color NVARCHAR(50) NULL;
GO

-- SEED PRODUCTS
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP000101')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Nike Air Force 1', N'Nike', N'SP000101', N'giay-dep', 2500000,
   N'[38,39,40,41,42,43]',
   N'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Nike","Xuất xứ: Mỹ","Phân loại: Giày thể thao nam","Mã sản phẩm: CW2288-111","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp, dây giày dự phòng"]',
   N'["Chất liệu: Da tổng hợp cao cấp","Màu sắc: White / White","Đế giày: Cao su nguyên chất","Phù hợp: Đi học, đi chơi, thể thao nhẹ"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP000202')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Adidas Stan Smith', N'Adidas', N'SP000202', N'giay-dep', 2800000,
   N'[39,40,41,42,43,44]',
   N'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Adidas","Xuất xứ: Đức","Phân loại: Giày thể thao unisex","Mã sản phẩm: FX5502","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp, dây giày dự phòng"]',
   N'["Chất liệu: Da thật","Màu sắc: Cloud White / Green","Đế giày: Cao su","Phù hợp: Casual, streetwear"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP000303')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Converse Chuck 70', N'Converse', N'SP000303', N'giay-dep', 1800000,
   N'[36,37,38,39,40,41]',
   N'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Converse","Xuất xứ: Mỹ","Phân loại: Giày canvas unisex","Mã sản phẩm: 162058C","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp, dây giày dự phòng"]',
   N'["Chất liệu: Canvas cao cấp","Màu sắc: White / Black","Đế giày: Cao su lưu hóa","Phù hợp: Đi học, đi chơi, dã ngoại"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP000404')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'New Balance 574', N'New Balance', N'SP000404', N'giay-dep', 3200000,
   N'[39,40,41,42,43]',
   N'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: New Balance","Xuất xứ: Mỹ","Phân loại: Giày chạy bộ","Mã sản phẩm: ML574EVG","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp"]',
   N'["Chất liệu: Mesh + Da tổng hợp","Màu sắc: Grey / White","Đế giày: ENCAP midsole","Phù hợp: Chạy bộ, gym, casual"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP000505')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Jordan 1 Retro High', N'Jordan', N'SP000505', N'giay-dep', 4500000,
   N'[40,41,42,43,44,45]',
   N'https://images.unsplash.com/photo-1608231387042-66d1773d3028?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Jordan (Nike)","Xuất xứ: Mỹ","Phân loại: Giày bóng rổ / Lifestyle nam","Mã sản phẩm: 555088-134","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp, túi giày"]',
   N'["Chất liệu: Da thật cao cấp","Màu sắc: University Blue / White","Đế giày: Air-Sole unit","Phù hợp: Streetwear, sưu tầm"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP000606')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Vans Old Skool', N'Vans', N'SP000606', N'giay-dep', 1600000,
   N'[36,37,38,39,40]',
   N'https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Vans","Xuất xứ: Mỹ","Phân loại: Giày skate unisex","Mã sản phẩm: VN000D3HY28","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp"]',
   N'["Chất liệu: Canvas + Da tổng hợp","Màu sắc: Black / White","Đế giày: Waffle outsole","Phù hợp: Skate, casual, streetwear"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP000707')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Puma RS-X', N'Puma', N'SP000707', N'giay-dep', 2100000,
   N'[39,40,41,42,43]',
   N'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Puma","Xuất xứ: Đức","Phân loại: Giày thể thao unisex","Mã sản phẩm: 369579-07","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp"]',
   N'["Chất liệu: Mesh + synthetic","Màu sắc: White / Multi","Đế giày: RS (Running System)","Phù hợp: Retro, casual, streetwear"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP000909')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Nike Air Max 97 Premium', N'Nike', N'SP000909', N'giay-dep', 5200000,
   N'[38,39,40,41,42,43,44]',
   N'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Nike","Xuất xứ: Mỹ","Phân loại: Giày lifestyle premium","Mã sản phẩm: DH4087-100","Tình trạng: New (Fullbox)","Phụ kiện: Hộp, dây dự phòng"]',
   N'["Chất liệu: Da thật + Mesh cao cấp","Màu sắc: White / Silver","Đế giày: Air Max full-length","Đặc điểm: Đệm khí toàn đế","Phù hợp: Lifestyle, streetwear cao cấp"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP001010')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Jordan 4 Retro Bred', N'Jordan', N'SP001010', N'giay-dep', 6800000,
   N'[40,41,42,43,44,45]',
   N'https://images.unsplash.com/photo-1608231387042-66d1773d3028?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Jordan (Nike)","Xuất xứ: Mỹ","Phân loại: Giày bóng rổ / Collector","Mã sản phẩm: 308497-060","Tình trạng: New (Fullbox)","Phụ kiện: Hộp cao cấp, túi giày, thẻ xác thực"]',
   N'["Chất liệu: Da thật Nubuck","Màu sắc: Black / Cement Grey / Fire Red","Đế giày: Air-Sole unit","Đặc điểm: Lưỡi gà WINGS, đai hỗ trợ mắt cá","Phù hợp: Sưu tầm, streetwear đỉnh cao"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP001111')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Adidas Yeezy Boost 350 V2', N'Adidas', N'SP001111', N'giay-dep', 7500000,
   N'[39,40,41,42,43,44]',
   N'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Adidas × Kanye West","Xuất xứ: Đức","Phân loại: Giày lifestyle limited","Mã sản phẩm: FZ5000","Tình trạng: New (Fullbox)","Phụ kiện: Hộp Yeezy, giấy chứng nhận"]',
   N'["Chất liệu: Primeknit toàn phần","Màu sắc: Ash Pearl","Đế giày: Boost full-length","Đặc điểm: Đệm Boost siêu êm, vạch phản quang","Phù hợp: Hypebeast, sưu tầm, casual"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP001212')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Balenciaga Triple S', N'Balenciaga', N'SP001212', N'giay-dep', 9500000,
   N'[39,40,41,42,43]',
   N'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Balenciaga","Xuất xứ: Pháp / Ý","Phân loại: Giày luxury designer","Mã sản phẩm: 541624W09E11221","Tình trạng: New (Fullbox)","Phụ kiện: Hộp Balenciaga, túi vải, thẻ xác thực"]',
   N'["Chất liệu: Mesh + Da thật + Da tổng hợp","Màu sắc: Triple Black","Đế giày: Triple sole cao 6cm","Đặc điểm: Thiết kế chunky iconic","Phù hợp: High fashion, luxury streetwear"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP001313')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Nike SB Dunk High Pro', N'Nike', N'SP001313', N'giay-dep', 5600000,
   N'[40,41,42,43,44]',
   N'https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Nike SB","Xuất xứ: Mỹ","Phân loại: Giày skateboard premium","Mã sản phẩm: DD1399-100","Tình trạng: New (Fullbox)","Phụ kiện: Hộp SB, dây giày dự phòng"]',
   N'["Chất liệu: Da thật + Suede cao cấp","Màu sắc: Baroque Brown / Sail","Đế giày: Zoom Air + Rubber","Đặc điểm: Lót Zoom Air êm ái, cổ cao bảo vệ mắt cá","Phù hợp: Skate, streetwear, casual cao cấp"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE sku = 'SP000808')
  INSERT INTO dbo.products (name, brand, sku, category, price, sizes, image, info, details) VALUES
  (N'Reebok Classic', N'Reebok', N'SP000808', N'giay-dep', 1900000,
   N'[37,38,39,40,41,42]',
   N'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop&q=80',
   N'["Thương hiệu: Reebok","Xuất xứ: Mỹ","Phân loại: Giày thể thao nữ","Mã sản phẩm: FV7260","Tình trạng sản phẩm: New (Fullbox)","Phụ kiện đi kèm: Hộp"]',
   N'["Chất liệu: Leather + Canvas","Màu sắc: White / Light Grey","Đế giày: EVA midsole","Phù hợp: Gym, casual, vintage"]');
GO

-- PASSWORD RESET TOKENS
IF OBJECT_ID('dbo.password_reset_tokens', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.password_reset_tokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token NVARCHAR(10) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    used BIT NOT NULL CONSTRAINT DF_password_reset_tokens_used DEFAULT (0),
    CONSTRAINT FK_password_reset_tokens_users FOREIGN KEY (user_id)
      REFERENCES dbo.users(id) ON DELETE CASCADE
  );
END
GO

-- COUPONS
IF OBJECT_ID('dbo.coupons', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.coupons (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    discount_type NVARCHAR(20) NOT NULL CONSTRAINT DF_coupons_discount_type DEFAULT ('percent'),
    discount_value DECIMAL(12,0) NOT NULL,
    min_order DECIMAL(12,0) NOT NULL CONSTRAINT DF_coupons_min_order DEFAULT (0),
    max_uses INT NULL,
    used_count INT NOT NULL CONSTRAINT DF_coupons_used_count DEFAULT (0),
    expires_at DATETIME2 NULL,
    is_active BIT NOT NULL CONSTRAINT DF_coupons_is_active DEFAULT (1),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_coupons_created_at DEFAULT (SYSUTCDATETIME())
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.coupons WHERE code = 'LIZSHOOS10')
  INSERT INTO dbo.coupons (code, discount_type, discount_value, min_order)
  VALUES ('LIZSHOOS10', 'percent', 10, 500000);
IF NOT EXISTS (SELECT 1 FROM dbo.coupons WHERE code = 'FREESHIP')
  INSERT INTO dbo.coupons (code, discount_type, discount_value, min_order)
  VALUES ('FREESHIP', 'fixed', 30000, 200000);
IF NOT EXISTS (SELECT 1 FROM dbo.coupons WHERE code = 'SALE50K')
  INSERT INTO dbo.coupons (code, discount_type, discount_value, min_order)
  VALUES ('SALE50K', 'fixed', 50000, 1000000);
GO

