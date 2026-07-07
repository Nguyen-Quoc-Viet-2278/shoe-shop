import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_URL } from "../lib/config";

const API = API_URL;

const GATEWAY_CONFIG = {
  momo: {
    name: "MoMo",
    color: "#ae2070",
    bg: "#fdf2f7",
    logo: "💜",
    label: "Ví MoMo",
    inputLabel: "Số điện thoại MoMo",
    btnText: "Xác nhận thanh toán",
  },
  vnpay: {
    name: "VNPay",
    color: "#e31837",
    bg: "#fff5f5",
    logo: "💳",
    label: "VNPay",
    inputLabel: "Số thẻ / Tài khoản",
    btnText: "Thanh toán ngay",
  },
};

export default function ThanhToanOnline() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const orderId = params.get("orderId");
  const method  = params.get("method") || "momo";
  const amount  = Number(params.get("amount") || 0);

  const cfg = GATEWAY_CONFIG[method] || GATEWAY_CONFIG.momo;

  const [step, setStep] = useState("form"); // "form" | "processing" | "done" | "error"
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);

  // Auto-redirect if missing orderId
  useEffect(() => {
    if (!orderId) navigate("/");
  }, [orderId, navigate]);

  const handlePay = async () => {
    if (pin.length < 4) {
      setError("Vui lòng nhập đủ thông tin");
      return;
    }
    setError(null);
    setStep("processing");

    // Simulate gateway delay
    await new Promise((r) => setTimeout(r, 2200));

    try {
      const res = await fetch(`${API}/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("Thanh toán thất bại");
      setStep("done");
    } catch {
      setStep("error");
    }
  };

  /* ── Processing ── */
  if (step === "processing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: cfg.bg }}>
        <div className="text-6xl animate-bounce">{cfg.logo}</div>
        <p className="font-bold text-lg" style={{ color: cfg.color }}>
          Đang xử lý thanh toán...
        </p>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: cfg.color, animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <p className="text-sm text-gray-500">Vui lòng không đóng trang này</p>
      </div>
    );
  }

  /* ── Success ── */
  if (step === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center"
        style={{ background: cfg.bg }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-5xl font-bold"
          style={{ background: cfg.color }}>
          ✓
        </div>
        <h1 className="text-4xl font-black">Thanh toán thành công!</h1>
        <p className="text-gray-500 text-sm">
          Mã đơn hàng <strong>#{orderId}</strong> đã được xác nhận.
        </p>
        <p className="font-black text-2xl" style={{ color: cfg.color }}>
          -{amount.toLocaleString("vi-VN")}₫
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => navigate("/don-hang")}
            className="px-8 py-3.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: cfg.color }}
          >
            Xem đơn hàng
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 hover:border-gray-400 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (step === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-4xl">
          ✗
        </div>
        <h1 className="text-3xl font-black">Thanh toán thất bại</h1>
        <p className="text-gray-400 text-sm">Giao dịch không thể hoàn tất. Vui lòng thử lại.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setStep("form")}
            className="px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-black hover:opacity-80 transition"
          >
            Thử lại
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 hover:border-gray-400 transition"
          >
            Huỷ
          </button>
        </div>
      </div>
    );
  }

  /* ── Payment Form ── */
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: cfg.bg }}>
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-sm"
            style={{ background: cfg.color }}>
            <span className="text-3xl">{cfg.logo}</span>
          </div>
          <h1 className="text-2xl font-black">{cfg.name}</h1>
          <p className="text-gray-400 text-sm mt-1">Cổng thanh toán {cfg.label}</p>
        </div>

        {/* Amount card */}
        <div className="bg-white rounded-3xl p-5 mb-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Số tiền thanh toán</p>
          <p className="text-3xl font-black" style={{ color: cfg.color }}>
            {amount.toLocaleString("vi-VN")}₫
          </p>
          <p className="text-xs text-gray-400 mt-1">Đơn hàng #{orderId} · LIZSHOOS Store</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">
              {cfg.inputLabel}
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(null); }}
              placeholder={method === "momo" ? "0901 234 567" : "1234 5678 9012 3456"}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition placeholder:text-gray-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">
              Mã PIN / OTP
            </label>
            <div className="flex gap-2">
              {[0,1,2,3,4,5].map((i) => (
                <div key={i}
                  className="flex-1 h-10 rounded-xl border border-gray-200 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              * Môi trường demo — không cần nhập PIN thật
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            onClick={handlePay}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white tracking-widest uppercase transition hover:opacity-80"
            style={{ background: cfg.color }}
          >
            {cfg.btnText}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-2xl text-xs text-gray-400 hover:text-black transition"
          >
            ← Quay lại
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          Kết nối bảo mật SSL · Mã hoá 256-bit
        </p>
      </div>
    </div>
  );
}
