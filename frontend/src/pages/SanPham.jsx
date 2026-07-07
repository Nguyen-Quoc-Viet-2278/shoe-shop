import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useProducts } from "../hooks/useProducts";
import { useWishlist } from "../context/useWishlist";

const PRICE_RANGES = [
  { label: "Dưới 1,000,000đ", min: 0, max: 1000000 },
  { label: "1,000,000đ - 2,000,000đ", min: 1000000, max: 2000000 },
  { label: "2,000,000đ - 3,000,000đ", min: 2000000, max: 3000000 },
  { label: "3,000,000đ - 5,000,000đ", min: 3000000, max: 5000000 },
  { label: "Trên 5,000,000đ", min: 5000000, max: Infinity },
];

const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const PAGE_SIZE = 9;

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 pb-6 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-4"
      >
        <span className="text-[10px] font-black tracking-[0.3em] uppercase">{title}</span>
        <span className="text-gray-400 text-sm">{open ? "−" : "+"}</span>
      </button>
      {open && children}
    </div>
  );
}

function HeartBtn({ productId }) {
  const { ids, toggle } = useWishlist();
  const liked = ids.includes(productId);
  return (
    <button
      onClick={(e) => { e.preventDefault(); toggle(productId); }}
      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:scale-110 transition z-10"
      title={liked ? "Bỏ yêu thích" : "Yêu thích"}
    >
      <svg viewBox="0 0 24 24" className={`w-4 h-4 transition ${liked ? "fill-red-500 stroke-red-500" : "fill-none stroke-gray-400"}`} strokeWidth={2}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-10 h-10 rounded-xl border border-gray-200 text-sm font-semibold hover:border-black transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-10 h-10 rounded-xl text-sm font-semibold transition border ${
            p === page
              ? "bg-black text-white border-black"
              : "border-gray-200 hover:border-black"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-10 h-10 rounded-xl border border-gray-200 text-sm font-semibold hover:border-black transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
}

export default function SanPham() {
  const { products, loading } = useProducts();
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);

  const brands = [...new Set(products.map((p) => p.brand))];

  const toggle = (setter, value) =>
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedBrands.length > 0)
      result = result.filter((p) => selectedBrands.includes(p.brand));
    if (selectedPrices.length > 0)
      result = result.filter((p) =>
        selectedPrices.some((label) => {
          const r = PRICE_RANGES.find((x) => x.label === label);
          return r && p.price >= r.min && p.price < r.max;
        })
      );
    if (selectedSizes.length > 0)
      result = result.filter((p) =>
        p.sizes?.some((s) => selectedSizes.includes(s))
      );
    if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, selectedBrands, selectedPrices, selectedSizes, sort]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const hasFilter = selectedBrands.length > 0 || selectedPrices.length > 0 || selectedSizes.length > 0;

  const handleFilterChange = (setter, value) => {
    toggle(setter, value);
    setPage(1);
  };

  return (
    <div className="bg-white min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <div className="flex gap-12">
          {/* ─── Sidebar ─── */}
          <aside className="w-52 shrink-0 hidden md:block">
            <FilterSection title="Thương Hiệu">
              <div className="space-y-2.5">
                {brands.map((brand) => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleFilterChange(setSelectedBrands, brand)}
                      className="w-4 h-4 accent-black"
                    />
                    <span className="text-sm text-gray-500 group-hover:text-black transition">{brand}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Giá Sản Phẩm">
              <div className="space-y-2.5">
                {PRICE_RANGES.map((range) => (
                  <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedPrices.includes(range.label)}
                      onChange={() => handleFilterChange(setSelectedPrices, range.label)}
                      className="w-4 h-4 accent-black"
                    />
                    <span className="text-sm text-gray-500 group-hover:text-black transition">{range.label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Kích Thước">
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFilterChange(setSelectedSizes, size)}
                    className={`w-10 h-10 text-xs font-semibold border rounded-xl transition ${
                      selectedSizes.includes(size)
                        ? "bg-black text-white border-black"
                        : "border-gray-200 text-gray-500 hover:border-black hover:text-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </FilterSection>

            {hasFilter && (
              <button
                onClick={() => {
                  setSelectedBrands([]);
                  setSelectedPrices([]);
                  setSelectedSizes([]);
                  setPage(1);
                }}
                className="text-xs text-gray-400 hover:text-black underline underline-offset-2 transition"
              >
                Xóa bộ lọc
              </button>
            )}
          </aside>

          {/* ─── Main ─── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
                  {filtered.length} sản phẩm
                </p>
                <h1 className="text-5xl md:text-7xl font-black leading-none">Sản Phẩm</h1>
              </div>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-full px-5 py-2.5 text-xs font-semibold tracking-widest outline-none hover:border-black transition cursor-pointer text-gray-500"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="font-black text-5xl text-gray-200">KHÔNG TÌM THẤY</p>
                <p className="text-sm text-gray-400">Thử thay đổi bộ lọc</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginated.map((product) => (
                    <Link key={product.id} to={`/san-pham/${product.id}`} className="group block">
                      <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square mb-4 relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition duration-300" />
                        <HeartBtn productId={product.id} />
                      </div>
                      <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">{product.brand}</p>
                      <p className="font-bold text-sm mb-1 group-hover:underline underline-offset-2">{product.name}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.sizes?.slice(0, 5).map((s) => (
                          <span key={s} className="text-[10px] text-gray-400 border border-gray-100 rounded px-1.5 py-0.5">
                            {s}
                          </span>
                        ))}
                        {product.sizes?.length > 5 && (
                          <span className="text-[10px] text-gray-300 px-1">+{product.sizes.length - 5}</span>
                        )}
                      </div>
                      <p className="text-gray-800 font-semibold text-sm">
                        {product.price.toLocaleString("vi-VN")}₫
                      </p>
                    </Link>
                  ))}
                </div>

                <Pagination
                  page={page}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
