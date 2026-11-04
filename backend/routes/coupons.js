const express = require("express");
const router = express.Router();
const { query } = require("../db");
const auth = require("../middleware/auth");

// ========================================
// POST /api/coupons/apply
// Khách kiểm tra và áp dụng mã giảm giá
// ========================================
router.post("/apply", async (req, res) => {
  const { code, orderTotal } = req.body;

  if (!code) {
    return res.status(400).json({
      error: "Vui lòng nhập mã giảm giá",
    });
  }

  const total = Number(orderTotal);
  if (!Number.isFinite(total) || total <= 0) {
    return res.status(400).json({
      error: "Giá trị đơn hàng không hợp lệ",
    });
  }

  try {
    const [rows] = await query(
      `SELECT *
       FROM coupons
       WHERE code = ?
       AND is_active = 1
       AND (max_uses IS NULL OR used_count < max_uses)
       AND (expires_at IS NULL OR expires_at > GETDATE())`,
      [code.trim().toUpperCase()]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
      });
    }

    const coupon = rows[0];
    if (total < Number(coupon.min_order)) {
      return res.status(400).json({
        error: `Đơn hàng tối thiểu ${Number(coupon.min_order).toLocaleString("vi-VN")}₫ để dùng mã này`,
      });
    }

    if (!["percent", "fixed"].includes(coupon.discount_type)) {
      return res.status(400).json({
        error: "Loại mã giảm giá không hợp lệ",
      });
    }

    let discount = 0;

    if (coupon.discount_type === "percent") {
      discount = Math.round((total * Number(coupon.discount_value)) / 100);
    }

    if (coupon.discount_type === "fixed") {
      discount = Number(coupon.discount_value);
    }

    discount = Math.min(discount, total);
    const finalTotal = total - discount;

    return res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discount,
      },
      order: {
        originalTotal: total,
        discount,
        finalTotal,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Lỗi server",
    });
  }
});

// GET /api/coupons/available?orderTotal=...
// Khách xem mã giảm giá đang hoạt động và đủ điều kiện sử dụng
router.get("/available", async (req, res) => {
  const total = Number(req.query.orderTotal);
  if (!Number.isFinite(total) || total < 0) {
    return res.status(400).json({ error: "Giá trị đơn hàng không hợp lệ" });
  }

  try {
    const [coupons] = await query(
      `SELECT code, discount_type, discount_value, min_order
       FROM coupons
       WHERE is_active = 1
         AND (max_uses IS NULL OR used_count < max_uses)
         AND (expires_at IS NULL OR expires_at > GETDATE())
       ORDER BY min_order, code`
    );

    res.json(coupons.map((coupon) => {
      const minOrder = Number(coupon.min_order || 0);
      const discountValue = Number(coupon.discount_value);
      const eligible = total >= minOrder && ["percent", "fixed"].includes(coupon.discount_type);
      const calculatedDiscount = coupon.discount_type === "percent"
        ? Math.round((total * discountValue) / 100)
        : discountValue;

      return {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: discountValue,
        min_order: minOrder,
        eligible,
        discount: eligible ? Math.min(calculatedDiscount, total) : 0,
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể tải danh sách mã giảm giá" });
  }
});

// ========================================
// GET /api/coupons
// Admin / Manager xem coupon
// ========================================
router.get("/", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role)) {
    return res.status(403).json({
      error: "Không có quyền",
    });
  }

  try {
    const [rows] = await query("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Lỗi server",
    });
  }
});

// ========================================
// POST /api/coupons
// Admin / Manager tạo coupon
// ========================================
router.post("/", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role)) {
    return res.status(403).json({
      error: "Không có quyền",
    });
  }

  const { code, discount_type, discount_value, min_order, max_uses, expires_at } = req.body;

  if (!code || !discount_type || discount_value == null) {
    return res.status(400).json({
      error: "Thiếu thông tin",
    });
  }

  if (!["percent", "fixed"].includes(discount_type)) {
    return res.status(400).json({
      error: "Loại giảm giá không hợp lệ",
    });
  }

  if (Number(discount_value) <= 0) {
    return res.status(400).json({
      error: "Giá trị giảm giá phải lớn hơn 0",
    });
  }

  if (discount_type === "percent" && Number(discount_value) > 100) {
    return res.status(400).json({
      error: "Giảm theo phần trăm không được vượt quá 100%",
    });
  }

  try {
    const [rows] = await query(
      `INSERT INTO coupons
       (code, discount_type, discount_value, min_order, max_uses, expires_at, is_active, used_count)
       OUTPUT INSERTED.id
       VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
      [
        code.trim().toUpperCase(),
        discount_type,
        Number(discount_value),
        Number(min_order) || 0,
        max_uses ?? null,
        expires_at ?? null,
      ]
    );

    res.status(201).json({
      success: true,
      id: rows[0].id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Không thể tạo mã giảm giá",
    });
  }
});

// ========================================
// PATCH /api/coupons/:id
// Bật / tắt coupon
// ========================================
router.patch("/:id", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role)) {
    return res.status(403).json({
      error: "Không có quyền",
    });
  }

  const { is_active } = req.body;

  try {
    await query(
      `UPDATE coupons
       SET is_active = ?
       WHERE id = ?`,
      [is_active ? 1 : 0, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Lỗi server",
    });
  }
});

// ========================================
// DELETE /api/coupons/:id
// Chỉ Admin được xóa
// ========================================
router.delete("/:id", auth, async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      error: "Không có quyền",
    });
  }

  try {
    await query("DELETE FROM coupons WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Không thể xóa coupon",
    });
  }
});

module.exports = router;
