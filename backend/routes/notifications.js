const express = require("express");
const router = express.Router();
const { query } = require("../db");
const auth = require("../middleware/auth");

// GET /api/notifications — lấy thông báo của user
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read — đánh dấu đã đọc tất cả
router.patch("/read", auth, async (req, res) => {
  try {
    await query(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
