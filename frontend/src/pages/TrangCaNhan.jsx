import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { useWishlist } from "../context/useWishlist";
import { API_URL } from "../lib/config";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition placeholder:text-gray-300";

const TABS = [
  { key: "profile", label: "Thông tin" },
  { key: "password", label: "Mật khẩu" },
  { key: "wishlist", label: "Yêu thích" },
];

export default function TrangCaNhan() {
  const { user, token, login, isLoggedIn } = useAuth();
  const { items, fetchItems } = useWishlist();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [pass, setPass] = useState({ old_password: "", new_password: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/dang-nhap"); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile({ full_name: user.full_name || "", phone: user.phone || "" });
  }, [isLoggedIn, user, navigate]);

  useEffect(() => {
    if (activeTab === "wishlist") fetchItems();
  }, [activeTab, fetchItems]);

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const handleProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT", headers: authHeaders,
        body: JSON.stringify({ full_name: profile.full_name, phone: profile.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user, token);
      setProfileMsg({ type: "ok", text: "Cập nhật thành công!" });
    } catch (err) {
      setProfileMsg({ type: "err", text: err.message });
    } finally { setProfileLoading(false); }
  };

  const handlePass = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    if (pass.new_password !== pass.confirm)
      return setPassMsg({ type: "err", text: "Mật khẩu xác nhận không khớp" });
    if (pass.new_password.length < 6)
      return setPassMsg({ type: "err", text: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    setPassLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT", headers: authHeaders,
        body: JSON.stringify({ old_password: pass.old_password, new_password: pass.new_password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPass({ old_password: "", new_password: "", confirm: "" });
      setPassMsg({ type: "ok", text: "Đổi mật khẩu thành công!" });
    } catch (err) {
      setPassMsg({ type: "err", text: err.message });
    } finally { setPassLoading(false); }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1">Tài khoản</p>
          <h1 className="text-5xl font-black">Cá nhân</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition ${
                activeTab === t.key ? "bg-white shadow text-black" : "text-gray-400 hover:text-black"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── Tab: Thông tin ─── */}
        {activeTab === "profile" && (
          <div className="bg-white border border-gray-100 rounded-3xl p-8">
            <form onSubmit={handleProfile} className="space-y-4">
              <Field label="Họ và tên *">
                <input value={profile.full_name}
                  onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Nguyễn Văn A" required className={inputCls} />
              </Field>
              <Field label="Email (không thể thay đổi)">
                <input value={user.email} disabled
                  className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
              </Field>
              <Field label="Số điện thoại">
                <input value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="0901 234 567" className={inputCls} />
              </Field>
              {profileMsg && (
                <p className={`text-xs px-4 py-2 rounded-xl border ${
                  profileMsg.type === "ok"
                    ? "text-green-600 bg-green-50 border-green-100"
                    : "text-red-400 bg-red-50 border-red-100"
                }`}>{profileMsg.text}</p>
              )}
              <button type="submit" disabled={profileLoading}
                className="bg-black text-white px-8 py-3 rounded-2xl font-bold text-sm tracking-widest uppercase hover:opacity-80 transition disabled:opacity-50">
                {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          </div>
        )}

        {/* ─── Tab: Đổi mật khẩu ─── */}
        {activeTab === "password" && (
          <div className="bg-white border border-gray-100 rounded-3xl p-8">
            <form onSubmit={handlePass} className="space-y-4">
              {[
                { label: "Mật khẩu hiện tại", key: "old_password", placeholder: "••••••••" },
                { label: "Mật khẩu mới", key: "new_password", placeholder: "Ít nhất 6 ký tự" },
                { label: "Xác nhận mật khẩu mới", key: "confirm", placeholder: "Nhập lại mật khẩu mới" },
              ].map(({ label, key, placeholder }) => (
                <Field key={key} label={label}>
                  <input type="password" value={pass[key]}
                    onChange={e => setPass(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} required className={inputCls} />
                </Field>
              ))}
              {passMsg && (
                <p className={`text-xs px-4 py-2 rounded-xl border ${
                  passMsg.type === "ok"
                    ? "text-green-600 bg-green-50 border-green-100"
                    : "text-red-400 bg-red-50 border-red-100"
                }`}>{passMsg.text}</p>
              )}
              <button type="submit" disabled={passLoading}
                className="bg-black text-white px-8 py-3 rounded-2xl font-bold text-sm tracking-widest uppercase hover:opacity-80 transition disabled:opacity-50">
                {passLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>
        )}

        {/* ─── Tab: Wishlist ─── */}
        {activeTab === "wishlist" && (
          <div className="bg-white border border-gray-100 rounded-3xl p-8">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-4">🤍</p>
                <p className="font-bold text-lg mb-2">Chưa có sản phẩm yêu thích</p>
                <p className="text-sm text-gray-400 mb-6">Bấm vào biểu tượng tim trên sản phẩm để lưu</p>
                <Link to="/san-pham"
                  className="bg-black text-white px-8 py-3 rounded-2xl font-bold text-sm tracking-widest uppercase hover:opacity-80 transition inline-block">
                  Khám phá sản phẩm
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 mb-4">{items.length} sản phẩm yêu thích</p>
                {items.map((item) => (
                  <Link
                    key={item.product_id}
                    to={`/san-pham/${item.product_id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-black transition group"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={item.image} alt={item.name}
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 tracking-widest uppercase">{item.brand}</p>
                      <p className="font-bold text-sm truncate group-hover:underline underline-offset-2">{item.name}</p>
                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {Number(item.price).toLocaleString("vi-VN")}₫
                      </p>
                    </div>
                    <span className="text-gray-300 group-hover:text-black transition text-lg">›</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
