import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../lib/config";

const STEPS = { EMAIL: "email", OTP: "otp", NEW_PASS: "new_pass", DONE: "done" };

export default function QuenMatKhau() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const post = async (path, body) => {
    const res = await fetch(`${API_URL}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await post("forgot-password", { email });
      setStep(STEPS.OTP);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError("OTP phải có 6 chữ số");
    setError(null);
    setStep(STEPS.NEW_PASS);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) return setError("Mật khẩu xác nhận không khớp");
    if (newPass.length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự");
    setError(null);
    setLoading(true);
    try {
      await post("reset-password", { email, otp, new_password: newPass });
      setStep(STEPS.DONE);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex flex-1 bg-black items-center justify-center">
        <p className="font-hero text-white" style={{ fontSize: "12vw", lineHeight: 1 }}>LIZSHOOS</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <Link to="/dang-nhap" className="text-xs text-gray-400 hover:text-black transition mb-10 block">
            ← Quay lại đăng nhập
          </Link>

          {/* STEP 1: Nhập email */}
          {step === STEPS.EMAIL && (
            <>
              <h1 className="text-4xl font-black mb-1">Quên mật khẩu</h1>
              <p className="text-gray-400 text-sm mb-8">Nhập email để nhận mã OTP</p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="example@email.com"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition placeholder:text-gray-300" />
                </div>
                {error && <p className="text-red-400 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-black text-white py-3.5 rounded-2xl font-bold text-sm tracking-widest uppercase hover:opacity-80 transition disabled:opacity-50">
                  {loading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </form>
            </>
          )}

          {/* STEP 2: Nhập OTP */}
          {step === STEPS.OTP && (
            <>
              <h1 className="text-4xl font-black mb-1">Nhập mã OTP</h1>
              <p className="text-gray-400 text-sm mb-8">
                Mã OTP đã gửi đến <strong>{email}</strong><br />
                <span className="text-xs">(Kiểm tra hộp thư rác nếu không thấy)</span>
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">Mã OTP (6 số)</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} required
                    placeholder="123456"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-center tracking-[0.5em] font-bold outline-none focus:border-black transition placeholder:text-gray-300 placeholder:tracking-normal" />
                </div>
                {error && <p className="text-red-400 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}
                <button type="submit"
                  className="w-full bg-black text-white py-3.5 rounded-2xl font-bold text-sm tracking-widest uppercase hover:opacity-80 transition">
                  Xác nhận OTP
                </button>
                <button type="button" onClick={() => setStep(STEPS.EMAIL)}
                  className="w-full text-xs text-gray-400 hover:text-black transition text-center">
                  Gửi lại mã
                </button>
              </form>
            </>
          )}

          {/* STEP 3: Đặt mật khẩu mới */}
          {step === STEPS.NEW_PASS && (
            <>
              <h1 className="text-4xl font-black mb-1">Mật khẩu mới</h1>
              <p className="text-gray-400 text-sm mb-8">Nhập mật khẩu mới của bạn</p>
              <form onSubmit={handleReset} className="space-y-4">
                {[
                  { label: "Mật khẩu mới", value: newPass, set: setNewPass, placeholder: "Ít nhất 6 ký tự" },
                  { label: "Xác nhận mật khẩu", value: confirm, set: setConfirm, placeholder: "Nhập lại mật khẩu" },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 block">{label}</label>
                    <input type="password" value={value} onChange={e => set(e.target.value)} required placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition placeholder:text-gray-300" />
                  </div>
                ))}
                {error && <p className="text-red-400 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-black text-white py-3.5 rounded-2xl font-bold text-sm tracking-widest uppercase hover:opacity-80 transition disabled:opacity-50">
                  {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                </button>
              </form>
            </>
          )}

          {/* DONE */}
          {step === STEPS.DONE && (
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">✓</div>
              <h1 className="text-3xl font-black mb-2">Thành công!</h1>
              <p className="text-gray-400 text-sm mb-8">Mật khẩu đã được đặt lại. Hãy đăng nhập lại.</p>
              <button onClick={() => navigate("/dang-nhap")}
                className="w-full bg-black text-white py-3.5 rounded-2xl font-bold text-sm tracking-widest uppercase hover:opacity-80 transition">
                Đăng nhập ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
