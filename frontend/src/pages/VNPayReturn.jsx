import { useSearchParams, useNavigate, Link } from "react-router-dom";

export default function VNPayReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = params.get("status");
  const orderId = params.get("orderId");
  const amount = Number(params.get("amount") || 0);

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center"
        style={{ background: "#fff5f5" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-5xl font-bold"
          style={{ background: "#e31837" }}>
          ✓
        </div>
        <h1 className="text-4xl font-black">Thanh toán VNPay thành công!</h1>
        <p className="text-gray-500 text-sm">
          Mã đơn hàng <strong>#{orderId}</strong> đã được xác nhận.
        </p>
        {amount > 0 && (
          <p className="font-black text-2xl" style={{ color: "#e31837" }}>
            -{amount.toLocaleString("vi-VN")}₫
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => navigate("/don-hang")}
            className="px-8 py-3.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: "#e31837" }}
          >
            Xem đơn hàng
          </button>
          <Link
            to="/"
            className="px-8 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 hover:border-gray-400 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-4xl">
        ✗
      </div>
      <h1 className="text-3xl font-black">Thanh toán thất bại</h1>
      <p className="text-gray-400 text-sm">
        {status === "invalid"
          ? "Dữ liệu trả về không hợp lệ."
          : `Giao dịch cho đơn hàng #${orderId} không thể hoàn tất.`}
      </p>
      <div className="flex gap-3">
        <Link
          to="/thanh-toan"
          className="px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-black hover:opacity-80 transition"
        >
          Thử lại
        </Link>
        <Link
          to="/"
          className="px-8 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 hover:border-gray-400 transition"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
