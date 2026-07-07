const express = require("express");
const router = express.Router();
const { query } = require("../db");
const auth = require("../middleware/auth");

// GET /api/wishlist — lấy danh sách yêu thích
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT w.product_id, p.name, p.brand, p.price, p.image, p.sku, p.sizes
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    const parsed = rows.map((r) => ({
      ...r,
      sizes: (() => { try { return JSON.parse(r.sizes || "[]"); } catch { return []; } })(),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/wishlist/ids — chỉ lấy danh sách product_id (dùng cho kiểm tra tim)
router.get("/ids", auth, async (req, res) => {
  try {
    const [rows] = await query(
      "SELECT product_id FROM wishlist WHERE user_id = ?",
      [req.user.id]
    );
    res.json(rows.map((r) => r.product_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wishlist/:productId — thêm vào yêu thích
router.post("/:productId", auth, async (req, res) => {
  try {
    const [existing] = await query(
      "SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?",
      [req.user.id, req.params.productId]
    );
    if (existing.length > 0)
      return res.json({ success: true, already: true });

    await query(
      "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)",
      [req.user.id, req.params.productId]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/wishlist/:productId — xóa khỏi yêu thích
router.delete("/:productId", auth, async (req, res) => {
  try {
    await query(
      "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
      [req.user.id, req.params.productId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
