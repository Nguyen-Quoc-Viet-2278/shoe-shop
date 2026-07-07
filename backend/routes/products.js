const express = require("express");
const router = express.Router();
const { query } = require("../db");
const auth = require("../middleware/auth");

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
  };
}

function tryParse(val, fallback) {
  try { return JSON.parse(val || "null") ?? fallback; } catch { return fallback; }
}

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
  const { name, brand, sku, category, price, sizes, image, info, details } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Thiếu tên hoặc giá" });
  try {
    const [rows] = await query(
      `INSERT INTO products (name, brand, sku, category, price, sizes, image, info, details)
       OUTPUT INSERTED.id
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, brand ?? null, sku ?? null, category ?? null, price,
       JSON.stringify(sizes ?? []), image ?? null,
       JSON.stringify(info ?? []), JSON.stringify(details ?? [])]
    );
    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — admin/manager
router.put("/:id", auth, requireRole("admin", "manager"), async (req, res) => {
  const { name, brand, sku, category, price, sizes, image, info, details } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Thiếu tên hoặc giá" });
  try {
    await query(
      `UPDATE products SET name=?, brand=?, sku=?, category=?, price=?,
       sizes=?, image=?, info=?, details=? WHERE id=?`,
      [name, brand ?? null, sku ?? null, category ?? null, price,
       JSON.stringify(sizes ?? []), image ?? null,
       JSON.stringify(info ?? []), JSON.stringify(details ?? []),
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
