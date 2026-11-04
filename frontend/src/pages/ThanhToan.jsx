import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

function InputField({ label, name, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a706a]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} className="soft-input" />
    </div>
  );
}

export default function ThanhToan() {
  const { cart, total, clearCart } = useCart();
  const { token, user } = useAuth();

  const [method, setMethod] = useState("cod");
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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [submitError, setSubmitError] = useState(null);

  const selectedAddress = savedAddresses.find((address) => String(address.id) === selectedAddressId);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/v2/p/")
      .then((res) => res.json())
      .then(setProvinces)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/addresses`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không thể tải địa chỉ đã lưu");
        setSavedAddresses(data);
        const defaultAddress = data.find((address) => address.is_default);
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          setForm((prev) => ({
            ...prev,
            name: defaultAddress.full_name,
            phone: defaultAddress.phone,
          }));
        }
      })
      .catch((err) => setSubmitError(err.message));
  }, [token]);

  useEffect(() => {
    if (!form.provinceCode) return;
    fetch(`https://provinces.open-api.vn/api/v2/p/${form.provinceCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => setWards(data.wards || []))
      .catch(() => setWards([]))
      .finally(() => setWardsLoading(false));
  }, [form.provinceCode]);

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const p = provinces.find((p) => String(p.code) === code);
    setWardsLoading(Boolean(code));
    setForm((prev) => ({
      ...prev,
      provinceCode: code,
      provinceName: p?.name || "",
      wardCode: "",
      wardName: "",
    }));
    setWards([]);
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const w = wards.find((w) => String(w.code) === code);
    setForm((prev) => ({ ...prev, wardCode: code, wardName: w?.name || "" }));
  };
  const [done, setDone] = useState(false);
  const [doneOrderId, setDoneOrderId] = useState(null);
  const [doneTotal, setDoneTotal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState(null);
  const [availableCouponsTotal, setAvailableCouponsTotal] = useState(null);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState(null);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);

  const shippingFee = 30000;
  const discount = coupon?.discount ?? 0;
  const grandTotal = total + shippingFee - discount;

  const handleApplyCoupon = async (code = couponCode) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return;
    setCouponLoading(true);
    setCouponError(null);
    setCoupon(null);
    try {
      const res = await fetch(`${API_URL}/coupons/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode, orderTotal: total }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupon(data.coupon);
      setCouponCode(normalizedCode);
    } catch (err) {
      setCouponError(err.message);
    } finally { setCouponLoading(false); }
  };

  const loadAvailableCoupons = async () => {
    setShowAvailableCoupons((open) => !open);
    if (availableCoupons && availableCouponsTotal === total) return;
    setCouponsLoading(true);
    setCouponsError(null);
    try {
      const res = await fetch(`${API_URL}/coupons/available?orderTotal=${total}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải mã giảm giá");
      setAvailableCoupons(data);
      setAvailableCouponsTotal(total);
    } catch (err) {
      setCouponsError(err.message);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleChange = (e) => {
    if (["name", "phone"].includes(e.target.name)) setSelectedAddressId("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Vui lòng nhập họ tên";
    if (!form.phone.trim()) err.phone = "Vui lòng nhập số điện thoại";
    else if (!/^0\d{9}$/.test(form.phone.replace(/\s/g, ""))) err.phone = "Số điện thoại không hợp lệ";
    if (!selectedAddress) {
      if (!form.provinceCode) err.provinceCode = "Vui lòng chọn tỉnh/thành phố";
      if (!form.wardCode) err.wardCode = "Vui lòng chọn phường/xã";
      if (!form.detailAddress.trim()) err.detailAddress = "Vui lòng nhập số nhà, đường";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fullAddress = selectedAddress?.address ||
        `${form.detailAddress.trim()}, ${form.wardName}, ${form.provinceName}`;
      const data = await submitOrder({
        name: form.name,
        phone: form.phone,
        address: fullAddress,
        email: form.email || null,
        paymentMethod: method,
        items: cart,
        total: grandTotal,
        originalTotal: total,
        couponCode: coupon?.code ?? null,
      }, token);
      clearCart?.();
      setDoneTotal(Number(data.totalAmount));

      if (method === "vnpay") {
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
      <div className="page-shell flex min-h-screen flex-col items-center justify-center gap-6">
        <p className="font-hero text-6xl text-[#d8d0c7] md:text-[7rem]">GIỎ TRỐNG</p>
        <Link to="/" className="primary-btn px-8 py-3.5 text-[10px]">← Về trang chủ</Link>
      </div>
    );
  }

  if (done) {
    const isCod = method === "cod";
    return (
      <div className="page-shell flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full text-3xl text-white ${isCod ? "bg-[#caa156]" : "bg-[#1b1714]"}`}>
          {isCod ? "🕐" : "✓"}
        </div>

        <h1 className="mb-2 font-hero text-5xl text-[#1b1714]">{isCod ? "Đơn hàng đang chờ xác nhận" : "Đặt hàng thành công!"}</h1>
        <p className="mb-1 text-sm text-[#7a706a]">Mã đơn hàng: <strong>#{doneOrderId}</strong></p>
        <p className="mb-8 text-sm text-[#7a706a]">{isCod ? "Nhân viên sẽ liên hệ để xác nhận đơn hàng của bạn." : "Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán."}</p>

        <div className="soft-card mb-8 w-full max-w-sm space-y-3 rounded-[28px] p-6 text-left">
          {isCod ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#8b8178]">Thanh toán khi nhận hàng</p>
              <p className="text-sm text-[#5d5752]">Bạn sẽ thanh toán <strong>{(doneTotal ?? grandTotal).toLocaleString("vi-VN")}₫</strong> khi nhận được hàng.</p>
              <p className="text-sm text-[#5d5752]">SĐT xác nhận: <strong>{form.phone}</strong></p>
            </>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#8b8178]">Thông tin chuyển khoản</p>
              <p className="font-bold text-[#1b1714]">{BANK_INFO.bankName}</p>
              <p className="text-sm text-[#5d5752]">STK: <strong>{BANK_INFO.accountNumber}</strong></p>
              <p className="text-sm text-[#5d5752]">Chủ TK: {BANK_INFO.accountHolder}</p>
              <p className="text-sm text-[#5d5752]">Nội dung: <strong>LIZSHOOS {form.phone.replace(/\s/g, "")}</strong></p>
              <p className="rounded-xl border border-[#f0dbab] bg-[#fff8eb] px-3 py-2 text-xs text-[#8a5c19]">⚠ Đơn sẽ được xác nhận trong vòng 30 phút sau khi chuyển khoản.</p>
            </>
          )}
          <div className="border-t border-[#efe5d8] pt-3">
            <p className="text-sm font-black text-[#1b1714]">Tổng: {(doneTotal ?? grandTotal).toLocaleString("vi-VN")}₫</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/don-hang" className="primary-btn px-8 py-4 text-[10px]">Xem đơn hàng</Link>
          <Link to="/" className="secondary-btn px-8 py-4 text-[10px]">Trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/cart" className="text-sm text-[#7a706a] hover:text-[#1b1714]">← Quay lại giỏ hàng</Link>
        <p className="font-hero text-3xl tracking-[0.2em] text-[#1b1714]">LIZSHOOS</p>
        <div />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            <div>
              <h2 className="mb-6 font-hero text-4xl text-[#1b1714]">Thông tin nhận hàng</h2>
              <div className="space-y-4">
                <InputField label="Họ và tên" name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Văn A" required />
                {errors.name && <p className="-mt-2 text-xs text-red-500">{errors.name}</p>}

                <InputField label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} placeholder="0901 234 567" required />
                {errors.phone && <p className="-mt-2 text-xs text-red-500">{errors.phone}</p>}

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a706a]">Email nhận xác nhận đơn hàng</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@email.com" className="soft-input" />
                  <p className="mt-1.5 text-[10px] text-[#a29a92]">Chúng tôi sẽ gửi thông tin đơn hàng về địa chỉ này</p>
                </div>

                {savedAddresses.length > 0 && (
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a706a]">Địa chỉ đã lưu</label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => {
                        const address = savedAddresses.find((item) => String(item.id) === e.target.value);
                        setSelectedAddressId(e.target.value);
                        if (address) setForm((prev) => ({ ...prev, name: address.full_name, phone: address.phone }));
                      }}
                      className="soft-input appearance-none"
                    >
                      <option value="">Nhập địa chỉ mới</option>
                      {savedAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.full_name} · {address.phone} · {address.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!selectedAddress && <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a706a]">Tỉnh/Thành phố <span className="text-red-400">*</span></label>
                    <select value={form.provinceCode} onChange={handleProvinceChange} className="soft-input appearance-none">
                      <option value="">Chọn tỉnh/thành</option>
                      {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>
                    {errors.provinceCode && <p className="mt-1 text-xs text-red-500">{errors.provinceCode}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a706a]">Phường/Xã <span className="text-red-400">*</span></label>
                    <select value={form.wardCode} onChange={handleWardChange} disabled={!form.provinceCode || wardsLoading} className="soft-input appearance-none disabled:opacity-50">
                      <option value="">{wardsLoading ? "Đang tải..." : "Chọn phường/xã"}</option>
                      {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
                    </select>
                    {errors.wardCode && <p className="mt-1 text-xs text-red-500">{errors.wardCode}</p>}
                  </div>
                </div>}

                {!selectedAddress && <InputField label="Số nhà, đường" name="detailAddress" value={form.detailAddress} onChange={handleChange} placeholder="Số nhà, tên đường" required />}
                {errors.detailAddress && <p className="-mt-2 text-xs text-red-500">{errors.detailAddress}</p>}

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a706a]">Ghi chú</label>
                  <textarea name="note" value={form.note} onChange={handleChange} placeholder="Ghi chú thêm (không bắt buộc)..." rows={3} className="soft-input resize-none" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-6 font-hero text-4xl text-[#1b1714]">Phương thức thanh toán</h2>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setMethod("cod")} className={`rounded-[24px] border-2 p-4 text-left transition ${method === "cod" ? "border-[#1b1714] bg-[#1b1714] text-white" : "border-[#e8dcca] bg-white hover:border-[#1b1714]"}`}>
                  <div className="mb-1.5 text-xl">🚚</div>
                  <p className="text-sm font-bold">Nhận hàng trả tiền</p>
                  <p className={`mt-0.5 text-xs ${method === "cod" ? "text-[#ddd0bf]" : "text-[#8b8178]"}`}>COD</p>
                </button>

                <button type="button" onClick={() => setMethod("bank")} className={`rounded-[24px] border-2 p-4 text-left transition ${method === "bank" ? "border-[#1b1714] bg-[#1b1714] text-white" : "border-[#e8dcca] bg-white hover:border-[#1b1714]"}`}>
                  <div className="mb-1.5 text-xl">🏦</div>
                  <p className="text-sm font-bold">Ngân hàng</p>
                  <p className={`mt-0.5 text-xs ${method === "bank" ? "text-[#ddd0bf]" : "text-[#8b8178]"}`}>Chuyển khoản</p>
                </button>

                <button type="button" onClick={() => setMethod("vnpay")} className={`rounded-[24px] border-2 p-4 text-left transition ${method === "vnpay" ? "border-[#e31837] bg-[#e31837] text-white" : "border-[#e8dcca] bg-white hover:border-[#e31837]"}`}>
                  <div className="mb-1.5 text-xl">💳</div>
                  <p className="text-sm font-bold">VNPay</p>
                  <p className={`mt-0.5 text-xs ${method === "vnpay" ? "text-[#f9d0d8]" : "text-[#8b8178]"}`}>Online · Tự động xác nhận</p>
                </button>
              </div>

              {method === "cod" && (
                <div className="rounded-[28px] border border-[#f3e4b7] bg-[#fffaf0] p-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#b67a1b]">Thanh toán khi nhận hàng</p>
                  <p className="mt-2 text-sm text-[#5d5752]">Bạn chỉ thanh toán khi nhận được hàng tại địa chỉ đã cung cấp.</p>
                  <p className="mt-3 rounded-xl bg-[#fdf0d8] px-3 py-2 text-xs text-[#8a5c19]">⚠ Đơn hàng sẽ chờ admin xác nhận trước khi giao.</p>
                </div>
              )}

              {method === "vnpay" && (
                <div className="rounded-[28px] border border-[#f8d2d9] bg-[#fff5f5] p-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#e31837]">Thanh toán trực tuyến VNPay</p>
                  <p className="mt-2 text-sm text-[#5d5752]">Sau khi đặt hàng, bạn sẽ được chuyển đến cổng thanh toán VNPay.</p>
                  <p className="mt-3 text-xs text-[#7a706a]">✓ Đơn hàng tự xác nhận ngay sau khi thanh toán thành công.</p>

                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => setVnpayQr(false)} className={`flex-1 rounded-xl border-2 py-2.5 text-xs font-bold transition ${!vnpayQr ? "border-[#e31837] bg-[#e31837] text-white" : "border-[#e8dcca] text-[#5f5851]"}`}>💳 Thẻ / Tài khoản</button>
                    <button type="button" onClick={() => setVnpayQr(true)} className={`flex-1 rounded-xl border-2 py-2.5 text-xs font-bold transition ${vnpayQr ? "border-[#e31837] bg-[#e31837] text-white" : "border-[#e8dcca] text-[#5f5851]"}`}>📱 Mã QR</button>
                  </div>
                </div>
              )}

              {method === "bank" && (
                <div className="mt-5 rounded-[28px] bg-[#f8f5f2] p-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#8b8178]">Thông tin chuyển khoản</p>
                  {[
                    { label: "Ngân hàng", value: BANK_INFO.bankName, key: "bank" },
                    { label: "Số tài khoản", value: BANK_INFO.accountNumber, key: "acc" },
                    { label: "Chủ tài khoản", value: BANK_INFO.accountHolder, key: "holder" },
                    { label: "Nội dung CK", value: `LIZSHOOS ${form.phone.replace(/\s/g, "") || "SĐT của bạn"}`, key: "content" },
                  ].map(({ label, value, key }) => (
                    <div key={key} className="mt-4 flex items-center justify-between gap-4 border-b border-[#e9dfd4] pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#8b8178]">{label}</p>
                        <p className="mt-1 text-sm font-bold text-[#1b1714]">{value}</p>
                      </div>
                      <button type="button" onClick={() => copy(value, key)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${copied === key ? "border-[#1b1714] bg-[#1b1714] text-white" : "border-[#cfc2b4] text-[#5f5851] hover:border-[#1b1714] hover:text-[#1b1714]"}`}>
                        {copied === key ? "✓ Đã copy" : "Copy"}
                      </button>
                    </div>
                  ))}
                  <p className="mt-4 border-t border-[#e9dfd4] pt-3 text-xs text-[#7a706a]">* Vui lòng chuyển khoản đúng nội dung để đơn hàng được xử lý nhanh nhất.</p>
                </div>
              )}

            </div>
          </div>

          <div>
            <div className="sticky top-6">
              <h2 className="mb-6 font-hero text-4xl text-[#1b1714]">Đơn hàng</h2>

              <div className="soft-card rounded-[30px] p-6">
                <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[18px] bg-white">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1b1714]">{item.name}</p>
                        <p className="text-xs text-[#8b8178]">x{item.quantity}{item.size && ` · Size ${item.size}`}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-[#1b1714]">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-[#efe5d8] pt-4">
                  {coupon ? (
                    <div className="flex items-center justify-between rounded-[18px] border border-[#cce8d6] bg-[#f3fbf6] px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-[#1d7a47]">{coupon.code}</p>
                        <p className="text-[10px] text-[#2d8a5a]">Giảm {coupon.discount_type === "percent" ? `${coupon.discount_value}%` : ""} — {coupon.discount.toLocaleString("vi-VN")}₫</p>
                      </div>
                      <button onClick={() => { setCoupon(null); setCouponCode(""); }} className="text-xs text-[#8b8178] hover:text-red-500">✕</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          value={couponCode}
                          onChange={e => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCoupon(null);
                            setCouponError(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleApplyCoupon();
                            }
                          }}
                          placeholder="Nhập mã giảm giá"
                          className="soft-input flex-1 !rounded-[16px] !px-3 !py-2.5 !text-[10px] !tracking-[0.2em]"
                        />
                        <button type="button" onClick={() => handleApplyCoupon()} disabled={couponLoading || !couponCode.trim()} className="shrink-0 rounded-[16px] bg-[#1b1714] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:opacity-80 disabled:opacity-50">
                          {couponLoading ? "..." : "Áp dụng"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={loadAvailableCoupons}
                        className="mt-3 text-xs font-semibold text-[#946f2d] underline underline-offset-4"
                      >
                        {showAvailableCoupons ? "Ẩn mã giảm giá" : "Xem mã giảm giá có thể dùng"}
                      </button>
                      {showAvailableCoupons && (
                        <div className="mt-3 space-y-2">
                          {couponsLoading && <p className="text-xs text-[#8b8178]">Đang tải mã giảm giá...</p>}
                          {couponsError && <p role="alert" className="text-xs text-red-500">{couponsError}</p>}
                          {availableCoupons?.map((available) => (
                            <div key={available.code} className="flex items-center justify-between gap-3 rounded-2xl border border-[#efe5d8] px-3 py-2.5">
                              <div>
                                <p className="text-xs font-bold text-[#1b1714]">{available.code}</p>
                                <p className="text-[10px] text-[#7a706a]">
                                  {available.eligible
                                    ? `Giảm ${available.discount.toLocaleString("vi-VN")}₫`
                                    : `Đơn tối thiểu ${available.min_order.toLocaleString("vi-VN")}₫`}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={!available.eligible || couponLoading}
                                onClick={() => void handleApplyCoupon(available.code)}
                                className="shrink-0 rounded-full border border-[#d8c6a5] px-3 py-1.5 text-[10px] font-bold text-[#6f5425] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Chọn mã
                              </button>
                            </div>
                          ))}
                          {availableCoupons?.length === 0 && !couponsLoading && !couponsError && (
                            <p className="text-xs text-[#8b8178]">Hiện không có mã giảm giá nào khả dụng.</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {couponError && <p className="mt-2 text-xs text-red-500">{couponError}</p>}
                </div>

                <div className="mt-5 space-y-2 border-t border-[#efe5d8] pt-4">
                  <div className="flex justify-between text-sm text-[#6d635e]"><span>Tạm tính</span><span>{total.toLocaleString("vi-VN")}₫</span></div>
                  <div className="flex justify-between text-sm text-[#6d635e]"><span>Phí vận chuyển</span><span>{shippingFee.toLocaleString("vi-VN")}₫</span></div>
                  {coupon && <div className="flex justify-between text-sm font-semibold text-[#1d7a47]"><span>Giảm giá ({coupon.code})</span><span>-{discount.toLocaleString("vi-VN")}₫</span></div>}
                  <div className="mt-3 flex justify-between border-t border-[#efe5d8] pt-3 text-lg font-black text-[#1b1714]"><span>Tổng cộng</span><span>{grandTotal.toLocaleString("vi-VN")}₫</span></div>
                </div>

                {submitError && <p className="mt-3 text-center text-xs text-red-500">{submitError}</p>}
                <button type="submit" disabled={submitting} className="mt-3 w-full rounded-full bg-[#1b1714] px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:opacity-80 disabled:opacity-50">
                  {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng →"}
                </button>
                <p className="mt-2 text-center text-[10px] text-[#8b8178]">Bằng cách đặt hàng, bạn đồng ý với điều khoản của chúng tôi.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
