const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

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

  const userOk = process.env.MAIL_USER && !process.env.MAIL_USER.includes("gmail_cua_ban") && process.env.MAIL_USER.includes("@");
  const passOk = process.env.MAIL_PASS && !process.env.MAIL_PASS.includes("xxxx");

  if (!userOk || !passOk) {
    console.log(`[DEV] Chưa cấu hình MAIL_USER/MAIL_PASS — OTP cho ${toEmail}: ${otp}`);
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
  const userOk = process.env.MAIL_USER && !process.env.MAIL_USER.includes("gmail_cua_ban") && process.env.MAIL_USER.includes("@");
  const passOk = process.env.MAIL_PASS && !process.env.MAIL_PASS.includes("xxxx");

  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px">${item.product_name ?? item.name}${item.size ? ` (Size ${item.size})` : ""}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px">x${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px">${Number(item.price * item.quantity).toLocaleString("vi-VN")}₫</td>
    </tr>`).join("");

  const methodMap = { cod: "Thanh toán khi nhận hàng (COD)", bank: "Chuyển khoản ngân hàng", momo: "MoMo", vnpay: "VNPay" };
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
        Xin chào <strong>${order.name}</strong>, đơn hàng của bạn đã được đặt thành công!<br/>
        Chúng tôi sẽ liên hệ qua số <strong>${order.phone}</strong> để xác nhận giao hàng.
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
        <p style="margin:0"><strong>Địa chỉ giao hàng:</strong> ${order.address}</p>
        <p style="margin:0"><strong>Phương thức thanh toán:</strong> ${methodLabel}</p>
      </div>

      <p style="color:#ccc;font-size:12px;margin-top:32px">
        Nếu bạn có thắc mắc, vui lòng liên hệ LIZSHOOS qua email hoặc hotline.<br/>
        Cảm ơn bạn đã mua sắm tại LIZSHOOS!
      </p>
    </div>
  `;

  if (!userOk || !passOk) {
    console.log(`[DEV] Email xác nhận đơn #${order.orderId} → ${toEmail}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"LIZSHOOS" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: `LIZSHOOS — Xác nhận đơn hàng #${order.orderId}`,
      html,
    });
  } catch (err) {
    console.error("❌ Gửi email đơn hàng thất bại:", err.message);
  }
}

module.exports = { sendResetEmail, sendOrderConfirmation };
