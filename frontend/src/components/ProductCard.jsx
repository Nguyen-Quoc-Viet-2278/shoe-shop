



import { useState } from "react";

export default function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="group overflow-hidden rounded-[28px] border border-[#efe5d8] bg-[#fbf6f2] shadow-[0_22px_45px_rgba(16,10,7,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(16,10,7,0.12)]">
      <div className="relative overflow-hidden bg-[#f6f1ea] p-4">
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#efe5d8] bg-white/90 text-xl shadow-sm"
          aria-label="Like product"
        >
          {isLiked ? "♥" : "♡"}
        </button>

        <div className="absolute left-4 top-4 rounded-full bg-[#1c1917] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#f0d89e]">
          New
        </div>

        <img
          src={product.image}
          alt={product.name}
          className="h-[250px] w-full object-contain transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-5">
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">{product.brand}</p>
        <h3 className="mb-3 text-lg font-bold uppercase tracking-[0.04em] text-[#1b1714]">{product.name}</h3>
        <div className="mb-4 flex items-center gap-2 text-yellow-500">⭐⭐⭐⭐⭐ <span className="text-[11px] text-[#7b7169]">(128)</span></div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#81756d] line-through">{(product.price * 1.2).toLocaleString("vi-VN")}₫</p>
            <p className="text-2xl font-bold text-[#1b1714]">{product.price.toLocaleString("vi-VN")}₫</p>
          </div>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b1714] text-xl text-white transition hover:bg-[#2d231f]">
            🛒
          </button>
        </div>
      </div>
    </div>
  );
}