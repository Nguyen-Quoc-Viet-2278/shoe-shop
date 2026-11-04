import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL, GOOGLE_CLIENT_ID } from "../lib/config";
import PasswordField from "../components/PasswordField";

export default function DangNhap() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user, data.token);
      const dest = ["admin", "manager"].includes(data.user.role) ? "/admin" : from;
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f5f4] px-4 py-8">
      <div className="w-full max-w-[440px]">
        <Link to="/" className="mb-5 flex flex-col items-center text-center" aria-label="LIZSHOOS - Về trang chủ">
          <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8b7654]">Premium footwear</span>
          <span className="font-hero text-4xl leading-none tracking-wide text-[#1b1714]">LIZSHOOS</span>
        </Link>

        <section className="rounded-3xl border border-[#e3e9e7] bg-white p-6 shadow-[0_20px_55px_rgba(20,35,31,0.08)] sm:p-8">
          <Link to="/" className="mb-6 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8581] hover:text-[#1b1714]">
            ← Về trang chủ
          </Link>

          <h1 className="mb-1 font-hero text-4xl text-[#1b1714]">Đăng nhập</h1>
          <p className="mb-6 text-sm leading-6 text-[#7a8581]">
            Chưa có tài khoản?{" "}
            <Link to="/dang-ky" className="font-semibold text-[#1b1714] underline-offset-4 hover:underline">Đăng ký ngay</Link>
          </p>

          {GOOGLE_CLIENT_ID && (
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
                    const dest = ["admin", "manager"].includes(data.user.role) ? "/admin" : from;
                    navigate(dest, { replace: true });
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                onError={() => setError("Đăng nhập Google thất bại")}
                width="100%"
                text="signin_with"
                shape="rectangular"
                size="large"
              />
            </div>
          )}

          {GOOGLE_CLIENT_ID && (
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#efe5d8]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#9b8c80]">hoặc</span>
              <div className="h-px flex-1 bg-[#efe5d8]" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a8581]">Email</label>
              <input id="login-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@email.com" autoComplete="email" required className="soft-input" />
            </div>

            <div>
              <PasswordField
                id="login-password"
                name="password"
                label="Mật khẩu"
                value={form.password}
                onChange={handleChange}
                visible={passwordVisible}
                onToggle={() => setPasswordVisible((visible) => !visible)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
            </div>

            {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-500">{error}</p>}

            <button type="submit" disabled={loading} className="primary-btn mt-2 w-full py-3.5 text-[11px]">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className="pt-1 text-center">
              <Link to="/quen-mat-khau" className="text-xs text-[#7a706a] hover:text-[#1b1714]">Quên mật khẩu?</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
