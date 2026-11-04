import { Link } from "react-router-dom";

export default function ProductList({ products }) {
  return (
    <section className="section-shell py-24">
      <div className="mb-12 text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#946f2d]">Curated collection</p>
        <h2 className="font-hero text-5xl text-[#1b1714] md:text-7xl">Nổi bật</h2>
        <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#c9a96d] to-transparent" />
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.slice(0, 8).map((product) => {
          const isPremium = product.price >= 6000000;

          return (
            <Link key={product.id} to={`/san-pham/${product.id}`} className="group block">
              <div
                className="relative mb-4 overflow-hidden rounded-[28px] border border-[#efe5d8] bg-[#f6f1ea] p-4 shadow-[0_22px_45px_rgba(16,10,7,0.05)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_rgba(16,10,7,0.12)]"
                style={{ background: isPremium ? "linear-gradient(135deg, #1a1715 0%, #2a211d 100%)" : "#f5f0ea" }}
              >
                <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                  {isPremium ? "Premium" : "New"}
                </div>

                <img
                  src={product.image}
                  alt={product.name}
                  className="h-[260px] w-full object-contain transition duration-500 group-hover:scale-105"
                />
              </div>

              <div className="px-1">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">{product.brand}</p>
                <p className="mb-2 line-clamp-1 text-base font-bold uppercase tracking-[0.04em] text-[#1b1714] group-hover:text-[#946f2d] transition">
                  {product.name}
                </p>
                <p className="text-lg font-semibold text-[#1b1714]">{product.price.toLocaleString("vi-VN")}₫</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <Link to="/san-pham" className="luxury-button group">
          Xem tất cả sản phẩm
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1715] text-base text-[#f0d89e] group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
