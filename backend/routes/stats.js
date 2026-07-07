const express = require("express");
const router = express.Router();
const { query } = require("../db");
const auth = require("../middleware/auth");

// Chỉ admin và manager mới xem được thống kê
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Không có quyền truy cập" });
    next();
  };
}

// GET /api/stats/summary — tổng quan
router.get("/summary", auth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM vw_dashboard_summary");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/top-products — sản phẩm bán chạy
router.get("/top-products", auth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM vw_top_products");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/revenue — doanh thu theo tháng
router.get("/revenue", auth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const [rows] = await query(
      "SELECT * FROM vw_revenue_by_month ORDER BY year DESC, month DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
