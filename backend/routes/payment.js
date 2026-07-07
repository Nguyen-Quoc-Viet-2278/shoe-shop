const express = require("express");
const router = express.Router();
const { query, transaction } = require("../db");
const { createPaymentUrl, verifyReturnUrl } = require("../utils/vnpay");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// POST /api/payment/vnpay/create-payment-url
router.post("/vnpay/create-payment-url", async (req, res) => {
  const { orderId, qr } = req.body;
  if (!orderId) return res.status(400).json({ error: "Thiếu orderId" });

  try {
    const [orders] = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
    const order = orders[0];
    if (!order) return res.status(404).json({ error: "Không tìm thấy đơn hàng" });

    const ipAddr =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const paymentUrl = createPaymentUrl({
      orderId: order.id,
      amount: order.total_amount,
      ipAddr,
      orderInfo: `Thanh toan don hang ${order.id} LIZSHOOS`,
      orderType: qr ? "qr" : "other",
    });

    res.json({ success: true, paymentUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function markOrderPaid(orderId) {
  await transaction(async (queryTx) => {
    await queryTx(
      `UPDATE orders SET status = 'confirmed', payment_status = 'paid'
       WHERE id = ? AND status = 'awaiting_payment'`,
      [orderId]
    );

    const [items] = await queryTx(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );

    for (const item of items) {
      if (item.product_id) {
        await queryTx(
          "UPDATE products SET stock = CASE WHEN stock >= ? THEN stock - ? ELSE 0 END WHERE id = ?",
          [item.quantity, item.quantity, item.product_id]
        );
      }
    }

    const [orders] = await queryTx("SELECT user_id FROM orders WHERE id = ?", [orderId]);
    const userId = orders[0]?.user_id;
    if (userId) {
      await queryTx(
        "INSERT INTO notifications (user_id, order_id, message) VALUES (?, ?, ?)",
        [userId, orderId, "Thanh toán thành công! Đơn hàng đã được xác nhận và đang được chuẩn bị giao."]
      );
    }
  });
}

async function markOrderFailed(orderId) {
  await query(
    "UPDATE orders SET status = 'cancelled', payment_status = 'failed' WHERE id = ? AND status = 'awaiting_payment'",
    [orderId]
  );
}

function extractOrderId(vnpTxnRef) {
  return parseInt(String(vnpTxnRef).split("-")[0], 10);
}

// GET /api/payment/vnpay/vnpay-return
router.get("/vnpay/vnpay-return", async (req, res) => {
  const params = req.query;
  const orderId = extractOrderId(params.vnp_TxnRef);

  if (!verifyReturnUrl(params)) {
    return res.redirect(`${FRONTEND_URL}/vnpay-return?status=invalid&orderId=${orderId}`);
  }

  try {
    if (params.vnp_ResponseCode === "00") {
      await markOrderPaid(orderId);
      return res.redirect(
        `${FRONTEND_URL}/vnpay-return?status=success&orderId=${orderId}&amount=${Number(params.vnp_Amount) / 100}`
      );
    }
    await markOrderFailed(orderId);
    return res.redirect(`${FRONTEND_URL}/vnpay-return?status=failed&orderId=${orderId}`);
  } catch {
    return res.redirect(`${FRONTEND_URL}/vnpay-return?status=error&orderId=${orderId}`);
  }
});

// GET /api/payment/vnpay/vnpay-ipn
router.get("/vnpay/vnpay-ipn", async (req, res) => {
  const params = req.query;
  const orderId = extractOrderId(params.vnp_TxnRef);

  if (!verifyReturnUrl(params))
    return res.json({ RspCode: "97", Message: "Invalid signature" });

  try {
    const [orders] = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
    const order = orders[0];
    if (!order) return res.json({ RspCode: "01", Message: "Order not found" });

    if (Number(params.vnp_Amount) !== Math.round(order.total_amount) * 100)
      return res.json({ RspCode: "04", Message: "Invalid amount" });

    if (order.status !== "awaiting_payment")
      return res.json({ RspCode: "02", Message: "Order already confirmed" });

    if (params.vnp_ResponseCode === "00") await markOrderPaid(orderId);
    else await markOrderFailed(orderId);

    res.json({ RspCode: "00", Message: "Confirm Success" });
  } catch {
    res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

module.exports = router;
