const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { query } = require("../db");
const authMiddleware = require("../middleware/auth");
const { sendResetEmail } = require("../utils/mailer");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.full_name, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
  if (password.length < 6)
    return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
  const normalizedName = String(full_name).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPhone = String(phone || "").trim();
  if (!normalizedName || normalizedName.length > 255)
    return res.status(400).json({ error: "Họ tên không hợp lệ" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 255)
    return res.status(400).json({ error: "Email không hợp lệ" });
  if (normalizedPhone && !/^[0-9+\-\s().]{8,20}$/.test(normalizedPhone))
    return res.status(400).json({ error: "Số điện thoại không hợp lệ" });

  try {
    const [existing] = await query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existing.length > 0)
      return res.status(409).json({ error: "Email đã được sử dụng" });

    const hashed = await bcrypt.hash(password, 10);
    const [rows] = await query(
      `INSERT INTO users (full_name, email, phone, password_hash)
       OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.phone, INSERTED.role
       VALUES (?, ?, ?, ?)`,
      [normalizedName, normalizedEmail, normalizedPhone || null, hashed]
    );
    const user = rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Vui lòng nhập email và mật khẩu" });

  try {
    const [rows] = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length)
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });

    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone, role: user.role || "user" },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await query("SELECT id, full_name, email, phone, role FROM users WHERE id = ?", [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "Không tìm thấy người dùng" });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/profile — cập nhật thông tin cá nhân
router.put("/profile", authMiddleware, async (req, res) => {
  const { full_name, phone } = req.body;
  if (!full_name?.trim())
    return res.status(400).json({ error: "Họ tên không được để trống" });

  try {
    await query(
      "UPDATE users SET full_name = ?, phone = ? WHERE id = ?",
      [full_name.trim(), phone?.trim() || null, req.user.id]
    );
    const [rows] = await query("SELECT id, full_name, email, phone, role FROM users WHERE id = ?", [req.user.id]);
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/change-password — đổi mật khẩu (đã đăng nhập)
router.put("/change-password", authMiddleware, async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password)
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ" });
  if (new_password.length < 6)
    return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" });

  try {
    const [rows] = await query("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);
    const match = await bcrypt.compare(old_password, rows[0].password_hash);
    if (!match)
      return res.status(401).json({ error: "Mật khẩu hiện tại không đúng" });

    const hashed = await bcrypt.hash(new_password, 10);
    await query("UPDATE users SET password_hash = ? WHERE id = ?", [hashed, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users — danh sách người dùng (admin only)
router.get("/users", authMiddleware, async (req, res) => {
  if (!["admin", "manager"].includes(req.user?.role))
    return res.status(403).json({ error: "Không có quyền" });
  try {
    const [rows] = await query(
      "SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/users/:id/role — đổi role (admin only)
router.patch("/users/:id/role", authMiddleware, async (req, res) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Chỉ admin mới đổi được role" });
  const { role } = req.body;
  if (!["user", "manager", "admin"].includes(role))
    return res.status(400).json({ error: "Role không hợp lệ" });
  try {
    await query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/google — đăng nhập bằng Google OAuth
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "Thiếu credential" });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub: googleId } = ticket.getPayload();

    // Tìm user theo email
    const [rows] = await query("SELECT * FROM users WHERE email = ?", [email]);

    let user;
    if (rows.length > 0) {
      user = rows[0];
    } else {
      // Tạo user mới từ Google
      const [inserted] = await query(
        `INSERT INTO users (full_name, email, password_hash, role)
         OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.role
         VALUES (?, ?, ?, 'user')`,
        [name, email, `google_${googleId}`]
      );
      user = inserted[0];
    }

    res.json({
      token: signToken(user),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || null,
        role: user.role || "user",
      },
    });
  } catch (err) {
    res.status(401).json({ error: "Google token không hợp lệ: " + err.message });
  }
});

// POST /api/auth/forgot-password — gửi OTP về email
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Vui lòng nhập email" });

  try {
    const [rows] = await query("SELECT id, full_name FROM users WHERE email = ?", [email]);
    // Luôn trả về success để tránh lộ email tồn tại
    if (!rows.length) return res.json({ success: true });

    const user = rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    // Xoá OTP cũ của user này
    await query("DELETE FROM password_reset_tokens WHERE user_id = ?", [user.id]);
    await query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, otp, expires.toISOString()]
    );

    await sendResetEmail(email, otp, user.full_name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password — đặt lại mật khẩu bằng OTP
router.post("/reset-password", async (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password)
    return res.status(400).json({ error: "Thiếu thông tin" });
  if (new_password.length < 6)
    return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });

  try {
    const [users] = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (!users.length)
      return res.status(400).json({ error: "Email không tồn tại" });

    const userId = users[0].id;
    const [tokens] = await query(
      `SELECT * FROM password_reset_tokens
       WHERE user_id = ? AND token = ? AND used = 0 AND expires_at > GETDATE()`,
      [userId, otp]
    );
    if (!tokens.length)
      return res.status(400).json({ error: "OTP không hợp lệ hoặc đã hết hạn" });

    const hashed = await bcrypt.hash(new_password, 10);
    await query("UPDATE users SET password_hash = ? WHERE id = ?", [hashed, userId]);
    await query("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", [tokens[0].id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
