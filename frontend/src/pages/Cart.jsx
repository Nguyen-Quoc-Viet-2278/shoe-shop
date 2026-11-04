import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total, syncError } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="page-shell flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-hero text-7xl text-[#d8d0c7] md:text-[8rem]">GIỎ TRỐNG</p>
        <p className="text-sm text-[#7a706a]">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
        <Link to="/" className="primary-btn">
          ← Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-5xl px-6 py-5">
        <div className="soft-card flex items-center justify-between rounded-[28px] border border-[#f0e7dc] px-6 py-4">
          <Link to="/" className="text-sm text-[#7d7269] hover:text-[#1b1714]">
            ← Tiếp tục mua sắm
          </Link>
          <p className="font-hero text-3xl tracking-[0.2em] text-[#1b1714]">LIZSHOOS</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 pb-20">
        <h1 className="mb-10 flex items-end gap-3 text-4xl font-black text-[#1b1714] md:text-6xl">
          Giỏ hàng
          <span className="text-2xl text-[#b1a39a] md:text-3xl">({cart.length})</span>
        </h1>
        {syncError && (
          <p role="alert" className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {syncError}
            {syncError.includes("đăng nhập lại") && (
              <>{" "}<Link to="/dang-nhap" className="font-semibold underline">Đăng nhập lại</Link></>
            )}
          </p>
        )}

        <div className="space-y-4">
          {cart.map((item) => (
            <div key={`${item.id}-${item.size}-${item.color}`} className="soft-card flex flex-col gap-5 rounded-[28px] p-5 md:flex-row md:items-center md:gap-6">
              <Link to={`/san-pham/${item.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-[#f3eee9]">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </Link>

              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">{item.brand}</p>
                <Link to={`/san-pham/${item.id}`} className="block truncate text-lg font-bold text-[#1b1714] hover:text-[#946f2d]">
                  {item.name}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.size && (
                    <span className="rounded-full bg-[#f1ece5] px-2 py-1 text-[10px] font-semibold text-[#4f4741]">
                      Size {item.size}
                    </span>
                  )}
                  {item.color && (
                    <span className="flex items-center gap-1 rounded-full bg-[#f1ece5] px-2 py-1 text-[10px] font-semibold text-[#4f4741]">
                      <span className="h-2.5 w-2.5 rounded-full border border-[#d0c7bf]" style={{ backgroundColor: item.colorHex || "#ccc" }} />
                      {item.color}
                    </span>
                  )}
                  <p className="text-sm text-[#6d635e]">{item.price.toLocaleString("vi-VN")}₫</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 md:justify-end">
                <div className="flex items-center gap-3 rounded-full border border-[#eadfd2] bg-white px-3 py-2">
                  <button onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)} className="w-5 text-lg font-bold text-[#8b8178] hover:text-[#1b1714]">−</button>
                  <span className="w-5 text-center text-sm font-bold text-[#1b1714]">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)} className="w-5 text-lg font-bold text-[#8b8178] hover:text-[#1b1714]">+</button>
                </div>

                <p className="w-28 text-right text-lg font-black text-[#1b1714]">
                  {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                </p>

                <button onClick={() => removeFromCart(item.id, item.size, item.color)} className="text-[#b8afa5] hover:text-red-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-end gap-4 border-t border-[#efe5d8] pt-8">
          <div className="text-right">
            <p className="mb-1 text-sm text-[#7d7269]">Tổng cộng</p>
            <p className="text-4xl font-black text-[#1b1714] md:text-5xl">{total.toLocaleString("vi-VN")}₫</p>
          </div>
          <button onClick={() => navigate("/thanh-toan")} className="primary-btn px-12 py-4 text-sm">
            Thanh toán →
          </button>
        </div>
      </div>
    </div>
  );
}
