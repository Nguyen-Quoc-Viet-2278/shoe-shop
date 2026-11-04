import { Fragment, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { API_URL } from "../lib/config";
import { notifyProductsChanged } from "../hooks/useProducts";

const API = API_URL;
const fmt = (n) => Number(n).toLocaleString("vi-VN") + "đ";

const STATUS_LABEL = {
  pending:   { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đã xác nhận",  color: "bg-blue-100 text-blue-700" },
  shipping:  { label: "Đang giao",    color: "bg-purple-100 text-purple-700" },
  done:      { label: "Hoàn thành",   color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã huỷ",       color: "bg-red-100 text-red-700" },
};

const NAV_ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/>
    </svg>
  ),
  coupons: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <circle cx="7" cy="7" r="1" fill="currentColor"/>
    </svg>
  ),
  reviews: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Tổng quan"   },
  { key: "products",  label: "Sản phẩm"    },
  { key: "orders",    label: "Đơn hàng"    },
  { key: "users",     label: "Người dùng"  },
  { key: "coupons",   label: "Mã giảm giá" },
  { key: "reviews",   label: "Đánh giá"    },
];

const EMPTY_PRODUCT = { name: "", brand: "", sku: "", category: "giay-dep", price: "", image: "", sizes: "38,39,40,41,42,43", info: "", details: "", colors: [] };
const EMPTY_COUPON  = { code: "", discount_type: "percent", discount_value: "", min_order: "", max_uses: "", expires_at: "" };

/* ── Stars display ── */
function Stars({ value }) {
  return (
    <span className="text-yellow-400 text-sm">
      {"★".repeat(value)}{"☆".repeat(5 - value)}
    </span>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      <p className="text-3xl font-black">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");

  // data
  const [summary, setSummary]       = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [revenue, setRevenue]        = useState([]);
  const [products, setProducts]      = useState([]);
  const [orders, setOrders]          = useState([]);
  const [users, setUsers]            = useState([]);
  const [coupons, setCoupons]        = useState([]);
  const [reviews, setReviews]        = useState([]);

  // product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct]   = useState(null);
  const [productForm, setProductForm]         = useState(EMPTY_PRODUCT);
  const [productSaving, setProductSaving]     = useState(false);
  const [imageUploading, setImageUploading]   = useState(false);
  const [productError, setProductError]       = useState(null);

  // coupon form
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm]         = useState(EMPTY_COUPON);
  const [couponSaving, setCouponSaving]     = useState(false);
  const [couponError, setCouponError]       = useState(null);

  // misc
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [productSearch, setProductSearch] = useState("");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    if (!user || !["admin", "manager"].includes(user.role)) {
      navigate("/", { replace: true });
      return;
    }
    fetchDashboard();
    fetchProducts();
    fetchOrders();
    fetchUsers();
    fetchCoupons();
    fetchReviews();
    // Fetch helpers are intentionally stable for this mount-only data load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user]);

  async function fetchDashboard() {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const [s, t, r] = await Promise.all([
        fetch(`${API}/stats/summary`,      { headers }).then(r => r.json()),
        fetch(`${API}/stats/top-products`, { headers }).then(r => r.json()),
        fetch(`${API}/stats/revenue`,      { headers }).then(r => r.json()),
      ]);
      setSummary(s && !s.error ? s : null);
      setTopProducts(Array.isArray(t) ? t : []);
      setRevenue(Array.isArray(r) ? r : []);
    } catch (err) {
      setSummary(null);
      setDashboardError(err.message || "Không thể tải dữ liệu tổng quan");
    } finally {
      setDashboardLoading(false);
    }
  }

  async function fetchProducts() {
    const res = await fetch(`${API}/products`);
    const d = await res.json();
    setProducts(Array.isArray(d) ? d : []);
  }

  async function fetchOrders() {
    const res = await fetch(`${API}/orders`, { headers });
    const d = await res.json();
    setOrders(Array.isArray(d) ? d : []);
  }

  async function fetchUsers() {
    const res = await fetch(`${API}/auth/users`, { headers });
    const d = await res.json();
    setUsers(Array.isArray(d) ? d : []);
  }

  async function fetchCoupons() {
    const res = await fetch(`${API}/coupons`, { headers });
    const d = await res.json();
    setCoupons(Array.isArray(d) ? d : []);
  }

  async function fetchReviews() {
    const res = await fetch(`${API}/reviews`, { headers });
    const d = await res.json();
    setReviews(Array.isArray(d) ? d : []);
  }

  /* ── Orders ── */
  async function updateOrderStatus(id, status) {
    setUpdatingOrder(id);
    await fetch(`${API}/orders/${id}/status`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
    fetchOrders();
    fetchDashboard();
    setUpdatingOrder(null);
  }

  /* ── Products ── */
  function openAddProduct() {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductError(null);
    setShowProductForm(true);
  }

  function openEditProduct(p) {
    setEditingProduct(p.id);
    setProductForm({
      name: p.name, brand: p.brand ?? "", sku: p.sku ?? "",
      category: p.category ?? "giay-dep", price: p.price, image: p.image ?? "",
      sizes: Array.isArray(p.sizes) ? p.sizes.join(",") : "",
      info: Array.isArray(p.info) ? p.info.join("\n") : "",
      details: Array.isArray(p.details) ? p.details.join("\n") : "",
      colors: Array.isArray(p.colors) ? p.colors.map(c => ({ name: c.name, hex: c.hex || "#000000", image: c.image ?? "" })) : [],
    });
    setProductError(null);
    setShowProductForm(true);
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    if (imageUploading) {
      setProductError("Vui lòng chờ ảnh tải lên xong");
      return;
    }
    if (!productForm.name || !productForm.price) { setProductError("Vui lòng nhập tên và giá"); return; }
    setProductSaving(true); setProductError(null);
    const body = {
      name: productForm.name, brand: productForm.brand, sku: productForm.sku,
      category: productForm.category, price: Number(productForm.price), image: productForm.image,
      sizes: productForm.sizes.split(",").map(s => Number(s.trim())).filter(Boolean),
      info: productForm.info.split("\n").map(s => s.trim()).filter(Boolean),
      details: productForm.details.split("\n").map(s => s.trim()).filter(Boolean),
      colors: productForm.colors
        .filter(c => c.name.trim())
        .map(c => ({ name: c.name.trim(), hex: c.hex || "#000000", image: c.image.trim() || null })),
    };
    try {
      const url = editingProduct ? `${API}/products/${editingProduct}` : `${API}/products`;
      const res = await fetch(url, { method: editingProduct ? "PUT" : "POST", headers, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setShowProductForm(false);
      notifyProductsChanged();
      fetchProducts();
      fetchDashboard();
    } catch (err) {
      setProductError(err.message);
    } finally { setProductSaving(false); }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setProductError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API}/products/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải ảnh lên");
      setProductForm((form) => ({ ...form, image: data.url }));
    } catch (err) {
      setProductError(err.message);
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteProduct(id, name) {
    if (!confirm(`Xoá sản phẩm "${name}"?`)) return;
    try {
      const res = await fetch(`${API}/products/${id}`, { method: "DELETE", headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Xóa sản phẩm thất bại");
      notifyProductsChanged();
      window.dispatchEvent(new CustomEvent("shop-products-refresh"));
      fetchProducts();
      fetchDashboard();
    } catch (err) {
      alert(err.message || "Xóa sản phẩm thất bại");
    }
  }

  /* ── Coupons ── */
  async function handleSaveCoupon(e) {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discount_value) { setCouponError("Vui lòng nhập đầy đủ"); return; }
    setCouponSaving(true); setCouponError(null);
    try {
      const res = await fetch(`${API}/coupons`, {
        method: "POST", headers,
        body: JSON.stringify({
          code: couponForm.code,
          discount_type: couponForm.discount_type,
          discount_value: Number(couponForm.discount_value),
          min_order: couponForm.min_order ? Number(couponForm.min_order) : 0,
          max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : null,
          expires_at: couponForm.expires_at || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setShowCouponForm(false);
      setCouponForm(EMPTY_COUPON);
      fetchCoupons();
    } catch (err) {
      setCouponError(err.message);
    } finally { setCouponSaving(false); }
  }

  async function toggleCoupon(id, current) {
    await fetch(`${API}/coupons/${id}`, { method: "PATCH", headers, body: JSON.stringify({ is_active: !current }) });
    fetchCoupons();
  }

  async function deleteCoupon(id) {
    if (!confirm("Xóa mã giảm giá này?")) return;
    await fetch(`${API}/coupons/${id}`, { method: "DELETE", headers });
    fetchCoupons();
  }

  /* ── Reviews ── */
  async function deleteReview(id) {
    if (!confirm("Xóa đánh giá này?")) return;
    await fetch(`${API}/reviews/admin/${id}`, { method: "DELETE", headers });
    fetchReviews();
  }

  /* ── Users ── */
  async function updateUserRole(id, role) {
    await fetch(`${API}/auth/users/${id}/role`, { method: "PATCH", headers, body: JSON.stringify({ role }) });
    fetchUsers();
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand?.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (!user) return null;

  /* ════════════════════════════════ RENDER ════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ══ SIDEBAR ══ */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 fixed h-full z-30">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-lg">
              {user.full_name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div>
              <p className="font-black text-sm leading-tight">Admin Panel</p>
              <p className="text-[10px] text-gray-400">Quản trị hệ thống</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left ${
                tab === key
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <span className="shrink-0">{NAV_ICONS[key]}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-700 truncate">{user.full_name}</p>
          <p className="text-[10px] text-gray-400 truncate mb-2">{user.email}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-3 ${
            user.role === "admin" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
          }`}>
            {user.role === "admin" ? "Admin" : "Manager"}
          </span>
          <div className="flex gap-2">
            <Link to="/" className="flex-1 text-center text-[10px] py-2 border border-gray-200 rounded-lg hover:border-black transition font-semibold">
              Cửa hàng
            </Link>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="flex-1 text-center text-[10px] py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main className="ml-56 flex-1 min-h-screen">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <h1 className="font-black text-lg">
            {NAV_ITEMS.find(n => n.key === tab)?.label ?? "Admin"}
          </h1>
          <p className="text-xs text-gray-400 font-hero tracking-widest">LIZSHOOS</p>
        </header>

        <div className="p-8">

          {/* ══════════ DASHBOARD ══════════ */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              {dashboardLoading ? (
                <p className="text-gray-400 text-sm animate-pulse">Đang tải...</p>
              ) : dashboardError ? (
                <div className="border border-red-100 bg-red-50 rounded-2xl p-6">
                  <p className="text-sm text-red-600 mb-3">{dashboardError}</p>
                  <button
                    type="button"
                    onClick={fetchDashboard}
                    className="bg-black text-white rounded-xl px-4 py-2 text-xs font-semibold"
                  >
                    Thử lại
                  </button>
                </div>
              ) : summary ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Doanh thu"  value={fmt(summary.total_revenue)} sub="Đơn hoàn thành" />
                    <StatCard label="Đơn hàng"   value={summary.total_orders} sub={`${summary.orders_pending ?? 0} chờ xử lý`} />
                    <StatCard label="Sản phẩm"   value={summary.total_products} />
                    <StatCard label="Người dùng" value={summary.total_users} />
                  </div>

                  {/* Order status */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="font-black text-base mb-4">Trạng thái đơn hàng</h2>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(STATUS_LABEL).map(([key, { label, color }]) => (
                        <div key={key} className={`${color} rounded-xl px-4 py-2.5 flex items-center gap-3`}>
                          <span className="text-sm font-semibold">{label}</span>
                          <span className="text-xl font-black">{summary[`orders_${key}`] ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                      <h2 className="font-black text-base mb-4">Sản phẩm bán chạy</h2>
                      <div className="space-y-3">
                        {topProducts.length === 0 && <p className="text-sm text-gray-400">Chưa có dữ liệu</p>}
                        {topProducts.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <span className="w-6 text-center text-xs font-black text-gray-300">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.brand}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black">{p.total_sold} đôi</p>
                              <p className="text-xs text-gray-400">{fmt(p.total_revenue)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                      <h2 className="font-black text-base mb-4">Doanh thu theo tháng</h2>
                      <div className="space-y-3">
                        {revenue.length === 0 && <p className="text-sm text-gray-400">Chưa có dữ liệu</p>}
                        {revenue.map((r) => (
                          <div key={`${r.year}-${r.month}`} className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600">{r.month_label}</span>
                            <div className="text-right">
                              <p className="text-sm font-black">{fmt(r.revenue)}</p>
                              <p className="text-xs text-gray-400">{r.total_orders} đơn</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* ══════════ SẢN PHẨM ══════════ */}
          {tab === "products" && (
            <div className="space-y-5">
              {/* Search + Add */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 pl-9"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
                </div>
                <button onClick={openAddProduct}
                  className="bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition shrink-0">
                  + Thêm sản phẩm
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      {["HÌNH ẢNH", "TÊN SẢN PHẨM", "GIÁ", "SIZES", "THAO TÁC"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                            {p.image
                              ? <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1" />
                              : <span className="text-gray-300 text-sm">N/A</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-bold">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.brand} · SKU: {p.sku}</p>
                        </td>
                        <td className="px-5 py-3 font-bold">{fmt(p.price)}</td>
                        <td className="px-5 py-3 text-xs text-gray-400">
                          {Array.isArray(p.sizes) ? p.sizes.slice(0,4).join(", ") : ""}
                          {Array.isArray(p.sizes) && p.sizes.length > 4 ? "..." : ""}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditProduct(p)}
                              className="w-8 h-8 rounded-lg border border-gray-200 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center transition text-gray-400">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            {user.role === "admin" && (
                              <button onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="w-8 h-8 rounded-lg border border-gray-200 hover:border-red-400 hover:text-red-500 flex items-center justify-center transition text-gray-400">
                                🗑
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-10">Không tìm thấy sản phẩm nào</p>
                )}
              </div>
            </div>
          )}

          {/* ══════════ ĐƠN HÀNG ══════════ */}
          {tab === "orders" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-400">{orders.length} đơn hàng</p>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {["MÃ ĐƠN", "KHÁCH HÀNG", "TỔNG TIỀN", "THANH TOÁN", "TRẠNG THÁI", "CẬP NHẬT", "ĐỊA CHỈ"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <Fragment key={o.id}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-bold text-gray-400">#{o.id}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{o.customer_name}</p>
                        <p className="text-xs text-gray-400">{o.customer_phone}</p>
                      </td>
                      <td className="px-5 py-4 font-bold">{fmt(o.total_amount)}</td>
                      <td className="px-5 py-4 text-xs text-gray-500 uppercase">{o.payment_method}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_LABEL[o.status]?.color}`}>
                          {STATUS_LABEL[o.status]?.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={o.status}
                          disabled={updatingOrder === o.id}
                          onChange={e => updateOrderStatus(o.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 transition disabled:opacity-50"
                        >
                          {Object.entries(STATUS_LABEL).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold hover:border-blue-400"
                        >
                          {expandedOrderId === o.id ? "Ẩn" : "Chi tiết"}
                        </button>
                      </td>
                    </tr>
                    {expandedOrderId === o.id && (
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <td colSpan={7} className="px-6 py-5">
                          <div className="grid gap-5 md:grid-cols-2">
                            <div>
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Địa chỉ nhận hàng</p>
                              <p className="font-semibold">{o.customer_name} · {o.customer_phone}</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{o.customer_address}</p>
                            </div>
                            <div>
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Sản phẩm</p>
                              <div className="space-y-2">
                                {(o.items || []).map((item) => (
                                  <div key={item.id} className="flex justify-between gap-4 text-sm">
                                    <span>{item.product_name} × {item.quantity}{item.size ? ` · Size ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}</span>
                                    <span className="shrink-0 font-semibold">{fmt(Number(item.price) * item.quantity)}</span>
                                  </div>
                                ))}
                                {(o.items || []).length === 0 && <p className="text-sm text-gray-400">Không có thông tin sản phẩm.</p>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ══════════ NGƯỜI DÙNG ══════════ */}
          {tab === "users" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-400">{users.length} người dùng</p>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {["NGƯỜI DÙNG", "EMAIL", "SĐT", "NGÀY TẠO", "QUYỀN"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">
                            {(u.full_name || "?")[0].toUpperCase()}
                          </div>
                          <p className="font-semibold">{u.full_name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{u.email}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{u.phone || "—"}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-4">
                        {user.role === "admin" && u.id !== user.id ? (
                          <select
                            value={u.role}
                            onChange={e => updateUserRole(u.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:border-blue-400"
                          >
                            <option value="user">User</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            u.role === "admin" ? "bg-blue-100 text-blue-600" :
                            u.role === "manager" ? "bg-purple-100 text-purple-600" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ══════════ MÃ GIẢM GIÁ ══════════ */}
          {tab === "coupons" && (
            <div className="space-y-5">
              <div className="flex justify-end">
                <button onClick={() => { setShowCouponForm(true); setCouponForm(EMPTY_COUPON); setCouponError(null); }}
                  className="bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition">
                  + Tạo mã mới
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      {["MÃ", "LOẠI", "GIÁ TRỊ", "ĐƠN TỐI THIỂU", "ĐÃ DÙNG", "TRẠNG THÁI", "THAO TÁC"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-4 font-black tracking-widest">{c.code}</td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {c.discount_type === "percent" ? "%" : "Cố định"}
                        </td>
                        <td className="px-5 py-4 font-bold">
                          {c.discount_type === "percent" ? `${c.discount_value}%` : fmt(c.discount_value)}
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{fmt(c.min_order)}</td>
                        <td className="px-5 py-4 text-gray-500">
                          {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => toggleCoupon(c.id, c.is_active)}
                            className={`text-xs font-bold px-3 py-1 rounded-full transition ${
                              c.is_active ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}>
                            {c.is_active ? "Đang hoạt động" : "Tắt"}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          {user.role === "admin" && (
                            <button onClick={() => deleteCoupon(c.id)}
                              className="w-8 h-8 rounded-lg border border-gray-200 hover:border-red-400 hover:text-red-500 flex items-center justify-center transition text-gray-400">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════ ĐÁNH GIÁ ══════════ */}
          {tab === "reviews" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-400">{reviews.length} đánh giá</p>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {["SẢN PHẨM", "KHÁCH HÀNG", "SAO", "BÌNH LUẬN", "NGÀY", "XÓA"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-sm max-w-40 truncate">{r.product_name}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{r.full_name}</td>
                      <td className="px-5 py-4"><Stars value={r.rating} /></td>
                      <td className="px-5 py-4 text-gray-500 max-w-xs">
                        <p className="truncate">{r.comment || <span className="text-gray-300 italic">Không có bình luận</span>}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {new Date(r.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => deleteReview(r.id)}
                          className="w-8 h-8 rounded-lg border border-gray-200 hover:border-red-400 hover:text-red-500 flex items-center justify-center transition text-gray-400">
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reviews.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-10">Chưa có đánh giá nào</p>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ══ MODAL: Sản phẩm ══ */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-7">
            <h2 className="text-xl font-black mb-6">{editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              {[
                { label: "Tên sản phẩm *", key: "name", placeholder: "Nike Air Force 1" },
                { label: "Thương hiệu", key: "brand", placeholder: "Nike" },
                { label: "SKU", key: "sku", placeholder: "SP000101" },
                { label: "Giá (VNĐ) *", key: "price", placeholder: "2500000", type: "number" },
                { label: "Sizes (cách bằng dấu phẩy)", key: "sizes", placeholder: "38,39,40,41,42,43" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">{label}</label>
                  <input type={type ?? "text"} value={productForm[key]}
                    onChange={e => setProductForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition" />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Ảnh sản phẩm</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={imageUploading}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm file:mr-3 file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:rounded-lg" />
                <p className="text-[10px] text-gray-400 mt-1">{imageUploading ? "Đang tải ảnh lên..." : "JPG, PNG hoặc WebP, tối đa 5MB"}</p>
                {productForm.image && <img src={productForm.image} alt="Xem trước sản phẩm" className="mt-3 w-24 h-24 rounded-xl object-cover border border-gray-100" />}
                <input type="url" value={productForm.image} onChange={e => setProductForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="Hoặc nhập URL ảnh..." className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition" />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">
                  Màu sắc
                </label>
                <div className="space-y-2">
                  {productForm.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="color" value={c.hex}
                        onChange={e => setProductForm(f => ({
                          ...f, colors: f.colors.map((row, j) => j === i ? { ...row, hex: e.target.value } : row)
                        }))}
                        className="w-10 h-10 rounded-lg border border-gray-200 shrink-0 cursor-pointer" />
                      <input type="text" value={c.name} placeholder="Tên màu (vd: Đỏ)"
                        onChange={e => setProductForm(f => ({
                          ...f, colors: f.colors.map((row, j) => j === i ? { ...row, name: e.target.value } : row)
                        }))}
                        className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 transition" />
                      <input type="text" value={c.image} placeholder="Link ảnh riêng (không bắt buộc)"
                        onChange={e => setProductForm(f => ({
                          ...f, colors: f.colors.map((row, j) => j === i ? { ...row, image: e.target.value } : row)
                        }))}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 transition" />
                      <button type="button"
                        onClick={() => setProductForm(f => ({ ...f, colors: f.colors.filter((_, j) => j !== i) }))}
                        className="text-gray-300 hover:text-red-400 transition shrink-0 px-1">✕</button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setProductForm(f => ({ ...f, colors: [...f.colors, { name: "", hex: "#000000", image: "" }] }))}
                    className="text-xs font-bold text-blue-500 hover:text-blue-700 transition">+ Thêm màu</button>
                </div>
              </div>
              {["info", "details"].map(key => (
                <div key={key}>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">
                    {key === "info" ? "Thông tin (mỗi dòng 1 mục)" : "Chi tiết (mỗi dòng 1 mục)"}
                  </label>
                  <textarea rows={3} value={productForm[key]}
                    onChange={e => setProductForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition resize-none" />
                </div>
              ))}
              {productError && <p className="text-red-400 text-xs bg-red-50 rounded-xl px-4 py-2">{productError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProductForm(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-bold hover:border-black transition">Huỷ</button>
                <button type="submit" disabled={productSaving || imageUploading}
                  className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition disabled:opacity-50">
                  {productSaving ? "Đang lưu..." : editingProduct ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Coupon ══ */}
      {showCouponForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-7">
            <h2 className="text-xl font-black mb-6">Tạo mã giảm giá</h2>
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {[
                { label: "Mã giảm giá *", key: "code", placeholder: "SALE10" },
                { label: "Giá trị *", key: "discount_value", placeholder: "10", type: "number" },
                { label: "Đơn tối thiểu (đ)", key: "min_order", placeholder: "0", type: "number" },
                { label: "Số lần dùng tối đa", key: "max_uses", placeholder: "Không giới hạn", type: "number" },
                { label: "Hết hạn", key: "expires_at", type: "datetime-local" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">{label}</label>
                  <input type={type ?? "text"} value={couponForm[key]}
                    onChange={e => setCouponForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition" />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Loại giảm giá</label>
                <div className="flex gap-2">
                  {[{ v: "percent", l: "% Phần trăm" }, { v: "fixed", l: "Cố định (đ)" }].map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => setCouponForm(f => ({ ...f, discount_type: v }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${
                        couponForm.discount_type === v ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500"
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {couponError && <p className="text-red-400 text-xs bg-red-50 rounded-xl px-4 py-2">{couponError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCouponForm(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-bold hover:border-black transition">Huỷ</button>
                <button type="submit" disabled={couponSaving}
                  className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition disabled:opacity-50">
                  {couponSaving ? "Đang tạo..." : "Tạo mã"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
