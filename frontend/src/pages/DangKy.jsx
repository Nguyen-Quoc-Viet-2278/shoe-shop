import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL, GOOGLE_CLIENT_ID } from "../lib/config";
import PasswordField from "../components/PasswordField";

export default function DangKy() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirm: false });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const passwordStrength = [
    form.password.length >= 6,
    /[A-Z]/.test(form.password) && /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length;
  const passwordsMatch = form.confirm.length > 0 && form.password === form.confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm) return setError("Mật khẩu xác nhận không khớp");
    if (form.password.length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự");
    if (form.phone && !/^[0-9+\-\s().]{8,20}$/.test(form.phone)) {
      return setError("Số điện thoại gồm 8 đến 20 ký tự số hoặc ký tự + - ( )");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
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
    <main className="flex min-h-screen items-center justify-center bg-[#f2f5f4] px-4 py-8">
      <div className="w-full max-w-[560px]">
        <Link to="/" className="mb-5 flex flex-col items-center text-center" aria-label="LIZSHOOS - Về trang chủ">
          <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8b7654]">Premium footwear</span>
          <span className="font-hero text-4xl leading-none tracking-wide text-[#1b1714]">LIZSHOOS</span>
        </Link>

        <section className="rounded-3xl border border-[#e3e9e7] bg-white p-6 shadow-[0_20px_55px_rgba(20,35,31,0.08)] sm:p-8">
          <Link to="/" className="mb-6 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8581] hover:text-[#1b1714]">
            ← Về trang chủ
          </Link>

          <h1 className="mb-1 font-hero text-4xl text-[#1b1714]">Tạo tài khoản</h1>
          <p className="mb-6 text-sm leading-6 text-[#7a8581]">
            Đã có tài khoản? <Link to="/dang-nhap" className="font-semibold text-[#1b1714] underline-offset-4 hover:underline">Đăng nhập</Link>
          </p>

          {GOOGLE_CLIENT_ID && <div className="mb-6">
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
          </div>}

          {GOOGLE_CLIENT_ID && <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#efe5d8]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#9b8c80]">hoặc</span>
            <div className="h-px flex-1 bg-[#efe5d8]" />
          </div>}

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="register-name" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a8581]">Họ và tên</label>
              <input id="register-name" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Nguyễn Văn A" autoComplete="name" required className="soft-input" />
            </div>
            <div>
              <label htmlFor="register-email" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a8581]">Email</label>
              <input id="register-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@email.com" autoComplete="email" required className="soft-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="register-phone" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a8581]">Số điện thoại</label>
              <input id="register-phone" name="phone" type="tel" inputMode="tel" pattern="[0-9+\-\s().]{8,20}" title="Số điện thoại gồm 8 đến 20 ký tự số hoặc ký tự + - ( )" value={form.phone} onChange={handleChange} placeholder="0912 345 678" autoComplete="tel" className="soft-input" />
            </div>

            <div>
              <PasswordField
                id="register-password"
                name="password"
                label="Mật khẩu"
                value={form.password}
                onChange={handleChange}
                visible={visiblePasswords.password}
                onToggle={() => setVisiblePasswords((current) => ({ ...current, password: !current.password }))}
                placeholder="Ít nhất 6 ký tự"
                autoComplete="new-password"
                describedBy="password-strength"
              />
            </div>
            <div className="self-end" id="password-strength" aria-live="polite">
              <div className="flex gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4].map((level) => (
                  <span key={level} className={`h-1.5 flex-1 rounded-full ${passwordStrength >= level ? "bg-[#946f2d]" : "bg-[#e8dcca]"}`} />
                ))}
              </div>
              <p className="mt-1 text-[10px] text-[#8b8178]">
                {form.password.length < 6
                  ? "Mật khẩu cần ít nhất 6 ký tự."
                  : passwordStrength < 3
                    ? "Mật khẩu ổn. Thêm chữ hoa, số hoặc ký hiệu để tăng độ mạnh."
                    : "Mật khẩu khá mạnh."}
              </p>
            </div>

            <div className="sm:col-span-2">
              <PasswordField
                id="register-confirm"
                name="confirm"
                label="Xác nhận mật khẩu"
                value={form.confirm}
                onChange={handleChange}
                visible={visiblePasswords.confirm}
                onToggle={() => setVisiblePasswords((current) => ({ ...current, confirm: !current.confirm }))}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                describedBy="password-match"
              />
              {form.confirm && (
                <p id="password-match" role={passwordsMatch ? "status" : "alert"} className={`mt-1 text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                  {passwordsMatch ? "Mật khẩu khớp." : "Mật khẩu nhập lại chưa khớp."}
                </p>
              )}
            </div>

            {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-500 sm:col-span-2">{error}</p>}

            <button type="submit" disabled={loading} className="primary-btn mt-2 w-full py-3.5 text-[11px] sm:col-span-2">
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
