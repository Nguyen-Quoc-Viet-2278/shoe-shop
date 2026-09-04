import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Header from "../components/Header";
import { API_URL } from "../lib/config";

const API = API_URL;

const STATUS = {
  awaiting_payment: { label: "Chờ thanh toán", color: "bg-orange-100 text-orange-700" },
  pending:          { label: "Chờ xác nhận",   color: "bg-yellow-100 text-yellow-700" },
  confirmed:        { label: "Đã xác nhận",    color: "bg-blue-100 text-blue-700" },
  shipping:         { label: "Đang giao",      color: "bg-purple-100 text-purple-700" },
  done:             { label: "Hoàn thành",     color: "bg-green-100 text-green-700" },
  cancelled:        { label: "Đã huỷ",         color: "bg-red-100 text-red-700" },
};

export default function DonHangCuaToi() {
  const { user, token, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/dang-nhap", { state: { from: "/don-hang" } }); return; }
    fetch(`${API}/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-gray-400 animate-pulse">Đang tải đơn hàng...</p>
      </div>
    </>
  );

  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-black mb-2">Đơn hàng của tôi</h1>
          <p className="text-gray-400 text-sm mb-10">Xin chào, <strong>{user?.full_name}</strong></p>

          {orders.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-300 font-hero text-5xl mb-4">TRỐNG</p>
              <p className="text-gray-400 text-sm mb-6">Bạn chưa có đơn hàng nào.</p>
              <Link to="/san-pham" className="bg-black text-white px-8 py-3 rounded-full text-sm font-bold hover:opacity-80 transition">
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                  {/* Header row */}
                  <button
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm font-bold">#{o.id}</span>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS[o.status]?.color}`}>
                        {STATUS[o.status]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString("vi-VN")}</p>
                        <p className="font-black">{Number(o.total_amount).toLocaleString("vi-VN")}đ</p>
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`text-gray-400 transition-transform ${expanded === o.id ? "rotate-180" : ""}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {/* Chi tiết */}
                  {expanded === o.id && (
                    <div className="border-t border-gray-100 px-6 py-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Người nhận</p>
                          <p className="font-semibold">{o.customer_name}</p>
                          <p className="text-gray-500">{o.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Địa chỉ</p>
                          <p className="text-gray-600 text-sm">{o.customer_address}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Sản phẩm</p>
                        <div className="space-y-2">
                          {(o.items || []).map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{item.product_name} <span className="text-gray-400">x{item.quantity}</span> {item.size && <span className="text-gray-400">size {item.size}</span>} {item.color && <span className="text-gray-400">màu {item.color}</span>}</span>
                              <span className="font-semibold">{Number(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                        <span className="text-xs text-gray-400 uppercase">Thanh toán: {o.payment_method}</span>
                        <span className="font-black">Tổng: {Number(o.total_amount).toLocaleString("vi-VN")}đ</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
