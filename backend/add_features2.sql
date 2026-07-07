-- ============================================================
-- LIZSHOOS - Feature Pack 2: Reviews + Wishlist + Images
-- Chạy file này trong SQL Server Management Studio
-- ============================================================

-- Feature 6: Bảng đánh giá sản phẩm
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reviews' AND xtype='U')
CREATE TABLE reviews (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     NVARCHAR(1000),
  created_at  DATETIME DEFAULT GETDATE()
);

-- Mỗi user chỉ review 1 lần mỗi sản phẩm
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='UQ_reviews_user_product')
  ALTER TABLE reviews ADD CONSTRAINT UQ_reviews_user_product UNIQUE (product_id, user_id);

-- Feature 7: Bảng wishlist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='wishlist' AND xtype='U')
CREATE TABLE wishlist (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE NO ACTION,
  created_at  DATETIME DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='UQ_wishlist_user_product')
  ALTER TABLE wishlist ADD CONSTRAINT UQ_wishlist_user_product UNIQUE (user_id, product_id);

-- Feature 10: Thêm cột images (JSON array URLs) cho products
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'images')
  ALTER TABLE products ADD images NVARCHAR(MAX);

PRINT 'add_features2.sql thực thi thành công!';
