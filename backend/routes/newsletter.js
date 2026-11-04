const express = require("express");
const router = express.Router();
const { query } = require("../db");

router.post("/", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Email không hợp lệ" });
  }

  try {
    const [existing] = await query(
      "SELECT id FROM newsletter_subscribers WHERE email = ?",
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ error: "Email này đã đăng ký nhận tin" });
    }

    await query("INSERT INTO newsletter_subscribers (email) VALUES (?)", [email]);
    res.status(201).json({ success: true });
  } catch (err) {
    if ([2601, 2627].includes(err.number)) {
      return res.status(409).json({ error: "Email này đã đăng ký nhận tin" });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
