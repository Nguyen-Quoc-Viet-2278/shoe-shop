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
    <div className="mb-6 border-b border-[#efe5d8] pb-6">
      <button onClick={() => setOpen(!open)} className="mb-4 flex w-full items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#7a6961]">{title}</span>
        <span className="text-sm text-[#7a6961]">{open ? "−" : "+"}</span>
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
      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md shadow-black/5 transition hover:scale-110"
      title={liked ? "Bỏ yêu thích" : "Yêu thích"}
    >
      <svg viewBox="0 0 24 24" className={`h-4 w-4 transition ${liked ? "fill-red-500 stroke-red-500" : "fill-none stroke-gray-400"}`} strokeWidth={2}>
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
    <div className="mt-12 flex items-center justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="h-10 w-10 rounded-xl border border-[#e8dcca] text-sm font-semibold text-[#4c453f] transition hover:border-[#1b1714] disabled:cursor-not-allowed disabled:opacity-30">
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-10 w-10 rounded-xl border text-sm font-semibold transition ${
            p === page ? "border-[#1b1714] bg-[#1b1714] text-white" : "border-[#e8dcca] text-[#4c453f] hover:border-[#1b1714]"
          }`}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="h-10 w-10 rounded-xl border border-[#e8dcca] text-sm font-semibold text-[#4c453f] transition hover:border-[#1b1714] disabled:cursor-not-allowed disabled:opacity-30">
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
    if (selectedBrands.length > 0) result = result.filter((p) => selectedBrands.includes(p.brand));
    if (selectedPrices.length > 0) {
      result = result.filter((p) =>
        selectedPrices.some((label) => {
          const r = PRICE_RANGES.find((x) => x.label === label);
          return r && p.price >= r.min && p.price < r.max;
        })
      );
    }
    if (selectedSizes.length > 0) result = result.filter((p) => p.sizes?.some((s) => selectedSizes.includes(s)));
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
    <div className="page-shell">
      <Header />

      <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-28 md:px-6">
        <section className="mb-8 overflow-hidden rounded-[32px] bg-[#111111] text-white shadow-[0_26px_70px_rgba(17,12,9,0.18)]">
          <div className="flex flex-col gap-6 px-5 py-7 md:flex-row md:items-end md:justify-between md:px-8 md:py-8">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#d2ae67]">Collection</p>
              <h1 className="font-hero text-5xl leading-none md:text-7xl">Balo - Túi</h1>
            </div>
            <div className="max-w-xl text-sm leading-relaxed text-[#d3c8bf] md:text-right">
              Tối giản, chắc chắn, tiện dụng và thời trang — lựa chọn túi đeo chéo, balo học tập, đi làm, du lịch phù hợp với phong cách hiện đại.
            </div>
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {brands.slice(0, 6).map((brand) => (
              <button
                key={brand}
                onClick={() => handleFilterChange(setSelectedBrands, brand)}
                className={`rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                  selectedBrands.includes(brand)
                    ? "border-[#17120d] bg-[#17120d] text-white"
                    : "border-[#e8dcca] bg-white text-[#4f453f] hover:border-[#17120d]"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-full border border-[#e8dcca] bg-white px-4 py-2.5 shadow-[0_10px_20px_rgba(17,12,9,0.03)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#7c7068]">Sắp xếp</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="bg-transparent text-sm font-medium text-[#1b1714] outline-none"
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        <div className="grid gap-7 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-[#eee3d9] bg-white/75 p-5 shadow-[0_18px_35px_rgba(17,12,9,0.04)] backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#7b6d62]">Bộ lọc</h2>
              {hasFilter && (
                <button onClick={() => { setSelectedBrands([]); setSelectedPrices([]); setSelectedSizes([]); setPage(1); }} className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b6d62] underline-offset-2 hover:underline">
                  Xóa
                </button>
              )}
            </div>

            <FilterSection title="Thương Hiệu">
              <div className="space-y-2.5">
                {brands.map((brand) => (
                  <label key={brand} className="group flex cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => handleFilterChange(setSelectedBrands, brand)} className="h-4 w-4 accent-[#1b1714]" />
                    <span className="text-sm text-[#5c5550] transition group-hover:text-[#1b1714]">{brand}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Giá">
              <div className="space-y-2.5">
                {PRICE_RANGES.map((range) => (
                  <label key={range.label} className="group flex cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={selectedPrices.includes(range.label)} onChange={() => handleFilterChange(setSelectedPrices, range.label)} className="h-4 w-4 accent-[#1b1714]" />
                    <span className="text-sm text-[#5c5550] transition group-hover:text-[#1b1714]">{range.label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Kích thước">
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((size) => (
                  <button key={size} onClick={() => handleFilterChange(setSelectedSizes, size)} className={`h-9 w-9 rounded-xl border text-xs font-semibold transition ${selectedSizes.includes(size) ? "border-[#1b1714] bg-[#1b1714] text-white" : "border-[#e8dcca] text-[#5f5851] hover:border-[#1b1714] hover:text-[#1b1714]"}`}>
                    {size}
                  </button>
                ))}
              </div>
            </FilterSection>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#8b8178]">{filtered.length} sản phẩm</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1b1714] border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center rounded-[32px] border border-[#eae0d4] bg-white text-center shadow-[0_18px_35px_rgba(17,12,9,0.04)]">
                <p className="text-4xl font-black text-[#d8d0c7] md:text-5xl">KHÔNG TÌM THẤY</p>
                <p className="mt-2 text-sm text-[#7a706a]">Thử thay đổi bộ lọc để xem thêm sản phẩm</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-5 md:gap-6 xl:grid-cols-3">
                  {paginated.map((product) => (
                    <Link key={product.id} to={`/san-pham/${product.id}`} className="group block">
                      <div className="soft-card relative overflow-hidden rounded-[28px] p-3">
                        <div className="absolute left-4 top-4 z-10 rounded-full bg-[#17120d] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#f0d89e]">
                          {product.price >= 6000000 ? "Premium" : "New"}
                        </div>

                        <div className="overflow-hidden rounded-[24px] bg-[#f6f1ea] p-2">
                          <img src={product.image} alt={product.name} className="h-[220px] w-full object-contain transition duration-500 group-hover:scale-105 md:h-[250px]" />
                        </div>

                        <HeartBtn productId={product.id} />
                      </div>

                      <div className="px-1 pb-2">
                        <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">{product.brand}</p>
                        <p className="mb-2 line-clamp-2 text-base font-bold uppercase tracking-[0.04em] text-[#1b1714] transition group-hover:text-[#9d7938]">{product.name}</p>

                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {product.sizes?.slice(0, 4).map((s) => (
                            <span key={s} className="rounded-full border border-[#e8dcca] px-2 py-0.5 text-[10px] text-[#655d58]">{s}</span>
                          ))}
                          {product.sizes?.length > 4 && <span className="px-1 text-[10px] text-[#8d8077]">+{product.sizes.length - 4}</span>}
                        </div>

                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs text-[#8d8077] line-through">{(product.price * 1.15).toLocaleString("vi-VN")}₫</p>
                            <p className="text-lg font-bold text-[#1b1714]">{product.price.toLocaleString("vi-VN")}₫</p>
                          </div>
                          <span className="rounded-full border border-[#e7daca] bg-[#f9f5f1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5f554f]">Mua</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
