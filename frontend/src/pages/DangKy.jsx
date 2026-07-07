import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL } from "../lib/config";

export default function DangKy() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm)
      return setError("Mật khẩu xác nhận không khớp");
    if (form.password.length < 6)
      return setError("Mật khẩu phải có ít nhất 6 ký tự");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user, data.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left decorative */}
      <div className="hidden lg:flex flex-1 bg-black items-center justify-center">
        <p className="font-hero text-white" style={{ fontSize: "12vw", lineHeight: 1 }}>
          LIZSHOOS
        </p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-xs text-gray-400 hover:text-black transition mb-10 block">
            ← Về trang chủ
          </Link>

          <h1 className="text-4xl font-black mb-1">Tạo tài khoản</h1>
          <p className="text-gray-400 text-sm mb-8">
            Đã có tài khoản?{" "}
            <Link to="/dang-nhap" className="text-black font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>

          <div className="mb-6">
            <GoogleLogin
              onSuccess={async (res) => {
                try {
                  const r = await fetch(`${API_URL}/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ credential: res.credential }),
                  });
                  const data = await r.json();
                  if (!r.ok) throw new Error(data.error);
                  login(data.user, data.token);
                  navigate("/", { replace: true });
                } catch (err) {
                  setError(err.message);
                }
              }}
              onError={() => setError("Đăng ký Google thất bại")}
              width="100%"
              text="signup_with"
              shape="rectangular"
              size="large"
            />
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300">hoặc</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Họ và tên", name: "full_name", type: "text", placeholder: "Nguyễn Văn A" },
              { label: "Email", name: "email", type: "email", placeholder: "example@email.com" },
              { label: "Mật khẩu", name: "password", type: "password", placeholder: "Ít nhất 6 ký tự" },
              { label: "Xác nhận mật khẩu", name: "confirm", type: "password", placeholder: "Nhập lại mật khẩu" },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">
                  {label}
                </label>
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  required
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition placeholder:text-gray-300"
                />
              </div>
            ))}

            {error && (
              <p className="text-red-400 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3.5 rounded-2xl font-bold text-sm tracking-widest uppercase hover:opacity-80 transition disabled:opacity-50 mt-2"
            >
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
