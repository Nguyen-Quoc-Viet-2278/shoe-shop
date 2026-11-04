const express = require("express");
const router = express.Router();
const { query, transaction } = require("../db");
const auth = require("../middleware/auth");

function readAddress(body) {
  const fullName = String(body.full_name || "").trim();
  const phone = String(body.phone || "").trim();
  const address = String(body.address || "").trim();
  if (!fullName || !phone || !address || fullName.length > 255 || phone.length > 20) {
    return null;
  }
  return { fullName, phone, address, isDefault: Boolean(body.is_default) };
}

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const [addresses] = await query(
      "SELECT id, full_name, phone, address, is_default, created_at FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
      [req.user.id]
    );
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const address = readAddress(req.body);
  if (!address) {
    return res.status(400).json({ error: "Vui lòng nhập họ tên, số điện thoại và địa chỉ hợp lệ" });
  }

  try {
    const id = await transaction(async (queryTx) => {
      const [existing] = await queryTx("SELECT id FROM addresses WHERE user_id = ?", [req.user.id]);
      const isDefault = address.isDefault || existing.length === 0;
      if (isDefault) {
        await queryTx("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [req.user.id]);
      }
      const [rows] = await queryTx(
        `INSERT INTO addresses (user_id, full_name, phone, address, is_default)
         OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, address.fullName, address.phone, address.address, isDefault ? 1 : 0]
      );
      return rows[0].id;
    });
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const address = readAddress(req.body);
  if (!Number.isInteger(id) || id <= 0 || !address) {
    return res.status(400).json({ error: "Thông tin địa chỉ không hợp lệ" });
  }

  try {
    const updated = await transaction(async (queryTx) => {
      const [owned] = await queryTx(
        "SELECT id FROM addresses WHERE id = ? AND user_id = ?",
        [id, req.user.id]
      );
      if (!owned.length) return false;
      if (address.isDefault) {
        await queryTx("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [req.user.id]);
      }
      const [, result] = await queryTx(
        `UPDATE addresses
         SET full_name = ?, phone = ?, address = ?, is_default = ?
         WHERE id = ? AND user_id = ?`,
        [address.fullName, address.phone, address.address, address.isDefault ? 1 : 0, id, req.user.id]
      );
      return result.rowsAffected[0] > 0;
    });
    if (!updated) {
      return res.status(404).json({ error: "Không tìm thấy địa chỉ" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Địa chỉ không hợp lệ" });
  }

  try {
    const deleted = await transaction(async (queryTx) => {
      const [owned] = await queryTx(
        "SELECT is_default FROM addresses WHERE id = ? AND user_id = ?",
        [id, req.user.id]
      );
      if (!owned.length) return false;
      await queryTx("DELETE FROM addresses WHERE id = ? AND user_id = ?", [id, req.user.id]);
      if (owned[0].is_default) {
        await queryTx(
          `UPDATE addresses
           SET is_default = 1
           WHERE id = (
             SELECT TOP (1) id FROM addresses
             WHERE user_id = ? ORDER BY created_at DESC, id DESC
           )`,
          [req.user.id]
        );
      }
      return true;
    });
    if (!deleted) {
      return res.status(404).json({ error: "Không tìm thấy địa chỉ" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
