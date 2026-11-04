-- SEED DATA cho shoe_shop
USE shoe_shop;
GO

-- =====================
-- USERS (password: 123456)
-- role: admin / manager / user
-- =====================

-- ADMIN
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'admin@shoeshop.com')
  INSERT INTO dbo.users (full_name, email, password_hash, role) VALUES
  (N'Admin Hệ Thống', N'admin@shoeshop.com', N'$2b$10$YCK9dMQYWH7mGUNtkpyMlelUEe4uhKkKkgqU6RETekT..PirfWnpa', N'admin');
GO

-- MANAGER
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'manager@shoeshop.com')
  INSERT INTO dbo.users (full_name, email, password_hash, role) VALUES
  (N'Trần Thị Bình', N'manager@shoeshop.com', N'$2b$10$YCK9dMQYWH7mGUNtkpyMlelUEe4uhKkKkgqU6RETekT..PirfWnpa', N'manager');
GO

-- USERS (khách hàng)
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'nguyenvana@gmail.com')
  INSERT INTO dbo.users (full_name, email, password_hash, role) VALUES
  (N'Nguyễn Văn An', N'nguyenvana@gmail.com', N'$2b$10$YCK9dMQYWH7mGUNtkpyMlelUEe4uhKkKkgqU6RETekT..PirfWnpa', N'user');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'tranthib@gmail.com')
  INSERT INTO dbo.users (full_name, email, password_hash, role) VALUES
  (N'Trần Văn Bảo', N'tranthib@gmail.com', N'$2b$10$YCK9dMQYWH7mGUNtkpyMlelUEe4uhKkKkgqU6RETekT..PirfWnpa', N'user');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'levanc@gmail.com')
  INSERT INTO dbo.users (full_name, email, password_hash, role) VALUES
  (N'Lê Văn Công', N'levanc@gmail.com', N'$2b$10$YCK9dMQYWH7mGUNtkpyMlelUEe4uhKkKkgqU6RETekT..PirfWnpa', N'user');
GO

-- Cập nhật role cho user cũ nếu chưa có (migration safety)
UPDATE dbo.users SET role = 'admin'   WHERE email = 'admin@shoeshop.com'   AND role != 'admin';
UPDATE dbo.users SET role = 'manager' WHERE email = 'manager@shoeshop.com' AND role != 'manager';
UPDATE dbo.users SET role = 'user'    WHERE email = 'nguyenvana@gmail.com' AND role != 'user';
GO

-- =====================
-- ADDRESSES
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.addresses WHERE user_id = (SELECT id FROM dbo.users WHERE email='nguyenvana@gmail.com') AND phone='0901111111')
BEGIN
  INSERT INTO dbo.addresses (user_id, full_name, phone, address, is_default) VALUES
  ((SELECT id FROM dbo.users WHERE email='nguyenvana@gmail.com'),
   N'Nguyễn Văn An', N'0901111111', N'123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', 1);

  INSERT INTO dbo.addresses (user_id, full_name, phone, address, is_default) VALUES
  ((SELECT id FROM dbo.users WHERE email='nguyenvana@gmail.com'),
   N'Nguyễn Văn An', N'0901111111', N'456 Lê Lợi, Phường 2, Quận 3, TP.HCM', 0);
END
GO
IF NOT EXISTS (SELECT 1 FROM dbo.addresses WHERE user_id = (SELECT id FROM dbo.users WHERE email='tranthib@gmail.com') AND phone='0912222222')
  INSERT INTO dbo.addresses (user_id, full_name, phone, address, is_default) VALUES
  ((SELECT id FROM dbo.users WHERE email='tranthib@gmail.com'),
   N'Trần Thị Bình', N'0912222222', N'789 Trần Hưng Đạo, Phường 5, Quận 5, TP.HCM', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.addresses WHERE user_id = (SELECT id FROM dbo.users WHERE email='levanc@gmail.com') AND phone='0923333333')
  INSERT INTO dbo.addresses (user_id, full_name, phone, address, is_default) VALUES
  ((SELECT id FROM dbo.users WHERE email='levanc@gmail.com'),
   N'Lê Văn Công', N'0923333333', N'321 Đinh Tiên Hoàng, Phường 1, Quận Bình Thạnh, TP.HCM', 1);
GO

-- =====================
-- ORDERS + ORDER_ITEMS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.orders WHERE customer_phone='0901111111' AND total_amount=5300000)
BEGIN
  INSERT INTO dbo.orders (customer_name, customer_phone, customer_address, payment_method, total_amount, status) VALUES
  (N'Nguyễn Văn An', N'0901111111', N'123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', N'bank', 5300000, N'done');

  DECLARE @order1 INT = SCOPE_IDENTITY();
  INSERT INTO dbo.order_items (order_id, product_id, product_name, price, quantity, size) VALUES
  (@order1, 1, N'Nike Air Force 1', 2500000, 1, 42),
  (@order1, 2, N'Adidas Stan Smith', 2800000, 1, 41);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.orders WHERE customer_phone='0901111111' AND total_amount=4500000)
BEGIN
  INSERT INTO dbo.orders (customer_name, customer_phone, customer_address, payment_method, total_amount, status) VALUES
  (N'Nguyễn Văn An', N'0901111111', N'123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', N'bank', 4500000, N'shipping');

  DECLARE @order2 INT = SCOPE_IDENTITY();
  INSERT INTO dbo.order_items (order_id, product_id, product_name, price, quantity, size) VALUES
  (@order2, 5, N'Jordan 1 Retro High', 4500000, 1, 43);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.orders WHERE customer_phone='0912222222' AND total_amount=3400000)
BEGIN
  INSERT INTO dbo.orders (customer_name, customer_phone, customer_address, payment_method, total_amount, status) VALUES
  (N'Trần Thị Bình', N'0912222222', N'789 Trần Hưng Đạo, Phường 5, Quận 5, TP.HCM', N'bank', 3400000, N'confirmed');

  DECLARE @order3 INT = SCOPE_IDENTITY();
  INSERT INTO dbo.order_items (order_id, product_id, product_name, price, quantity, size) VALUES
  (@order3, 6, N'Vans Old Skool', 1600000, 1, 37),
  (@order3, 8, N'Reebok Classic', 1900000, 1, 38);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.orders WHERE customer_phone='0923333333' AND total_amount=6400000)
BEGIN
  INSERT INTO dbo.orders (customer_name, customer_phone, customer_address, payment_method, total_amount, status) VALUES
  (N'Lê Văn Công', N'0923333333', N'321 Đinh Tiên Hoàng, Phường 1, Quận Bình Thạnh, TP.HCM', N'bank', 6400000, N'pending');

  DECLARE @order4 INT = SCOPE_IDENTITY();
  INSERT INTO dbo.order_items (order_id, product_id, product_name, price, quantity, size) VALUES
  (@order4, 4, N'New Balance 574', 3200000, 1, 42),
  (@order4, 7, N'Puma RS-X', 2100000, 1, 41),
  (@order4, 3, N'Converse Chuck 70', 1800000, 1, 39) -- thêm 1 đôi nữa (tổng thực = 7100000, để demo)
END
GO

-- =====================
-- REVIEWS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.reviews WHERE user_id=(SELECT id FROM dbo.users WHERE email='nguyenvana@gmail.com') AND product_id=1)
  INSERT INTO dbo.reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM dbo.users WHERE email='nguyenvana@gmail.com'), 1, 5,
   N'Giày rất đẹp, chất liệu tốt, đi êm chân. Sẽ ủng hộ shop lần sau!');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.reviews WHERE user_id=(SELECT id FROM dbo.users WHERE email='nguyenvana@gmail.com') AND product_id=2)
  INSERT INTO dbo.reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM dbo.users WHERE email='nguyenvana@gmail.com'), 2, 4,
   N'Giày đẹp, đúng size, giao hàng nhanh. Trừ 1 sao vì hộp bị móp nhẹ.');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.reviews WHERE user_id=(SELECT id FROM dbo.users WHERE email='tranthib@gmail.com') AND product_id=6)
  INSERT INTO dbo.reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM dbo.users WHERE email='tranthib@gmail.com'), 6, 5,
   N'Vans Old Skool cực kỳ ưng ý, phối đồ gì cũng hợp!');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.reviews WHERE user_id=(SELECT id FROM dbo.users WHERE email='tranthib@gmail.com') AND product_id=8)
  INSERT INTO dbo.reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM dbo.users WHERE email='tranthib@gmail.com'), 8, 4,
   N'Reebok Classic nhẹ, thoáng khí, phù hợp đi gym hằng ngày.');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.reviews WHERE user_id=(SELECT id FROM dbo.users WHERE email='levanc@gmail.com') AND product_id=5)
  INSERT INTO dbo.reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM dbo.users WHERE email='levanc@gmail.com'), 5, 5,
   N'Jordan 1 đỉnh của đỉnh! Fullbox xịn, giao đúng màu đúng size.');
GO

-- =====================
-- CART_ITEMS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.cart_items WHERE user_id=(SELECT id FROM dbo.users WHERE email='levanc@gmail.com') AND product_id=1)
  INSERT INTO dbo.cart_items (user_id, product_id, size, quantity) VALUES
  ((SELECT id FROM dbo.users WHERE email='levanc@gmail.com'), 1, 42, 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.cart_items WHERE user_id=(SELECT id FROM dbo.users WHERE email='levanc@gmail.com') AND product_id=3)
  INSERT INTO dbo.cart_items (user_id, product_id, size, quantity) VALUES
  ((SELECT id FROM dbo.users WHERE email='levanc@gmail.com'), 3, 40, 2);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.cart_items WHERE user_id=(SELECT id FROM dbo.users WHERE email='tranthib@gmail.com') AND product_id=4)
  INSERT INTO dbo.cart_items (user_id, product_id, size, quantity) VALUES
  ((SELECT id FROM dbo.users WHERE email='tranthib@gmail.com'), 4, 39, 1);
GO
