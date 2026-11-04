const express = require("express");
const router = express.Router();
const { query, transaction } = require("../db");
const auth = require("../middleware/auth");
const { sendOrderConfirmation } = require("../utils/mailer");

async function ensureOrderCouponColumns() {
  await query(`IF COL_LENGTH('orders', 'coupon_code') IS NULL ALTER TABLE orders ADD coupon_code NVARCHAR(50) NULL;`);
  await query(`IF COL_LENGTH('orders', 'coupon_id') IS NULL ALTER TABLE orders ADD coupon_id INT NULL;`);
  await query(`IF COL_LENGTH('orders', 'discount_amount') IS NULL ALTER TABLE orders ADD discount_amount DECIMAL(12,0) NOT NULL CONSTRAINT DF_orders_discount_amount DEFAULT (0);`);
}

async function getValidCoupon(queryFn, code, orderTotal) {
  if (!code) return null;

  const [rows] = await queryFn(
    `SELECT *
     FROM coupons
     WHERE code = ?
     AND is_active = 1
     AND (max_uses IS NULL OR used_count < max_uses)
     AND (expires_at IS NULL OR expires_at > GETDATE())`,
    [String(code).trim().toUpperCase()]
  );

  if (!rows.length) return null;

  const coupon = rows[0];
  const total = Number(orderTotal || 0);

  if (total < Number(coupon.min_order || 0)) return null;
  if (!["percent", "fixed"].includes(coupon.discount_type)) return null;

  let discount = 0;
  if (coupon.discount_type === "percent") {
    discount = Math.round((total * Number(coupon.discount_value)) / 100);
  }
  if (coupon.discount_type === "fixed") {
    discount = Number(coupon.discount_value);
  }

  return {
    ...coupon,
    discount: Math.min(discount, total),
  };
}

// POST /api/orders
router.post("/", async (req, res) => {
  const { name, phone, address, email, paymentMethod, items, couponCode } = req.body;

  if (!name || !phone || !address || !paymentMethod || !items?.length)
    return res.status(400).json({ error: "Thiếu thông tin đơn hàng" });

  if (!["cod", "bank", "vnpay"].includes(paymentMethod)) {
    return res.status(400).json({ error: "Phương thức thanh toán không hợp lệ" });
  }

  const requiresPayment = paymentMethod === "vnpay";
  let userId = null;
  let userEmail = typeof email === "string" ? email.trim().toLowerCase() : null;
  if (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    return res.status(400).json({ error: "Email nhận xác nhận không hợp lệ" });
  }
  const authHeader = req.headers.authorization;
  if (authHeader) {
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token không hợp lệ" });
    }
    let decoded;
    try {
      const jwt = require("jsonwebtoken");
      decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Token không hợp lệ" });
    }
    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return res.status(401).json({ error: "Token không hợp lệ" });
    }
    userId = decoded.id;
    try {
      const [rows] = await query("SELECT email FROM users WHERE id = ?", [userId]);
      if (!rows.length) {
        return res.status(401).json({ error: "Tài khoản không tồn tại" });
      }
      userEmail = userEmail || rows[0].email;
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    return res.status(400).json({ error: "Vui lòng cung cấp email hợp lệ để nhận xác nhận đơn hàng" });
  }

  try {
    await ensureOrderCouponColumns();

    const normalizedCouponCode = String(couponCode || "").trim().toUpperCase();
    const checkout = await transaction(async (queryTx) => {
      const trustedItems = [];
      let subtotal = 0;
      for (const item of items) {
        const productId = Number(item.id ?? item.product_id);
        const quantity = Number(item.quantity);
        const size = item.size == null || item.size === "" ? null : Number(item.size);
        const color = String(item.color || "").trim();
        if (!Number.isInteger(productId) || productId <= 0 ||
            !Number.isInteger(quantity) || quantity <= 0 || quantity > 99 ||
            (size !== null && (!Number.isInteger(size) || size <= 0)) ||
            color.length > 50) {
          const error = new Error("Sản phẩm trong đơn hàng không hợp lệ");
          error.status = 400;
          throw error;
        }

        const [products] = await queryTx(
          "SELECT id, name, price FROM products WHERE id = ?",
          [productId]
        );
        if (!products.length) {
          const error = new Error("Sản phẩm không còn tồn tại");
          error.status = 400;
          throw error;
        }
        const product = products[0];
        const line = {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity,
          size,
          color: color || null,
        };
        subtotal += line.price * quantity;
        trustedItems.push(line);
      }

      const validCoupon = await getValidCoupon(queryTx, normalizedCouponCode, subtotal);
      if (normalizedCouponCode && !validCoupon) {
        const error = new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn");
        error.status = 400;
        throw error;
      }
      const shippingFee = 30000;
      const total = subtotal + shippingFee - (validCoupon?.discount ?? 0);

      const [orderRows] = await queryTx(
        `INSERT INTO orders (customer_name, customer_phone, customer_address, payment_method, total_amount, status, payment_status, user_id, coupon_code, coupon_id, discount_amount)
         OUTPUT INSERTED.id
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          name,
          phone,
          address,
          paymentMethod,
          total,
          requiresPayment ? "awaiting_payment" : "pending",
          requiresPayment ? "pending" : "unpaid",
          userId,
          validCoupon?.code ?? null,
          validCoupon?.id ?? null,
          validCoupon?.discount ?? 0,
        ]
      );
      const oid = orderRows[0].id;

      for (const item of trustedItems) {
        await queryTx(
          `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, size, color)
           VALUES (?, ?, ?, ?, ?, ?, ?)` ,
          [oid, item.id, item.name, item.price, item.quantity, item.size, item.color]
        );
      }

      if (validCoupon) {
        const [updatedCoupon] = await queryTx(
          `UPDATE coupons
           SET used_count = used_count + 1
           OUTPUT INSERTED.id
           WHERE id = ? AND is_active = 1
             AND (max_uses IS NULL OR used_count < max_uses)
             AND (expires_at IS NULL OR expires_at > GETDATE())`,
          [validCoupon.id]
        );
        if (!updatedCoupon.length) {
          const error = new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn");
          error.status = 400;
          throw error;
        }
      }

      return { orderId: oid, total, items: trustedItems };
    });

    const emailResult = await sendOrderConfirmation(userEmail, {
      orderId: checkout.orderId,
      name,
      phone,
      address,
      paymentMethod,
      total: checkout.total,
      items: checkout.items,
    });

    res.status(201).json({
      success: true,
      orderId: checkout.orderId,
      requiresPayment,
      totalAmount: checkout.total,
      emailSent: emailResult.sent,
      emailStatus: emailResult.sent ? "sent" : emailResult.reason,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/orders/my — đơn hàng của user đang đăng nhập
router.get("/my", auth, async (req, res) => {
  try {
    const [orders] = await query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    for (const o of orders) {
      const [items] = await query("SELECT * FROM order_items WHERE order_id = ?", [o.id]);
      o.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — admin/manager only
router.get("/", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role))
    return res.status(403).json({ error: "Không có quyền" });
  try {
    const [orders] = await query("SELECT * FROM orders ORDER BY created_at DESC");
    for (const order of orders) {
      const [items] = await query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const isAdmin = ["admin", "manager"].includes(req.user?.role);
    const [orders] = await query(
      isAdmin
        ? "SELECT * FROM orders WHERE id = ?"
        : "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      isAdmin ? [req.params.id] : [req.params.id, req.user.id]
    );
    if (!orders.length) return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    const [items] = await query("SELECT * FROM order_items WHERE order_id = ?", [req.params.id]);
    res.json({ ...orders[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status — admin/manager
router.patch("/:id/status", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role))
    return res.status(403).json({ error: "Không có quyền" });

  const { status } = req.body;
  const valid = ["pending", "confirmed", "shipping", "done", "cancelled"];
  if (!valid.includes(status))
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });

  try {
    await query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
