import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/useCart";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../context/useAuth";
import { useWishlist } from "../context/useWishlist";
import { API_URL } from "../lib/config";

/* ── Star Rating ── */
function Stars({ value, onChange, size = "lg" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "lg" ? "w-7 h-7" : "w-4 h-4";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type={onChange ? "button" : undefined}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <svg viewBox="0 0 24 24" className={`${sz} transition`}
            fill={(hover || value) >= s ? "#facc15" : "none"}
            stroke={(hover || value) >= s ? "#facc15" : "#d1d5db"}
            strokeWidth={1.5}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ── Lightbox Modal ── */
function Lightbox({ images, index, onClose, onPrev, onNext }) {
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-5 right-5 text-white/70 hover:text-white text-4xl leading-none">×</button>
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 text-white/70 hover:text-white text-3xl px-3 py-2">‹</button>
          <button onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 text-white/70 hover:text-white text-3xl px-3 py-2">›</button>
        </>
      )}
      <img
        src={images[index]}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl"
        alt=""
      />
      {images.length > 1 && (
        <p className="absolute bottom-5 text-white/50 text-sm">{index + 1} / {images.length}</p>
      )}
    </div>
  );
}

/* ── Review Form ── */
function ReviewForm({ productId, existing, onSaved }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return setMsg({ type: "err", text: "Vui lòng chọn số sao" });
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/reviews/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: "ok", text: "Đánh giá đã được lưu!" });
      onSaved();
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-6 mb-6">
      <p className="text-xs font-black tracking-widest uppercase mb-4">
        {existing ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá"}
      </p>
      <div className="mb-4">
        <Stars value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
        rows={3}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black transition resize-none mb-3"
      />
      {msg && (
        <p className={`text-xs mb-3 ${msg.type === "ok" ? "text-green-600" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase hover:opacity-80 transition disabled:opacity-50"
      >
        {loading ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </form>
  );
}

/* ── Review Item ── */
function ReviewItem({ review, onDelete, isOwn }) {
  return (
    <div className="border-b border-gray-100 py-5 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shrink-0">
            {(review.full_name || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm">{review.full_name}</p>
            <p className="text-[10px] text-gray-400">
              {new Date(review.created_at).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Stars value={review.rating} size="sm" />
          {isOwn && (
            <button onClick={onDelete} className="text-gray-300 hover:text-red-400 text-xs transition">
              Xóa
            </button>
          )}
        </div>
      </div>
      {review.comment && <p className="text-sm text-gray-600 ml-12">{review.comment}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function ChiTietSanPham() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products, loading } = useProducts();
  const { user, token, isLoggedIn } = useAuth();
  const { ids: wishIds, toggle: wishToggle } = useWishlist();

  const product = products.find((p) => p.id === Number(id));

  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorError, setColorError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("mo-ta");
  const [added, setAdded] = useState(false);

  /* Gallery */
  const images = product
    ? [product.image, ...(product.images ?? [])].filter(Boolean)
    : [];
  const [mainImg, setMainImg] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  /* Reviews */
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState(null);

  const fetchReviews = async () => {
    if (!product) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_URL}/reviews/${product.id}`);
      if (res.ok) setReviews(await res.json());
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchMyReview = async () => {
    if (!product || !token) return;
    try {
      const res = await fetch(`${API_URL}/reviews/${product.id}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMyReview(await res.json());
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (product) {
      void fetchReviews();
      void fetchMyReview();
    }
  }, [product?.id, token]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const handleDeleteReview = async () => {
    await fetch(`${API_URL}/reviews/${product.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMyReview(null);
    fetchReviews();
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="font-black text-6xl text-gray-200">KHÔNG TÌM THẤY</p>
        <Link to="/san-pham" className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:opacity-75 transition">
          ← Quay lại
        </Link>
      </div>
    );
  }

  const liked = wishIds.includes(product.id);

  const validateSelection = () => {
    let ok = true;
    if (!selectedSize) { setSizeError(true); ok = false; }
    if (product.colors?.length && !selectedColor) { setColorError(true); ok = false; }
    return ok;
  };

  const handleAddToCart = () => {
    if (!validateSelection()) return;
    setSizeError(false);
    setColorError(false);
    addToCart({ ...product, quantity, size: selectedSize, color: selectedColor?.name ?? null, colorHex: selectedColor?.hex ?? null });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;
    setSizeError(false);
    setColorError(false);
    addToCart({ ...product, quantity, size: selectedSize, color: selectedColor?.name ?? null, colorHex: selectedColor?.hex ?? null });
    navigate("/thanh-toan");
  };

  const related = products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="bg-white min-h-screen">
      <Header />

      {lightbox !== null && (
        <Lightbox
          images={images}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox((i) => (i - 1 + images.length) % images.length)}
          onNext={() => setLightbox((i) => (i + 1) % images.length)}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-10">
          <Link to="/" className="hover:text-black transition">Trang chủ</Link>
          <span>/</span>
          <Link to="/san-pham" className="hover:text-black transition">Sản phẩm</Link>
          <span>/</span>
          <span className="text-black font-medium uppercase">{product.name}</span>
        </div>

        {/* Main grid */}
        <div className="grid md:grid-cols-2 gap-16">

          {/* ── LEFT: Gallery ── */}
          <div>
            {/* Main image */}
            <div
              className="bg-gray-50 rounded-3xl overflow-hidden flex items-center justify-center aspect-square cursor-zoom-in mb-3"
              onClick={() => setLightbox(mainImg)}
            >
              <img
                src={selectedColor?.image || images[mainImg] || product.image}
                alt={product.name}
                className="w-full h-full object-contain p-10 hover:scale-105 transition duration-500"
              />
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImg(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                      mainImg === i ? "border-black" : "border-transparent"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-contain p-1 bg-gray-50" />
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-300 text-center mt-2">Click ảnh để xem lớn</p>
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="flex flex-col">
            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">{product.brand}</p>
            <div className="flex items-start justify-between gap-4 mb-1">
              <h1 className="text-2xl font-black uppercase leading-tight">{product.name}</h1>
              <button
                onClick={() => wishToggle(product.id)}
                className="shrink-0 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-red-300 transition"
                title={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
              >
                <svg viewBox="0 0 24 24" className={`w-5 h-5 transition ${liked ? "fill-red-500 stroke-red-500" : "fill-none stroke-gray-400"}`} strokeWidth={2}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-2">SKU: {product.sku}</p>

            {/* Rating summary */}
            {avgRating && (
              <div className="flex items-center gap-2 mb-4">
                <Stars value={Math.round(avgRating)} size="sm" />
                <span className="text-sm font-bold">{avgRating}</span>
                <span className="text-xs text-gray-400">({reviews.length} đánh giá)</span>
              </div>
            )}

            <div className="w-full h-px bg-gray-100 mb-5" />

            <p className="text-3xl font-black mb-6">{product.price.toLocaleString("vi-VN")}₫</p>

            {/* Color */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
                  Màu sắc {selectedColor && <span className="text-black">— {selectedColor.name}</span>}
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => { setSelectedColor(c); setColorError(false); }}
                      title={c.name}
                      className={`w-9 h-9 rounded-full border-2 transition flex items-center justify-center ${
                        selectedColor?.name === c.name ? "border-black scale-110" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                    </button>
                  ))}
                </div>
                {colorError && (
                  <p className="text-red-400 text-xs mt-2">Vui lòng chọn màu trước</p>
                )}
              </div>
            )}

            {/* Size */}
            <div className="mb-6">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
                Kích thước {selectedSize && <span className="text-black">— {selectedSize}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setSizeError(false); }}
                    className={`w-14 h-10 text-sm font-semibold border rounded-xl transition ${
                      selectedSize === size
                        ? "bg-black text-white border-black"
                        : "border-gray-200 text-gray-600 hover:border-black hover:text-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="text-red-400 text-xs mt-2">Vui lòng chọn kích thước trước</p>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">Số lượng</p>
              <div className="flex items-center gap-4 border border-gray-200 rounded-full w-fit px-4 py-2">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-xl font-bold text-gray-400 hover:text-black transition w-6 text-center">-</button>
                <span className="font-bold w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}
                  className="text-xl font-bold text-gray-400 hover:text-black transition w-6 text-center">+</button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-8">
              <button onClick={handleAddToCart}
                className={`flex-1 py-4 rounded-2xl font-bold text-sm tracking-widest uppercase transition border-2 ${
                  added
                    ? "bg-green-500 text-white border-green-500"
                    : "border-gray-200 text-gray-700 hover:border-black hover:text-black"
                }`}>
                {added ? "✓ Đã thêm vào giỏ" : "Thêm Vào Giỏ"}
              </button>
              <button onClick={handleBuyNow}
                className="flex-1 py-4 rounded-2xl font-bold text-sm tracking-widest uppercase bg-black text-white hover:opacity-80 transition">
                Mua Ngay
              </button>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-100">
              <div className="flex gap-6 pt-4 mb-5">
                {["mo-ta", "dac-diem"].map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`text-xs font-bold tracking-widest uppercase pb-1 border-b-2 transition ${
                      tab === t ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                    }`}>
                    {t === "mo-ta" ? "Mô tả" : "Đặc điểm"}
                  </button>
                ))}
              </div>
              {tab === "mo-ta" && (
                <ul className="space-y-1.5">
                  {product.info.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-gray-300 mt-0.5">■</span>{item}
                    </li>
                  ))}
                </ul>
              )}
              {tab === "dac-diem" && (
                <ul className="space-y-1.5">
                  {product.details.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-gray-300 mt-0.5">■</span>{item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="mt-20 max-w-3xl">
          <div className="flex items-end gap-4 mb-8">
            <h3 className="text-3xl font-black uppercase tracking-widest">Đánh giá</h3>
            {avgRating && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-4xl font-black">{avgRating}</span>
                <Stars value={Math.round(avgRating)} size="sm" />
              </div>
            )}
          </div>

          {/* Form viết review */}
          {isLoggedIn ? (
            <ReviewForm
              productId={product.id}
              existing={myReview}
              onSaved={() => { fetchReviews(); fetchMyReview(); }}
            />
          ) : (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-center">
              <p className="text-sm text-gray-500 mb-3">Đăng nhập để viết đánh giá</p>
              <Link to="/dang-nhap" className="bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase hover:opacity-80 transition inline-block">
                Đăng nhập
              </Link>
            </div>
          )}

          {/* List reviews */}
          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          ) : (
            <div>
              {reviews.map((r) => (
                <ReviewItem
                  key={r.id}
                  review={r}
                  isOwn={user?.id === r.user_id || (myReview && myReview.id === r.id)}
                  onDelete={handleDeleteReview}
                />
              ))}
            </div>
          )}
        </div>

        {/* Related products */}
        <div className="mt-24">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-black uppercase tracking-widest mb-2">Sản phẩm liên quan</h3>
            <div className="w-10 h-0.5 bg-black mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <Link key={p.id} to={`/san-pham/${p.id}`} onClick={() => window.scrollTo(0, 0)} className="group">
                <div className="bg-gray-50 rounded-2xl overflow-hidden aspect-square mb-3">
                  <img src={p.image} alt={p.name}
                    className="w-full h-full object-contain p-5 group-hover:scale-105 transition duration-500" />
                </div>
                <p className="text-[10px] text-gray-400 tracking-widest uppercase">{p.brand}</p>
                <p className="font-bold text-sm uppercase mt-0.5 group-hover:underline underline-offset-2">{p.name}</p>
                <p className="text-gray-500 text-sm mt-1">{p.price.toLocaleString("vi-VN")}₫</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
