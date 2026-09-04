const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const { query } = require("../db");
const auth = require("../middleware/auth");

const uploadDirectory = path.join(__dirname, "..", "uploads", "products");
fs.mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
      return callback(new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP"));
    callback(null, true);
  },
});

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role))
      return res.status(403).json({ error: "Không có quyền" });
    next();
  };
}

function parseProduct(row) {
  return {
    ...row,
    sizes: tryParse(row.sizes, []),
    info: tryParse(row.info, []),
    details: tryParse(row.details, []),
    colors: tryParse(row.colors, []),
  };
}

function tryParse(val, fallback) {
  try { return JSON.parse(val || "null") ?? fallback; } catch { return fallback; }
}

// POST /api/products/upload-image — admin/manager
router.post("/upload-image", auth, requireRole("admin", "manager"), (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Vui lòng chọn ảnh" });
    const baseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
    res.status(201).json({ url: `${baseUrl}/uploads/products/${req.file.filename}` });
  });
});

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM products ORDER BY id ASC");
    res.json(rows.map(parseProduct));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    res.json(parseProduct(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — admin/manager
router.post("/", auth, requireRole("admin", "manager"), async (req, res) => {
  const { name, brand, sku, category, price, sizes, image, info, details, colors } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Thiếu tên hoặc giá" });
  try {
    const [rows] = await query(
      `INSERT INTO products (name, brand, sku, category, price, sizes, image, info, details, colors)
       OUTPUT INSERTED.id
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, brand ?? null, sku ?? null, category ?? null, price,
       JSON.stringify(sizes ?? []), image ?? null,
       JSON.stringify(info ?? []), JSON.stringify(details ?? []),
       JSON.stringify(colors ?? [])]
    );
    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — admin/manager
router.put("/:id", auth, requireRole("admin", "manager"), async (req, res) => {
  const { name, brand, sku, category, price, sizes, image, info, details, colors } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Thiếu tên hoặc giá" });
  try {
    await query(
      `UPDATE products SET name=?, brand=?, sku=?, category=?, price=?,
       sizes=?, image=?, info=?, details=?, colors=? WHERE id=?`,
      [name, brand ?? null, sku ?? null, category ?? null, price,
       JSON.stringify(sizes ?? []), image ?? null,
       JSON.stringify(info ?? []), JSON.stringify(details ?? []),
       JSON.stringify(colors ?? []),
       req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — admin only
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
