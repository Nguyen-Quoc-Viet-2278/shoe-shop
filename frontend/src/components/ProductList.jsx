import { Link } from "react-router-dom";

export default function ProductList({ products }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black tracking-widest uppercase mb-2">Nổi Bật</h2>
        <div className="w-12 h-0.5 bg-black mx-auto" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.slice(0, 8).map((product) => {
          const isPremium = product.price >= 6000000;
          return (
            <Link key={product.id} to={`/san-pham/${product.id}`} className="group flex flex-col">
              <div
                className="rounded-2xl overflow-hidden aspect-square mb-4 relative"
                style={{ background: isPremium ? "#111" : "#f5f5f5" }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-6 group-hover:scale-105 transition duration-500"
                />
                {isPremium && (
                  <span className="absolute top-3 left-3 bg-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase border border-white/20">
                    Premium
                  </span>
                )}
              </div>

              <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-0.5">
                {product.brand}
              </p>
              <p className="font-bold text-sm uppercase leading-snug group-hover:underline underline-offset-2 line-clamp-1 mb-1">
                {product.name}
              </p>
              <p className="text-gray-600 text-sm font-medium">
                {product.price.toLocaleString("vi-VN")}₫
              </p>
            </Link>
          );
        })}
      </div>

      {/* View all */}
      <div className="text-center mt-12">
        <Link
          to="/san-pham"
          className="inline-flex items-center gap-3 border border-black rounded-full pl-7 pr-2 py-2 font-semibold text-sm hover:bg-black hover:text-white transition group"
        >
          Xem tất cả sản phẩm
          <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
