import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { useProducts } from "../hooks/useProducts";
import { API_URL } from "../lib/config";

const API = API_URL;

const navLinks = [
  { label: "HOME", to: "/" },
  { label: "SẢN PHẨM", to: "/san-pham" },
  { label: "GIỚI THIỆU", to: "/gioi-thieu" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const { cart } = useCart();
  const { user, token, isLoggedIn, logout } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [unread, setUnread] = useState(0);

  const searchResults = searchQ.trim().length > 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQ.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const fetchUnread = () =>
      fetch(`${API}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setUnread(data.filter((n) => !n.is_read).length))
        .catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, token]);

  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-hero text-2xl text-white tracking-widest">
          LIZSHOOS
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `text-xs font-semibold tracking-[0.2em] transition ${
                  isActive ? "text-white" : "text-gray-400 hover:text-white"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-5">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            <button onClick={() => { setSearchOpen(!searchOpen); setSearchQ(""); }}
              className="text-white hover:opacity-60 transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-9 w-72 z-50">
                <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full bg-white text-black text-sm px-4 py-3 rounded-2xl shadow-xl outline-none border border-gray-100" />
                {searchResults.length > 0 && (
                  <div className="mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {searchResults.map(p => (
                      <Link key={p.id} to={`/san-pham/${p.id}`}
                        onClick={() => { setSearchOpen(false); setSearchQ(""); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-contain rounded-lg bg-gray-100 p-1 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.brand} — {p.price.toLocaleString("vi-VN")}₫</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {searchQ.trim().length > 1 && searchResults.length === 0 && (
                  <div className="mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 text-xs text-gray-400">
                    Không tìm thấy sản phẩm
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-white hover:opacity-60 transition"
                >
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                    <span className="text-black text-[10px] font-black">
                      {user.full_name?.[0]?.toUpperCase() ?? "U"}
                    </span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-bold truncate">{user.full_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/ca-nhan"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-3 text-xs font-semibold hover:bg-gray-50 transition border-b border-gray-100"
                    >
                      Trang cá nhân
                    </Link>
                    {["admin", "manager"].includes(user.role) && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition border-b border-gray-100"
                      >
                        Trang quản trị
                      </Link>
                    )}
                    <Link
                      to="/don-hang"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-xs font-semibold hover:bg-gray-50 transition border-b border-gray-100"
                    >
                      <span>Đơn hàng của tôi</span>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {unread}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-xs text-red-500 hover:bg-red-50 transition font-semibold"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/dang-nhap"
                className="text-xs font-semibold tracking-widest text-gray-400 hover:text-white transition"
              >
                ĐĂNG NHẬP
              </Link>
            )}
          </div>

          <Link to="/cart" className="relative text-white hover:opacity-60 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-white text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black border-t border-white/10">
          {/* Nav links */}
          <nav className="flex flex-col px-6 pt-4 gap-1">
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `text-xs font-semibold tracking-[0.2em] py-3 border-b border-white/10 transition ${
                    isActive ? "text-white" : "text-gray-400 hover:text-white"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User + Cart section */}
          <div className="px-6 py-5 flex flex-col gap-3">
            {isLoggedIn ? (
              <>
                {/* User info */}
                <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0">
                    <span className="text-black text-xs font-black">
                      {user.full_name?.[0]?.toUpperCase() ?? "U"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">{user.full_name}</p>
                    <p className="text-gray-400 text-[11px] truncate">{user.email}</p>
                  </div>
                </div>

                {["admin", "manager"].includes(user.role) && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-center text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-2xl py-3 hover:bg-blue-500/20 transition"
                  >
                    Trang quản trị
                  </Link>
                )}

                <Link
                  to="/don-hang"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between text-xs font-semibold text-gray-300 bg-white/5 rounded-2xl px-4 py-3 hover:bg-white/10 transition"
                >
                  <span>Đơn hàng của tôi</span>
                  {unread > 0 && (
                    <span className="bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {unread}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl py-3 hover:bg-red-500/20 transition"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  to="/dang-nhap"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center text-xs font-semibold text-gray-300 border border-white/20 rounded-2xl py-3 hover:border-white hover:text-white transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dang-ky"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center text-xs font-bold text-black bg-white rounded-2xl py-3 hover:opacity-80 transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Cart button */}
            <Link
              to="/cart"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between text-xs font-semibold text-gray-300 bg-white/5 rounded-2xl px-4 py-3 hover:bg-white/10 transition"
            >
              <span>Giỏ hàng</span>
              {totalItems > 0 ? (
                <span className="bg-white text-black text-[9px] font-black px-2 py-0.5 rounded-full">
                  {totalItems} sản phẩm
                </span>
              ) : (
                <span className="text-gray-600 text-[11px]">Trống</span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
