import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { submitOrder } from "../hooks/useProducts";
import { API_URL } from "../lib/config";

const BANK_INFO = {
  bankName: "Vietcombank",
  accountNumber: "1234567890",
  accountHolder: "LIZSHOOS STORE",
  branch: "Chi nhánh TP.HCM",
};

const MOMO_INFO = {
  phone: "0901 234 567",
  name: "LIZSHOOS STORE",
};

function InputField({ label, name, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition placeholder:text-gray-300"
      />
    </div>
  );
}

export default function ThanhToan() {
  const { cart, total, clearCart } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState("cod"); // "cod" | "bank" | "momo" | "vnpay"
  const [vnpayQr, setVnpayQr] = useState(false);
  const [form, setForm] = useState({
    name: user?.full_name || "",
    phone: user?.phone || "",
    detailAddress: "",
    provinceCode: "",
    provinceName: "",
    wardCode: "",
    wardName: "",
    email: user?.email || "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(false);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/v2/p/")
      .then((res) => res.json())
      .then(setProvinces)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.provinceCode) { setWards([]); return; }
    setWardsLoading(true);
    fetch(`https://provinces.open-api.vn/api/v2/p/${form.provinceCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => setWards(data.wards || []))
      .catch(() => setWards([]))
      .finally(() => setWardsLoading(false));
  }, [form.provinceCode]);

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const p = provinces.find((p) => String(p.code) === code);
    setForm((prev) => ({
      ...prev,
      provinceCode: code,
      provinceName: p?.name || "",
      wardCode: "",
      wardName: "",
    }));
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const w = wards.find((w) => String(w.code) === code);
    setForm((prev) => ({ ...prev, wardCode: code, wardName: w?.name || "" }));
  };
  const [done, setDone] = useState(false);
  const [doneOrderId, setDoneOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [copied, setCopied] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const shippingFee = 30000;
  const discount = coupon?.discount ?? 0;
  const grandTotal = total + shippingFee - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCoupon(null);
    try {
      const res = await fetch(`${API_URL}/coupons/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, orderTotal: total }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupon(data.coupon);
    } catch (err) {
      setCouponError(err.message);
    } finally { setCouponLoading(false); }
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Vui lòng nhập họ tên";
    if (!form.phone.trim()) err.phone = "Vui lòng nhập số điện thoại";
    else if (!/^0\d{9}$/.test(form.phone.replace(/\s/g, "")))
      err.phone = "Số điện thoại không hợp lệ";
    if (!form.provinceCode) err.provinceCode = "Vui lòng chọn tỉnh/thành phố";
    if (!form.wardCode) err.wardCode = "Vui lòng chọn phường/xã";
    if (!form.detailAddress.trim()) err.detailAddress = "Vui lòng nhập số nhà, đường";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fullAddress = `${form.detailAddress.trim()}, ${form.wardName}, ${form.provinceName}`;
      const data = await submitOrder({
        name: form.name,
        phone: form.phone,
        address: fullAddress,
        email: form.email || null,
        paymentMethod: method,
        items: cart,
        total: grandTotal,
        couponCode: coupon?.code ?? null,
      }, token);
      if (coupon?.code) {
        fetch(`${API_URL}/coupons/use`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: coupon.code }),
        }).catch(() => {});
      }
      clearCart?.();

      // VNPay: tạo URL thanh toán thật và chuyển hướng sang cổng VNPAY
      if (data.requiresPayment && method === "vnpay") {
        const vnpRes = await fetch(`${API_URL}/payment/vnpay/create-payment-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderId, qr: vnpayQr }),
        });
        const vnpData = await vnpRes.json();
        if (!vnpRes.ok || !vnpData.paymentUrl) throw new Error(vnpData.error || "Không thể tạo thanh toán VNPay");
        window.location.href = vnpData.paymentUrl;
        return;
      }

      // Online payment khác (MoMo demo): redirect to gateway page
      if (data.requiresPayment && data.paymentUrl) {
        navigate(data.paymentUrl);
        return;
      }

      setDoneOrderId(data.orderId);
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (cart.length === 0 && !done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="font-hero text-6xl text-gray-200">GIỎ TRỐNG</p>
        <Link to="/" className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:opacity-75 transition">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  /* ── Success screen (COD / bank) ── */
  if (done) {
    const isCod = method === "cod";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Icon */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl mb-6 ${isCod ? "bg-yellow-400" : "bg-black"}`}>
          {isCod ? "🕐" : "✓"}
        </div>

        <h1 className="text-4xl font-black mb-2">
          {isCod ? "Đơn hàng đang chờ xác nhận" : "Đặt hàng thành công!"}
        </h1>
        <p className="text-gray-400 text-sm mb-1">
          Mã đơn hàng: <strong>#{doneOrderId}</strong>
        </p>
        <p className="text-gray-400 text-sm mb-8">
          {isCod
            ? "Nhân viên sẽ liên hệ để xác nhận đơn hàng của bạn."
            : "Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán."
          }
        </p>

        <div className="bg-gray-50 rounded-3xl p-6 max-w-sm w-full text-left mb-8 space-y-3">
          {isCod ? (
            <>
              <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400">Thanh toán khi nhận hàng</p>
              <p className="text-sm text-gray-600">Bạn sẽ thanh toán <strong>{grandTotal.toLocaleString("vi-VN")}₫</strong> khi nhận được hàng.</p>
              <p className="text-sm text-gray-600">SĐT xác nhận: <strong>{form.phone}</strong></p>
            </>
          ) : (
            <>
              <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400">Thông tin chuyển khoản</p>
              <p className="font-bold">{BANK_INFO.bankName}</p>
              <p className="text-sm text-gray-500">STK: <strong>{BANK_INFO.accountNumber}</strong></p>
              <p className="text-sm text-gray-500">Chủ TK: {BANK_INFO.accountHolder}</p>
              <p className="text-sm text-gray-500">Nội dung: <strong>LIZSHOOS {form.phone.replace(/\s/g, "")}</strong></p>
              <p className="text-xs text-yellow-600 bg-yellow-50 rounded-xl px-3 py-2 border border-yellow-100">
                ⚠ Đơn sẽ được xác nhận trong vòng 30 phút sau khi chuyển khoản.
              </p>
            </>
          )}
          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-black">Tổng: {grandTotal.toLocaleString("vi-VN")}₫</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            to="/don-hang"
            className="px-8 py-4 rounded-2xl font-bold text-sm text-white bg-black hover:opacity-80 transition tracking-widest uppercase"
          >
            Xem đơn hàng
          </Link>
          <Link
            to="/"
            className="px-8 py-4 rounded-2xl font-bold text-sm border-2 border-gray-200 hover:border-black transition tracking-widest uppercase"
          >
            Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main page ── */
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link to="/cart" className="text-sm text-gray-400 hover:text-black transition">
          ← Quay lại giỏ hàng
        </Link>
        <p className="font-hero text-2xl tracking-widest">LIZSHOOS</p>
        <div />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-[1fr_380px] gap-12">

          {/* ── LEFT ── */}
          <div className="space-y-10">
            {/* Customer info */}
            <div>
              <h2 className="text-3xl font-black mb-6">Thông tin nhận hàng</h2>
              <div className="space-y-4">
                <InputField label="Họ và tên" name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Văn A" required />
                {errors.name && <p className="text-red-400 text-xs -mt-2">{errors.name}</p>}

                <InputField label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} placeholder="0901 234 567" required />
                {errors.phone && <p className="text-red-400 text-xs -mt-2">{errors.phone}</p>}

                <div>
                  <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">
                    Email nhận xác nhận đơn hàng
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition placeholder:text-gray-300"
                  />
                  <p className="text-[10px] text-gray-300 mt-1.5">Chúng tôi sẽ gửi thông tin đơn hàng về địa chỉ này</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">
                      Tỉnh/Thành phố <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.provinceCode}
                      onChange={handleProvinceChange}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition bg-white"
                    >
                      <option value="">Chọn tỉnh/thành</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                    {errors.provinceCode && <p className="text-red-400 text-xs mt-1">{errors.provinceCode}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">
                      Phường/Xã <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.wardCode}
                      onChange={handleWardChange}
                      disabled={!form.provinceCode || wardsLoading}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition bg-white disabled:opacity-50"
                    >
                      <option value="">{wardsLoading ? "Đang tải..." : "Chọn phường/xã"}</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                      ))}
                    </select>
                    {errors.wardCode && <p className="text-red-400 text-xs mt-1">{errors.wardCode}</p>}
                  </div>
                </div>

                <InputField label="Số nhà, đường" name="detailAddress" value={form.detailAddress} onChange={handleChange} placeholder="Số nhà, tên đường" required />
                {errors.detailAddress && <p className="text-red-400 text-xs -mt-2">{errors.detailAddress}</p>}

                <div>
                  <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">
                    Ghi chú
                  </label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    placeholder="Ghi chú thêm (không bắt buộc)..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition placeholder:text-gray-300 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <h2 className="text-3xl font-black mb-6">Phương thức thanh toán</h2>

              {/* Method selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* COD */}
                <button type="button" onClick={() => setMethod("cod")}
                  className={`border-2 rounded-2xl p-4 text-left transition ${method === "cod" ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400"}`}>
                  <div className="text-xl mb-1.5">🚚</div>
                  <p className="font-bold text-sm">Nhận hàng trả tiền</p>
                  <p className={`text-xs mt-0.5 ${method === "cod" ? "text-gray-300" : "text-gray-400"}`}>COD</p>
                </button>

                {/* Bank */}
                <button type="button" onClick={() => setMethod("bank")}
                  className={`border-2 rounded-2xl p-4 text-left transition ${method === "bank" ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400"}`}>
                  <div className="text-xl mb-1.5">🏦</div>
                  <p className="font-bold text-sm">Ngân hàng</p>
                  <p className={`text-xs mt-0.5 ${method === "bank" ? "text-gray-300" : "text-gray-400"}`}>Chuyển khoản</p>
                </button>

                {/* MoMo */}
                <button type="button" onClick={() => setMethod("momo")}
                  className={`border-2 rounded-2xl p-4 text-left transition ${method === "momo" ? "border-[#ae2070] bg-[#ae2070] text-white" : "border-gray-200 hover:border-gray-400"}`}>
                  <div className="text-xl mb-1.5">💜</div>
                  <p className="font-bold text-sm">MoMo</p>
                  <p className={`text-xs mt-0.5 ${method === "momo" ? "text-pink-200" : "text-gray-400"}`}>Online · Tự động xác nhận</p>
                </button>

                {/* VNPay */}
                <button type="button" onClick={() => setMethod("vnpay")}
                  className={`border-2 rounded-2xl p-4 text-left transition ${method === "vnpay" ? "border-[#e31837] bg-[#e31837] text-white" : "border-gray-200 hover:border-gray-400"}`}>
                  <div className="text-xl mb-1.5">💳</div>
                  <p className="font-bold text-sm">VNPay</p>
                  <p className={`text-xs mt-0.5 ${method === "vnpay" ? "text-red-200" : "text-gray-400"}`}>Online · Tự động xác nhận</p>
                </button>
              </div>

              {/* COD info */}
              {method === "cod" && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-3xl p-5 space-y-2">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-yellow-600">Thanh toán khi nhận hàng</p>
                  <p className="text-sm text-gray-600">Bạn chỉ thanh toán khi nhận được hàng tại địa chỉ đã cung cấp.</p>
                  <p className="text-xs text-yellow-700 bg-yellow-100 rounded-xl px-3 py-2">
                    ⚠ Đơn hàng sẽ chờ admin xác nhận trước khi giao.
                  </p>
                </div>
              )}

              {/* Online payment notice */}
              {(method === "momo" || method === "vnpay") && (
                <div className={`rounded-3xl p-5 space-y-2 ${method === "momo" ? "bg-pink-50 border border-pink-100" : "bg-red-50 border border-red-100"}`}>
                  <p className={`text-[10px] tracking-[0.3em] uppercase ${method === "momo" ? "text-[#ae2070]" : "text-[#e31837]"}`}>
                    Thanh toán online — Tự động xác nhận
                  </p>
                  <p className="text-sm text-gray-600">
                    Sau khi đặt hàng, bạn sẽ được chuyển đến cổng thanh toán {method === "momo" ? "MoMo" : "VNPay"}.
                  </p>
                  <p className="text-xs text-gray-500">✓ Đơn hàng tự xác nhận ngay sau khi thanh toán thành công.</p>

                  {method === "vnpay" && (
                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVnpayQr(false)}
                        className={`flex-1 text-xs font-bold py-2.5 rounded-xl border-2 transition ${!vnpayQr ? "border-[#e31837] bg-[#e31837] text-white" : "border-gray-200 text-gray-500"}`}
                      >
                        💳 Thẻ / Tài khoản
                      </button>
                      <button
                        type="button"
                        onClick={() => setVnpayQr(true)}
                        className={`flex-1 text-xs font-bold py-2.5 rounded-xl border-2 transition ${vnpayQr ? "border-[#e31837] bg-[#e31837] text-white" : "border-gray-200 text-gray-500"}`}
                      >
                        📱 Mã QR
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Bank detail */}
              {method === "bank" && (
                <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400">
                    Thông tin chuyển khoản
                  </p>
                  {[
                    { label: "Ngân hàng", value: BANK_INFO.bankName, key: "bank" },
                    { label: "Số tài khoản", value: BANK_INFO.accountNumber, key: "acc" },
                    { label: "Chủ tài khoản", value: BANK_INFO.accountHolder, key: "holder" },
                    {
                      label: "Nội dung CK",
                      value: `LIZSHOOS ${form.phone.replace(/\s/g, "") || "SĐT của bạn"}`,
                      key: "content",
                    },
                  ].map(({ label, value, key }) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{label}</p>
                        <p className="font-bold text-sm">{value}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copy(value, key)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition shrink-0 ${
                          copied === key
                            ? "bg-black text-white border-black"
                            : "border-gray-300 text-gray-500 hover:border-black hover:text-black"
                        }`}
                      >
                        {copied === key ? "✓ Đã copy" : "Copy"}
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">
                    * Vui lòng chuyển khoản đúng nội dung để đơn hàng được xử lý nhanh nhất.
                  </p>
                </div>
              )}

              {/* MoMo detail */}
              {method === "momo" && (
                <div className="bg-[#ae2070]/5 border border-[#ae2070]/20 rounded-3xl p-6">
                  <div className="flex gap-6 items-center">
                    {/* QR placeholder */}
                    <div className="w-28 h-28 rounded-2xl bg-white border-2 border-[#ae2070]/30 flex flex-col items-center justify-center shrink-0 text-center p-2">
                      <p className="text-3xl mb-1">💜</p>
                      <p className="text-[9px] text-[#ae2070] font-bold">MoMo QR</p>
                    </div>

                    <div className="space-y-3 flex-1">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-[#ae2070]">
                        Thông tin MoMo
                      </p>
                      {[
                        { label: "Số điện thoại", value: MOMO_INFO.phone, key: "mphone" },
                        { label: "Tên tài khoản", value: MOMO_INFO.name, key: "mname" },
                        {
                          label: "Nội dung",
                          value: `LIZSHOOS ${form.phone.replace(/\s/g, "") || "SĐT của bạn"}`,
                          key: "mcontent",
                        },
                      ].map(({ label, value, key }) => (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">{label}</p>
                            <p className="font-bold text-sm">{value}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copy(value, key)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition shrink-0 ${
                              copied === key
                                ? "bg-[#ae2070] text-white border-[#ae2070]"
                                : "border-gray-300 text-gray-500 hover:border-[#ae2070] hover:text-[#ae2070]"
                            }`}
                          >
                            {copied === key ? "✓ Đã copy" : "Copy"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-[#ae2070]/20">
                    * Quét QR hoặc chuyển đến số MoMo trên. Ghi đúng nội dung chuyển tiền.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Order summary ── */}
          <div>
            <div className="sticky top-6">
              <h2 className="text-3xl font-black mb-6">Đơn hàng</h2>

              <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
                {/* Items */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        <p className="text-gray-400 text-xs">
                          x{item.quantity}{item.size && ` · Size ${item.size}`}
                        </p>
                      </div>
                      <p className="font-bold text-sm shrink-0">
                        {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t border-gray-200 pt-4">
                  {coupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-green-700">{coupon.code}</p>
                        <p className="text-[10px] text-green-600">
                          Giảm {coupon.discount_type === "percent" ? `${coupon.discount_value}%` : ""} — {coupon.discount.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                      <button onClick={() => { setCoupon(null); setCouponCode(""); }}
                        className="text-xs text-gray-400 hover:text-red-500 transition">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                        placeholder="MÃ GIẢM GIÁ"
                        className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold tracking-widest outline-none focus:border-black transition placeholder:text-gray-300 placeholder:tracking-widest" />
                      <button onClick={handleApplyCoupon} disabled={couponLoading}
                        className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl hover:opacity-75 transition disabled:opacity-50 shrink-0">
                        {couponLoading ? "..." : "Áp dụng"}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-red-400 text-xs mt-2">{couponError}</p>}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tạm tính</span>
                    <span>{total.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Phí vận chuyển</span>
                    <span>{shippingFee.toLocaleString("vi-VN")}₫</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-sm text-green-600 font-semibold">
                      <span>Giảm giá ({coupon.code})</span>
                      <span>-{discount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-lg border-t border-gray-200 pt-3 mt-3">
                    <span>Tổng cộng</span>
                    <span>{grandTotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>

                {/* Submit */}
                {submitError && (
                  <p className="text-red-400 text-xs text-center">{submitError}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold text-sm tracking-widest uppercase hover:opacity-80 transition mt-2 disabled:opacity-50"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng →"}
                </button>
                <p className="text-[10px] text-gray-400 text-center">
                  Bằng cách đặt hàng, bạn đồng ý với điều khoản của chúng tôi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
