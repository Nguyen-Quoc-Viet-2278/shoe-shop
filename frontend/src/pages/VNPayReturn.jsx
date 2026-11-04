import { useSearchParams, useNavigate, Link } from "react-router-dom";

export default function VNPayReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = params.get("status");
  const orderId = params.get("orderId");
  const amount = Number(params.get("amount") || 0);

  if (status === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center" style={{ background: "#fff5f5" }}>
        <div className="flex h-24 w-24 items-center justify-center rounded-full text-5xl font-bold text-white" style={{ background: "#e31837" }}>✓</div>
        <h1 className="font-hero text-5xl text-[#1b1714]">Thanh toán VNPay thành công!</h1>
        <p className="text-sm text-[#6f665f]">Mã đơn hàng <strong>#{orderId}</strong> đã được xác nhận.</p>
        {amount > 0 && <p className="text-2xl font-black" style={{ color: "#e31837" }}>-{amount.toLocaleString("vi-VN")}₫</p>}
        <div className="mt-4 flex gap-3">
          <button onClick={() => navigate("/don-hang")} className="rounded-full bg-[#e31837] px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-80">Xem đơn hàng</button>
          <Link to="/" className="rounded-full border-2 border-[#e7d8c6] bg-white px-8 py-3.5 text-sm font-bold text-[#1b1714] transition hover:border-[#1b1714]">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl text-red-500">✗</div>
      <h1 className="font-hero text-4xl text-[#1b1714]">Thanh toán thất bại</h1>
      <p className="text-sm text-[#7a706a]">{status === "invalid" ? "Dữ liệu trả về không hợp lệ." : `Giao dịch cho đơn hàng #${orderId} không thể hoàn tất.`}</p>
      <div className="flex gap-3">
        <Link to="/thanh-toan" className="rounded-full bg-[#1b1714] px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-80">Thử lại</Link>
        <Link to="/" className="rounded-full border-2 border-[#e7d8c6] bg-white px-8 py-3.5 text-sm font-bold text-[#1b1714] transition hover:border-[#1b1714]">Về trang chủ</Link>
      </div>
    </div>
  );
}
