import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Header from "../components/Header";
import { API_URL } from "../lib/config";

const API = API_URL;

const STATUS = {
  awaiting_payment: { label: "Chờ thanh toán", color: "bg-[#f7ebd7] text-[#8a5c19]" },
  pending: { label: "Chờ xác nhận", color: "bg-[#f7f0d8] text-[#8e6b00]" },
  confirmed: { label: "Đã xác nhận", color: "bg-[#dfeaf9] text-[#1b5ea8]" },
  shipping: { label: "Đang giao", color: "bg-[#e9e1fb] text-[#5d3eb0]" },
  done: { label: "Hoàn thành", color: "bg-[#dff6ec] text-[#1e7d58]" },
  cancelled: { label: "Đã huỷ", color: "bg-[#fbe3e3] text-[#b63838]" },
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
      <div className="page-shell flex min-h-screen items-center justify-center pt-20">
        <p className="animate-pulse text-[#7a706a]">Đang tải đơn hàng...</p>
      </div>
    </>
  );

  return (
    <>
      <Header />
      <div className="page-shell min-h-screen pb-16 pt-24">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="mb-2 font-hero text-5xl text-[#1b1714] md:text-6xl">Đơn hàng của tôi</h1>
          <p className="mb-10 text-sm text-[#7a706a]">Xin chào, <strong>{user?.full_name}</strong></p>

          {orders.length === 0 ? (
            <div className="soft-card rounded-[30px] px-6 py-20 text-center">
              <p className="mb-4 font-hero text-5xl text-[#d8d0c7]">TRỐNG</p>
              <p className="mb-6 text-sm text-[#7a706a]">Bạn chưa có đơn hàng nào.</p>
              <Link to="/san-pham" className="primary-btn px-8 py-3.5 text-[10px]">Mua sắm ngay</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="soft-card overflow-hidden rounded-[28px]">
                  <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-[#f7f1eb]">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-[#7a706a]">#{o.id}</span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${STATUS[o.status]?.color}`}>
                        {STATUS[o.status]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">{new Date(o.created_at).toLocaleDateString("vi-VN")}</p>
                        <p className="font-black text-[#1b1714]">{Number(o.total_amount).toLocaleString("vi-VN")}đ</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-[#8b8178] transition-transform ${expanded === o.id ? "rotate-180" : ""}`}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {expanded === o.id && (
                    <div className="space-y-4 border-t border-[#efe5d8] px-6 py-5">
                      <div className="grid gap-4 text-sm md:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">Người nhận</p>
                          <p className="font-semibold text-[#1b1714]">{o.customer_name}</p>
                          <p className="text-[#5d5752]">{o.customer_phone}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">Địa chỉ</p>
                          <p className="text-[#5d5752]">{o.customer_address}</p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">Sản phẩm</p>
                        <div className="space-y-2">
                          {(o.items || []).map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-[#4f4b47]">{item.product_name} <span className="text-[#8b8178]">x{item.quantity}</span> {item.size && <span className="text-[#8b8178]">size {item.size}</span>} {item.color && <span className="text-[#8b8178]">màu {item.color}</span>}</span>
                              <span className="font-semibold text-[#1b1714]">{Number(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#efe5d8] pt-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">Thanh toán: {o.payment_method}</span>
                        <span className="font-black text-[#1b1714]">Tổng: {Number(o.total_amount).toLocaleString("vi-VN")}đ</span>
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
