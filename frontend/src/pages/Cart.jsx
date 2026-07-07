import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="font-hero text-6xl text-gray-200">GIỎ TRỐNG</p>
        <p className="text-gray-400">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
        <Link
          to="/"
          className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:opacity-75 transition"
        >
          ← Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between max-w-4xl mx-auto">
        <Link to="/" className="text-sm text-gray-400 hover:text-black transition">
          ← Tiếp tục mua sắm
        </Link>
        <p className="font-hero text-2xl tracking-widest">LIZSHOOS</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-black mb-10">
          Giỏ hàng
          <span className="text-gray-300 ml-3 text-3xl">({cart.length})</span>
        </h1>

        {/* Items */}
        <div className="divide-y divide-gray-100">
          {cart.map((item) => (
            <div key={`${item.id}-${item.size}`} className="flex items-center gap-6 py-6">
              {/* Ảnh */}
              <Link to={`/san-pham/${item.id}`} className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 shrink-0 hover:opacity-80 transition">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </Link>

              {/* Tên + brand */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">
                  {item.brand}
                </p>
                <Link to={`/san-pham/${item.id}`} className="font-bold truncate block hover:underline">
                  {item.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  {item.size && (
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Size {item.size}
                    </span>
                  )}
                  <p className="text-gray-500 text-sm">
                    {item.price.toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>

              {/* Tăng giảm số lượng */}
              <div className="flex items-center gap-3 border border-gray-200 rounded-full px-4 py-2">
                <button
                  onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                  className="text-lg font-bold text-gray-400 hover:text-black transition w-5 text-center"
                >
                  −
                </button>
                <span className="font-semibold w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                  className="text-lg font-bold text-gray-400 hover:text-black transition w-5 text-center"
                >
                  +
                </button>
              </div>

              {/* Thành tiền */}
              <p className="font-black text-lg w-32 text-right shrink-0">
                {(item.price * item.quantity).toLocaleString("vi-VN")}₫
              </p>

              {/* Xóa */}
              <button
                onClick={() => removeFromCart(item.id, item.size)}
                className="text-gray-300 hover:text-red-500 transition shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Tổng tiền + checkout */}
        <div className="mt-10 flex flex-col items-end gap-4 border-t border-gray-100 pt-8">
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">Tổng cộng</p>
            <p className="text-4xl font-black">{total.toLocaleString("vi-VN")}₫</p>
          </div>
          <button
            onClick={() => navigate("/thanh-toan")}
            className="bg-black text-white px-16 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:opacity-80 transition"
          >
            Thanh toán →
          </button>
        </div>
      </div>
    </div>
  );
}
