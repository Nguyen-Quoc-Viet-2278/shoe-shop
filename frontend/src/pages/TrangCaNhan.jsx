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
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a706a]">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "soft-input";

const TABS = [
  { key: "profile", label: "Thông tin" },
  { key: "password", label: "Mật khẩu" },
  { key: "addresses", label: "Địa chỉ" },
  { key: "wishlist", label: "Yêu thích" },
];
const EMPTY_ADDRESS = { full_name: "", phone: "", address: "", is_default: false };

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
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressMsg, setAddressMsg] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/dang-nhap"); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile({ full_name: user.full_name || "", phone: user.phone || "" });
  }, [isLoggedIn, user, navigate]);

  useEffect(() => {
    if (activeTab === "wishlist") fetchItems();
  }, [activeTab, fetchItems]);

  useEffect(() => {
    if (activeTab !== "addresses" || !token) return;
    fetch(`${API_URL}/addresses`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không thể tải địa chỉ");
        setAddresses(data);
      })
      .catch((err) => setAddressMsg({ type: "err", text: err.message }));
  }, [activeTab, token]);

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const resetAddressForm = () => {
    setAddressForm(EMPTY_ADDRESS);
    setEditingAddressId(null);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressLoading(true);
    setAddressMsg(null);
    try {
      const res = await fetch(
        `${API_URL}/addresses${editingAddressId ? `/${editingAddressId}` : ""}`,
        {
          method: editingAddressId ? "PUT" : "POST",
          headers: authHeaders,
          body: JSON.stringify(addressForm),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu địa chỉ");
      const refreshed = await fetch(`${API_URL}/addresses`, { headers: authHeaders });
      const list = await refreshed.json();
      if (!refreshed.ok) throw new Error(list.error || "Không thể tải địa chỉ");
      setAddresses(list);
      resetAddressForm();
      setAddressMsg({ type: "ok", text: "Đã lưu địa chỉ." });
    } catch (err) {
      setAddressMsg({ type: "err", text: err.message });
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressDelete = async (id) => {
    if (!window.confirm("Xóa địa chỉ này?")) return;
    setAddressMsg(null);
    try {
      const res = await fetch(`${API_URL}/addresses/${id}`, { method: "DELETE", headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể xóa địa chỉ");
      setAddresses((current) => current.filter((address) => address.id !== id));
      setAddressMsg({ type: "ok", text: "Đã xóa địa chỉ." });
    } catch (err) {
      setAddressMsg({ type: "err", text: err.message });
    }
  };

  const editAddress = (address) => {
    setAddressForm({
      full_name: address.full_name,
      phone: address.phone,
      address: address.address,
      is_default: Boolean(address.is_default),
    });
    setEditingAddressId(address.id);
  };

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
    <div className="page-shell min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <div className="mb-8">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#8b8178]">Tài khoản</p>
          <h1 className="font-hero text-5xl text-[#1b1714] md:text-6xl">Cá nhân</h1>
        </div>

        <div className="mb-8 flex gap-1 rounded-[22px] bg-[#efe8e2] p-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 rounded-[16px] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                activeTab === t.key ? "bg-white text-[#1b1714] shadow-sm" : "text-[#7a706a] hover:text-[#1b1714]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <div className="soft-card rounded-[30px] p-6 md:p-8">
            <form onSubmit={handleProfile} className="space-y-4">
              <Field label="Họ và tên *">
                <input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Nguyễn Văn A" required className={inputCls} />
              </Field>
              <Field label="Email (không thể thay đổi)">
                <input value={user.email} disabled className={`${inputCls} cursor-not-allowed bg-[#f5f1ee] text-[#7a706a]`} />
              </Field>
              <Field label="Số điện thoại">
                <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="0901 234 567" className={inputCls} />
              </Field>
              {profileMsg && (
                <p className={`rounded-2xl border px-4 py-2 text-xs ${profileMsg.type === "ok" ? "border-green-100 bg-green-50 text-green-600" : "border-red-100 bg-red-50 text-red-500"}`}>
                  {profileMsg.text}
                </p>
              )}
              <button type="submit" disabled={profileLoading} className="primary-btn px-8 py-3.5 text-[10px]">
                {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "password" && (
          <div className="soft-card rounded-[30px] p-6 md:p-8">
            <form onSubmit={handlePass} className="space-y-4">
              {[
                { label: "Mật khẩu hiện tại", key: "old_password", placeholder: "••••••••" },
                { label: "Mật khẩu mới", key: "new_password", placeholder: "Ít nhất 6 ký tự" },
                { label: "Xác nhận mật khẩu mới", key: "confirm", placeholder: "Nhập lại mật khẩu mới" },
              ].map(({ label, key, placeholder }) => (
                <Field key={key} label={label}>
                  <input type="password" value={pass[key]} onChange={e => setPass(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} required className={inputCls} />
                </Field>
              ))}
              {passMsg && (
                <p className={`rounded-2xl border px-4 py-2 text-xs ${passMsg.type === "ok" ? "border-green-100 bg-green-50 text-green-600" : "border-red-100 bg-red-50 text-red-500"}`}>
                  {passMsg.text}
                </p>
              )}
              <button type="submit" disabled={passLoading} className="primary-btn px-8 py-3.5 text-[10px]">
                {passLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "addresses" && (
          <div className="space-y-5">
            <div className="soft-card rounded-[30px] p-6 md:p-8">
              <h2 className="mb-5 text-lg font-bold text-[#1b1714]">
                {editingAddressId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ"}
              </h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <Field label="Họ và tên người nhận">
                  <input value={addressForm.full_name} onChange={(e) => setAddressForm((prev) => ({ ...prev, full_name: e.target.value }))} required maxLength={255} className={inputCls} />
                </Field>
                <Field label="Số điện thoại">
                  <input value={addressForm.phone} onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))} required maxLength={20} className={inputCls} />
                </Field>
                <Field label="Địa chỉ giao hàng">
                  <textarea value={addressForm.address} onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))} required rows={3} className={`${inputCls} resize-y`} />
                </Field>
                <label className="flex items-center gap-2 text-sm text-[#5d5752]">
                  <input type="checkbox" checked={addressForm.is_default} onChange={(e) => setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))} />
                  Đặt làm địa chỉ mặc định
                </label>
                {addressMsg && (
                  <p role="status" className={`rounded-2xl border px-4 py-2 text-xs ${addressMsg.type === "ok" ? "border-green-100 bg-green-50 text-green-600" : "border-red-100 bg-red-50 text-red-500"}`}>
                    {addressMsg.text}
                  </p>
                )}
                <div className="flex gap-3">
                  <button type="submit" disabled={addressLoading} className="primary-btn px-8 py-3.5 text-[10px]">
                    {addressLoading ? "Đang lưu..." : "Lưu địa chỉ"}
                  </button>
                  {editingAddressId && (
                    <button type="button" onClick={resetAddressForm} className="rounded-full border border-[#e8dcca] px-6 py-3 text-xs">
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-3">
              {addresses.map((address) => (
                <div key={address.id} className="soft-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-[#1b1714]">
                        {address.full_name} · {address.phone}
                        {address.is_default && <span className="ml-2 rounded-full bg-[#f7f0d8] px-2 py-1 text-[9px] uppercase tracking-wider text-[#8e6b00]">Mặc định</span>}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[#5d5752]">{address.address}</p>
                    </div>
                    <div className="flex shrink-0 gap-3 text-xs">
                      <button type="button" onClick={() => editAddress(address)} className="font-semibold text-[#946f2d]">Sửa</button>
                      <button type="button" onClick={() => handleAddressDelete(address.id)} className="font-semibold text-red-500">Xóa</button>
                    </div>
                  </div>
                </div>
              ))}
              {addresses.length === 0 && <p className="py-6 text-center text-sm text-[#8b8178]">Bạn chưa lưu địa chỉ giao hàng nào.</p>}
            </div>
          </div>
        )}

        {activeTab === "wishlist" && (
          <div className="soft-card rounded-[30px] p-6 md:p-8">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="mb-4 text-5xl">🤍</p>
                <p className="mb-2 text-lg font-bold text-[#1b1714]">Chưa có sản phẩm yêu thích</p>
                <p className="mb-6 text-sm text-[#7a706a]">Bấm vào biểu tượng tim trên sản phẩm để lưu</p>
                <Link to="/san-pham" className="primary-btn px-8 py-3.5 text-[10px]">Khám phá sản phẩm</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[#8b8178]">{items.length} sản phẩm yêu thích</p>
                {items.map((item) => (
                  <Link key={item.product_id} to={`/san-pham/${item.product_id}`} className="group flex items-center gap-4 rounded-[24px] border border-[#efe5d8] p-4 transition hover:border-[#1b1714]">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-[#f4efe9]">
                      <img src={item.image} alt={item.name} className="h-full w-full object-contain p-1 transition group-hover:scale-105" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#8b8178]">{item.brand}</p>
                      <p className="truncate text-sm font-bold text-[#1b1714] group-hover:text-[#946f2d]">{item.name}</p>
                      <p className="mt-1 text-sm font-semibold text-[#413d39]">{Number(item.price).toLocaleString("vi-VN")}₫</p>
                    </div>
                    <span className="text-lg text-[#b9afa5] transition group-hover:text-[#1b1714]">›</span>
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
