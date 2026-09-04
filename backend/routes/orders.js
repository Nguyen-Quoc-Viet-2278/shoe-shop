const express = require("express");
const router = express.Router();
const { query, transaction } = require("../db");
const auth = require("../middleware/auth");
const { sendOrderConfirmation } = require("../utils/mailer");

// POST /api/orders
router.post("/", async (req, res) => {
  const { name, phone, address, email, paymentMethod, items, total } = req.body;

  if (!name || !phone || !address || !paymentMethod || !items?.length)
    return res.status(400).json({ error: "Thiếu thông tin đơn hàng" });

  let userId = null;
  let userEmail = email ?? null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      userId = decoded.id ?? null;
      // Lấy email thật từ DB nếu chưa có
      if (!userEmail && userId) {
        const [rows] = await query("SELECT email FROM users WHERE id = ?", [userId]);
        if (rows.length) userEmail = rows[0].email;
      }
    } catch {}
  }

  try {
    const orderId = await transaction(async (queryTx) => {
      const [orderRows] = await queryTx(
        `INSERT INTO orders (customer_name, customer_phone, customer_address, payment_method, total_amount, user_id)
         OUTPUT INSERTED.id
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, phone, address, paymentMethod, total, userId]
      );
      const oid = orderRows[0].id;

      for (const item of items) {
        await queryTx(
          `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, size, color)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [oid, item.id ?? null, item.name ?? null, item.price ?? null, item.quantity, item.size ?? null, item.color ?? null]
        );
      }
      return oid;
    });

    // Gửi email xác nhận đơn hàng (không chặn response)
    if (userEmail) {
      sendOrderConfirmation(userEmail, {
        orderId,
        name,
        phone,
        address,
        paymentMethod,
        total,
        items,
      }).catch(() => {});
    }

    res.status(201).json({ success: true, orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get("/:id", async (req, res) => {
  try {
    const [orders] = await query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
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
