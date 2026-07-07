const express = require("express");
const router = express.Router();
const { query } = require("../db");
const auth = require("../middleware/auth");

// GET /api/reviews — tất cả reviews (admin)
router.get("/", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role))
    return res.status(403).json({ error: "Không có quyền" });
  try {
    const [rows] = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.product_id, r.user_id,
              u.full_name, p.name AS product_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/admin/:id — admin xóa bất kỳ review
router.delete("/admin/:id", auth, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role))
    return res.status(403).json({ error: "Không có quyền" });
  try {
    await query("DELETE FROM reviews WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/:productId — lấy tất cả review của sản phẩm
router.get("/:productId", async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.user_id,
              u.full_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/:productId/me — review của user hiện tại
router.get("/:productId/me", auth, async (req, res) => {
  try {
    const [rows] = await query(
      "SELECT * FROM reviews WHERE product_id = ? AND user_id = ?",
      [req.params.productId, req.user.id]
    );
    res.json(rows[0] ?? null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/:productId — thêm hoặc cập nhật review
router.post("/:productId", auth, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ error: "Rating phải từ 1 đến 5" });

  try {
    const [existing] = await query(
      "SELECT id FROM reviews WHERE product_id = ? AND user_id = ?",
      [req.params.productId, req.user.id]
    );

    if (existing.length > 0) {
      await query(
        "UPDATE reviews SET rating = ?, comment = ? WHERE product_id = ? AND user_id = ?",
        [rating, comment ?? null, req.params.productId, req.user.id]
      );
      return res.json({ success: true, updated: true });
    }

    const [rows] = await query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       OUTPUT INSERTED.id VALUES (?, ?, ?, ?)`,
      [req.params.productId, req.user.id, rating, comment ?? null]
    );
    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/:productId — xóa review của user
router.delete("/:productId", auth, async (req, res) => {
  try {
    await query(
      "DELETE FROM reviews WHERE product_id = ? AND user_id = ?",
      [req.params.productId, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
