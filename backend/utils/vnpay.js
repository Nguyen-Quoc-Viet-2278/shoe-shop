const crypto = require("crypto");
const querystring = require("qs");

const VNPAY_CONFIG = {
  tmnCode: process.env.VNPAY_TMN_CODE,
  hashSecret: process.env.VNPAY_HASH_SECRET,
  url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: process.env.VNPAY_RETURN_URL,
};

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

// Tạo URL thanh toán VNPAY. orderType "qr" hiển thị thẳng tab thanh toán bằng mã QR (VNPAYQR).
function createPaymentUrl({ orderId, amount, ipAddr, orderInfo, orderType = "other" }) {
  const date = new Date();
  const createDate = formatDate(date);

  let vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_CONFIG.tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: `${orderId}-${Date.now()}`,
    vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
    vnp_OrderType: orderType === "qr" ? "vnpayqr" : "other",
    vnp_Amount: Math.round(amount) * 100,
    vnp_ReturnUrl: VNPAY_CONFIG.returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  vnpParams = sortObject(vnpParams);

  const signData = querystring.stringify(vnpParams, { encode: false });
  const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.hashSecret);
  const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnpParams.vnp_SecureHash = secureHash;

  return `${VNPAY_CONFIG.url}?${querystring.stringify(vnpParams, { encode: false })}`;
}

// Kiểm tra checksum trả về từ VNPAY (return URL / IPN)
function verifyReturnUrl(query) {
  const vnpParams = { ...query };
  const secureHash = vnpParams.vnp_SecureHash;

  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  const sorted = sortObject(vnpParams);
  const signData = querystring.stringify(sorted, { encode: false });
  const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.hashSecret);
  const checkHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return checkHash === secureHash;
}

function formatDate(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

module.exports = { createPaymentUrl, verifyReturnUrl };
