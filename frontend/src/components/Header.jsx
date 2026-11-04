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
  { label: "LIÊN HỆ", to: "/lien-he" },
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
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQ.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#ece4dd] bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="section-shell flex items-center justify-between py-4">
        <Link to="/" className="font-hero text-4xl leading-none tracking-[0.12em] text-[#17120d]">
          LIZSHOOS
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `text-[11px] font-semibold tracking-[0.28em] transition ${
                  isActive ? "text-[#17120d]" : "text-[#70675f] hover:text-[#17120d]"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:gap-5">
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                setSearchQ("");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e8d9c8] bg-white text-[#17120d] shadow-sm transition hover:border-[#cdae73]"
              aria-label="Tìm kiếm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>

            {searchOpen && (
              <div className="absolute right-0 top-12 z-50 w-72">
                <input
                  autoFocus
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full rounded-2xl border border-[#eadbc0] bg-white px-4 py-3 text-sm text-[#1b1714] outline-none shadow-[0_16px_35px_rgba(0,0,0,0.08)] placeholder:text-[#8b8178]"
                />

                {searchResults.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-[#f0e9df] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
                    {searchResults.map((p) => (
                      <Link
                        key={p.id}
                        to={`/san-pham/${p.id}`}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQ("");
                        }}
                        className="flex items-center gap-3 border-b border-[#f3eee7] px-4 py-3 last:border-0 hover:bg-[#f8f4ef] transition"
                      >
                        <img src={p.image} alt={p.name} className="h-10 w-10 rounded-xl bg-[#f4f1ed] object-cover p-1" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#1c1917]">{p.name}</p>
                          <p className="text-[10px] text-[#7a706a]">{p.brand} — {p.price.toLocaleString("vi-VN")}₫</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {searchQ.trim().length > 1 && searchResults.length === 0 && (
                  <div className="mt-2 rounded-2xl border border-[#f0e9df] bg-white px-4 py-3 text-xs text-[#7a706a] shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
                    Không tìm thấy sản phẩm
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e8d9c8] bg-[#f8f4ef] text-[#17120d] transition hover:border-[#cdae73]"
                >
                  <span className="text-[10px] font-black text-[#17120d]">
                    {user.full_name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-[#ede5df] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
                    <div className="border-b border-[#f1ece5] px-4 py-3">
                      <p className="truncate text-xs font-bold text-[#1a1715]">{user.full_name}</p>
                      <p className="truncate text-[10px] text-[#7d7269]">{user.email}</p>
                    </div>
                    <Link to="/ca-nhan" onClick={() => setUserMenuOpen(false)} className="block border-b border-[#f1ece5] px-4 py-3 text-xs font-semibold text-[#3a302d] hover:bg-[#f8f4ef] transition">
                      Trang cá nhân
                    </Link>
                    {['admin', 'manager'].includes(user.role) && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="block border-b border-[#f1ece5] px-4 py-3 text-xs font-semibold text-[#7a5e2f] hover:bg-[#f9f1e2] transition">
                        Trang quản trị
                      </Link>
                    )}
                    <Link to="/don-hang" onClick={() => setUserMenuOpen(false)} className="flex items-center justify-between border-b border-[#f1ece5] px-4 py-3 text-xs font-semibold text-[#3a302d] hover:bg-[#f8f4ef] transition">
                      <span>Đơn hàng của tôi</span>
                      {unread > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </Link>
                    <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-xs font-semibold text-red-500 hover:bg-red-50 transition">
                      Đăng xuất
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/dang-nhap" className="text-[11px] font-semibold tracking-[0.2em] text-[#3d352e] hover:text-[#17120d]">
                ĐĂNG NHẬP
              </Link>
            )}
          </div>

          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e8d9c8] bg-white text-[#17120d] shadow-sm transition hover:border-[#cdae73]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4 3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-3z" />
              <path d="M3 7h18" />
              <path d="M9 11a3 3 0 0 0 6 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f0d89e] text-[9px] font-bold text-[#1a1715]">
                {totalItems}
              </span>
            )}
          </Link>

          <button className="text-[#17120d] md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Mở menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-[#e7d8c8] bg-[#f7f1ea] md:hidden">
          <nav className="flex flex-col px-6 pt-4">
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `border-b border-[#e7d8c8] py-3 text-[11px] font-semibold tracking-[0.24em] transition ${
                    isActive ? "text-[#17120d]" : "text-[#625b56] hover:text-[#17120d]"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col gap-3 px-6 py-5">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl border border-[#f0e8e1] bg-[#f9f5f1] px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0d89e] text-xs font-black text-[#1a1715]">
                    {user.full_name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1a1715]">{user.full_name}</p>
                    <p className="truncate text-[11px] text-[#7d7269]">{user.email}</p>
                  </div>
                </div>

                {['admin', 'manager'].includes(user.role) && (
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="rounded-2xl border border-[#f0e8e1] bg-[#f9f5f1] px-4 py-3 text-center text-xs font-semibold text-[#1c1917]">
                    Trang quản trị
                  </Link>
                )}

                <Link to="/don-hang" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between rounded-2xl border border-[#f0e8e1] bg-[#f9f5f1] px-4 py-3 text-xs font-semibold text-[#1c1917]">
                  <span>Đơn hàng của tôi</span>
                  {unread > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">{unread}</span>}
                </Link>

                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-500">
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/dang-nhap" onClick={() => setIsMenuOpen(false)} className="flex-1 rounded-2xl border border-[#e8d9c8] bg-white px-4 py-3 text-center text-xs font-semibold text-[#1c1917]">
                  Đăng nhập
                </Link>
                <Link to="/dang-ky" onClick={() => setIsMenuOpen(false)} className="flex-1 rounded-2xl bg-[#17120d] px-4 py-3 text-center text-xs font-bold text-white">
                  Đăng ký
                </Link>
              </div>
            )}

            <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between rounded-2xl border border-[#f0e8e1] bg-[#f9f5f1] px-4 py-3 text-xs font-semibold text-[#1c1917]">
              <span>Giỏ hàng</span>
              {totalItems > 0 ? (
                <span className="rounded-full bg-[#17120d] px-2 py-0.5 text-[9px] font-black text-white">{totalItems} sản phẩm</span>
              ) : (
                <span className="text-[11px] text-[#8b8178]">Trống</span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
