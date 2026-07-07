USE shoe_shop;
GO

-- Bảng OTP đặt lại mật khẩu
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_reset_tokens')
CREATE TABLE password_reset_tokens (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  user_id    INT NOT NULL,
  token      NVARCHAR(10) NOT NULL,
  expires_at DATETIME2 NOT NULL,
  used       BIT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- Bảng mã giảm giá
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'coupons')
CREATE TABLE coupons (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  code           NVARCHAR(50) NOT NULL UNIQUE,
  discount_type  NVARCHAR(20) NOT NULL DEFAULT 'percent', -- 'percent' hoặc 'fixed'
  discount_value DECIMAL(12,0) NOT NULL,
  min_order      DECIMAL(12,0) DEFAULT 0,
  max_uses       INT DEFAULT NULL,
  used_count     INT DEFAULT 0,
  expires_at     DATETIME2 DEFAULT NULL,
  is_active      BIT DEFAULT 1,
  created_at     DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm coupon mẫu
IF NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'LIZSHOOS10')
  INSERT INTO coupons (code, discount_type, discount_value, min_order) VALUES ('LIZSHOOS10', 'percent', 10, 500000);
IF NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'FREESHIP')
  INSERT INTO coupons (code, discount_type, discount_value, min_order) VALUES ('FREESHIP', 'fixed', 30000, 200000);
IF NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'SALE50K')
  INSERT INTO coupons (code, discount_type, discount_value, min_order) VALUES ('SALE50K', 'fixed', 50000, 1000000);
GO

-- Thêm cột phone vào users nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone')
  ALTER TABLE users ADD phone NVARCHAR(20) DEFAULT NULL;
GO
