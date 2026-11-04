const nodemailer = require("nodemailer");

function isMailConfigured() {
  const user = process.env.MAIL_USER || "";
  const pass = process.env.MAIL_PASS || "";

  return Boolean(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user) &&
    pass.trim() &&
    !/your_email|xxxx/i.test(user + pass)
  );
}

const transporter = isMailConfigured()
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    })
  : null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);
}

async function sendResetEmail(toEmail, otp, name) {
  const mailOptions = {
    from: `"LIZSHOOS" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: "Đặt lại mật khẩu LIZSHOOS",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h1 style="font-size:28px;font-weight:900;letter-spacing:4px;margin-bottom:8px">LIZSHOOS</h1>
        <p style="color:#666;margin-bottom:24px">Xin chào <strong>${name}</strong>,</p>
        <p style="color:#333;margin-bottom:16px">Mã OTP đặt lại mật khẩu của bạn:</p>
        <div style="background:#f5f5f5;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#000">${otp}</span>
        </div>
        <p style="color:#999;font-size:13px">Mã có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này với ai.</p>
        <p style="color:#ccc;font-size:12px;margin-top:32px">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
      </div>
    `,
  };

  if (!isMailConfigured()) {
    console.warn(`[MAIL] Chưa cấu hình Gmail app password. Thiết lập MAIL_USER và MAIL_PASS trong backend/.env để gửi OTP cho ${toEmail}.`);
    console.log(`[DEV] OTP cho ${toEmail}: ${otp}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("❌ Gửi email thất bại:", err.message);
    console.log(`[FALLBACK] OTP cho ${toEmail}: ${otp}`);
  }
}

async function sendOrderConfirmation(toEmail, order) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(toEmail || ""))) {
    throw new Error("Địa chỉ email nhận xác nhận không hợp lệ");
  }

  if (!isMailConfigured()) {
    console.warn(`[MAIL] Chưa cấu hình Gmail app password. Thiết lập MAIL_USER và MAIL_PASS trong backend/.env để gửi email đơn hàng #${order.orderId}.`);
    return { sent: false, reason: "not_configured" };
  }

  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px">${escapeHtml(item.product_name ?? item.name)}${item.size ? ` (Size ${escapeHtml(item.size)})` : ""}${item.color ? ` (${escapeHtml(item.color)})` : ""}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px">x${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px">${Number(item.price * item.quantity).toLocaleString("vi-VN")}₫</td>
    </tr>`).join("");

  const methodMap = { cod: "Thanh toán khi nhận hàng (COD)", bank: "Chuyển khoản ngân hàng", vnpay: "VNPay" };
  const methodLabel = methodMap[order.paymentMethod] || order.paymentMethod;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#111">
      <h1 style="font-size:28px;font-weight:900;letter-spacing:4px;margin-bottom:4px">LIZSHOOS</h1>
      <p style="color:#999;font-size:12px;margin-bottom:32px">Xác nhận đơn hàng</p>

      <div style="background:#f7f7f7;border-radius:16px;padding:20px 24px;margin-bottom:24px">
        <p style="font-size:12px;color:#999;margin:0 0 4px">MÃ ĐƠN HÀNG</p>
        <p style="font-size:22px;font-weight:900;margin:0">#${order.orderId}</p>
      </div>

      <p style="font-size:14px;color:#555;margin-bottom:24px">
        Xin chào <strong>${escapeHtml(order.name)}</strong>, đơn hàng của bạn đã được đặt thành công!<br/>
        Chúng tôi sẽ liên hệ qua số <strong>${escapeHtml(order.phone)}</strong> để xác nhận giao hàng.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr>
            <th style="text-align:left;font-size:10px;letter-spacing:2px;color:#999;padding-bottom:8px;border-bottom:2px solid #eee">SẢN PHẨM</th>
            <th style="text-align:center;font-size:10px;letter-spacing:2px;color:#999;padding-bottom:8px;border-bottom:2px solid #eee">SL</th>
            <th style="text-align:right;font-size:10px;letter-spacing:2px;color:#999;padding-bottom:8px;border-bottom:2px solid #eee">GIÁ</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="text-align:right;margin-bottom:24px">
        <p style="font-size:20px;font-weight:900;margin:0">Tổng: ${Number(order.total).toLocaleString("vi-VN")}₫</p>
      </div>

      <div style="background:#f7f7f7;border-radius:12px;padding:16px 20px;font-size:13px;color:#555;line-height:1.7;margin-bottom:24px">
        <p style="margin:0"><strong>Địa chỉ giao hàng:</strong> ${escapeHtml(order.address)}</p>
        <p style="margin:0"><strong>Phương thức thanh toán:</strong> ${escapeHtml(methodLabel)}</p>
      </div>

      <p style="color:#ccc;font-size:12px;margin-top:32px">
        Nếu bạn có thắc mắc, vui lòng liên hệ LIZSHOOS qua email hoặc hotline.<br/>
        Cảm ơn bạn đã mua sắm tại LIZSHOOS!
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"LIZSHOOS" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: `LIZSHOOS — Xác nhận đơn hàng #${order.orderId}`,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error(`❌ Gửi email đơn hàng #${order.orderId} thất bại:`, err.message);
    return { sent: false, reason: "delivery_failed" };
  }
}

module.exports = { sendResetEmail, sendOrderConfirmation };
