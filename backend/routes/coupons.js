const express = require("express");
const router = express.Router();
const { query } = require("../db");
const auth = require("../middleware/auth");

// POST /api/coupons/apply — kiểm tra và áp dụng mã giảm giá
router.post("/apply", async (req, res) => {
  const { code, orderTotal } = req.body;
  if (!code) return res.status(400).json({ error: "Vui lòng nhập mã giảm giá" });

  try {
    const [rows] = await query(
      `SELECT * FROM coupons
       WHERE code = ? AND is_active = 1
       AND (max_uses IS NULL OR used_count < max_uses)
       AND (expires_at IS NULL OR expires_at > GETDATE())`,
      [code.toUpperCase().trim()]
    );

    if (!rows.length)
      return res.status(404).json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" });

    const coupon = rows[0];
    if (orderTotal < coupon.min_order)
      return res.status(400).json({
        error: `Đơn hàng tối thiểu ${Number(coupon.min_order).toLocaleString("vi-VN")}₫ để dùng mã này`,
      });

    const discount =
      coupon.discount_type === "percent"
        ? Math.round((orderTotal * coupon.discount_value) / 100)
        : Number(coupon.discount_value);

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coupons/use — trừ lượt dùng sau khi đặt hàng thành công
router.post("/use", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Thiếu mã" });
  try {
    await query("UPDATE coupons SET used_count = used_count + 1 WHERE code = ?", [code.toUpperCase().trim()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coupons — admin: xem tất cả coupon
router.get("/", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role))
    return res.status(403).json({ error: "Không có quyền" });
  try {
    const [rows] = await query("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coupons — admin: tạo coupon mới
router.post("/", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role))
    return res.status(403).json({ error: "Không có quyền" });
  const { code, discount_type, discount_value, min_order, max_uses, expires_at } = req.body;
  if (!code || !discount_type || !discount_value)
    return res.status(400).json({ error: "Thiếu thông tin" });
  try {
    const [rows] = await query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expires_at)
       OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?)`,
      [code.toUpperCase().trim(), discount_type, discount_value,
       min_order ?? 0, max_uses ?? null, expires_at ?? null]
    );
    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/coupons/:id — admin: bật/tắt coupon
router.patch("/:id", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role))
    return res.status(403).json({ error: "Không có quyền" });
  const { is_active } = req.body;
  try {
    await query("UPDATE coupons SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/coupons/:id — admin: xóa coupon
router.delete("/:id", auth, async (req, res) => {
  if (!["admin"].includes(req.user?.role))
    return res.status(403).json({ error: "Không có quyền" });
  try {
    await query("DELETE FROM coupons WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
