const express = require("express");
const router = express.Router();
const { query, transaction } = require("../db");
const auth = require("../middleware/auth");

function normalizeItem(item) {
  const productId = Number(item?.id ?? item?.product_id);
  const size = Number(item?.size);
  const quantity = Number(item?.quantity);
  const color = String(item?.color || "").trim();

  if (!Number.isInteger(productId) || productId <= 0 ||
      !Number.isInteger(size) || size <= 0 ||
      !Number.isInteger(quantity) || quantity <= 0 || quantity > 99 ||
      color.length > 50) {
    return null;
  }

  return { productId, size, quantity, color };
}

async function getCart(userId) {
  const [items] = await query(
    `SELECT ci.product_id AS id, p.name, p.brand, p.price, p.image,
            ci.size, ci.color, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = ?
     ORDER BY ci.created_at, ci.id`,
    [userId]
  );
  return items;
}

async function mergeItems(userId, items) {
  const normalizedItems = items.map(normalizeItem);
  if (normalizedItems.some((item) => !item)) {
    return false;
  }

  await transaction(async (queryTx) => {
    for (const item of normalizedItems) {
      const [existing] = await queryTx(
        `SELECT id, quantity FROM cart_items WITH (UPDLOCK, HOLDLOCK)
         WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?`,
        [userId, item.productId, item.size, item.color]
      );

      if (existing.length) {
        const quantity = Math.min(99, Number(existing[0].quantity) + item.quantity);
        await queryTx("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, existing[0].id]);
      } else {
        await queryTx(
          "INSERT INTO cart_items (user_id, product_id, size, color, quantity) VALUES (?, ?, ?, ?, ?)",
          [userId, item.productId, item.size, item.color, item.quantity]
        );
      }
    }
  });
  return true;
}

router.use(auth);

router.get("/", async (req, res) => {
  try {
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/merge", async (req, res) => {
  if (!Array.isArray(req.body.items)) {
    return res.status(400).json({ error: "Danh sách sản phẩm không hợp lệ" });
  }

  try {
    if (!await mergeItems(req.user.id, req.body.items)) {
      return res.status(400).json({ error: "Thông tin sản phẩm trong giỏ không hợp lệ" });
    }
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const item = normalizeItem(req.body);
  if (!item) {
    return res.status(400).json({ error: "Thông tin sản phẩm trong giỏ không hợp lệ" });
  }

  try {
    if (!await mergeItems(req.user.id, [item])) {
      return res.status(400).json({ error: "Thông tin sản phẩm trong giỏ không hợp lệ" });
    }
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  const size = Number(req.body.size);
  const quantity = Number(req.body.quantity);
  const color = String(req.body.color || "").trim();
  if (!Number.isInteger(productId) || !Number.isInteger(size) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || color.length > 50) {
    return res.status(400).json({ error: "Thông tin sản phẩm trong giỏ không hợp lệ" });
  }

  try {
    const [, result] = await query(
      `UPDATE cart_items SET quantity = ?
       WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?`,
      [quantity, req.user.id, productId, size, color]
    );
    if (!result.rowsAffected[0]) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm trong giỏ" });
    }
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  const size = Number(req.query.size);
  const color = String(req.query.color || "").trim();
  if (!Number.isInteger(productId) || !Number.isInteger(size) || color.length > 50) {
    return res.status(400).json({ error: "Thông tin sản phẩm trong giỏ không hợp lệ" });
  }

  try {
    await query(
      "DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?",
      [req.user.id, productId, size, color]
    );
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", async (req, res) => {
  try {
    await query("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
