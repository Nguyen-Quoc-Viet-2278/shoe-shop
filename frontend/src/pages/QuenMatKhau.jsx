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
    <div className="page-shell flex min-h-screen">
      <div className="hidden flex-1 items-center justify-center bg-[#140d0b] lg:flex">
        <div className="text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#e0c27c]">Reset access</p>
          <p className="font-hero text-[10vw] leading-none text-white">LIZSHOOS</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[32px] border border-[#efe5d8] bg-white/80 p-8 shadow-[0_30px_80px_rgba(16,10,7,0.08)] backdrop-blur-sm">
          <Link to="/dang-nhap" className="mb-8 block text-xs font-semibold uppercase tracking-[0.2em] text-[#7a706a] hover:text-[#1b1714]">
            ← Quay lại đăng nhập
          </Link>

          {step === STEPS.EMAIL && (
            <>
              <h1 className="mb-2 font-hero text-5xl text-[#1b1714]">Quên mật khẩu</h1>
              <p className="mb-8 text-sm text-[#7a706a]">Nhập email để nhận mã OTP</p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a706a]">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="soft-input" placeholder="example@email.com" />
                </div>
                {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-500">{error}</p>}
                <button type="submit" disabled={loading} className="primary-btn w-full py-3.5 text-[11px]">
                  {loading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </form>
            </>
          )}

          {step === STEPS.OTP && (
            <>
              <h1 className="mb-2 font-hero text-5xl text-[#1b1714]">Nhập mã OTP</h1>
              <p className="mb-8 text-sm leading-6 text-[#7a706a]">
                Mã OTP đã gửi đến <strong>{email}</strong><br />
                <span className="text-xs">(Kiểm tra hộp thư rác nếu không thấy)</span>
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a706a]">Mã OTP (6 số)</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} required placeholder="123456" className="soft-input text-center tracking-[0.5em] font-bold placeholder:tracking-normal" />
                </div>
                {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-500">{error}</p>}
                <button type="submit" className="primary-btn w-full py-3.5 text-[11px]">Xác nhận OTP</button>
                <button type="button" onClick={() => setStep(STEPS.EMAIL)} className="w-full text-center text-xs text-[#7a706a] hover:text-[#1b1714]">Gửi lại mã</button>
              </form>
            </>
          )}

          {step === STEPS.NEW_PASS && (
            <>
              <h1 className="mb-2 font-hero text-5xl text-[#1b1714]">Mật khẩu mới</h1>
              <p className="mb-8 text-sm text-[#7a706a]">Nhập mật khẩu mới của bạn</p>
              <form onSubmit={handleReset} className="space-y-4">
                {[
                  { label: "Mật khẩu mới", value: newPass, set: setNewPass, placeholder: "Ít nhất 6 ký tự" },
                  { label: "Xác nhận mật khẩu", value: confirm, set: setConfirm, placeholder: "Nhập lại mật khẩu" },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a706a]">{label}</label>
                    <input type="password" value={value} onChange={e => set(e.target.value)} required placeholder={placeholder} className="soft-input" />
                  </div>
                ))}
                {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-500">{error}</p>}
                <button type="submit" disabled={loading} className="primary-btn w-full py-3.5 text-[11px]">
                  {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                </button>
              </form>
            </>
          )}

          {step === STEPS.DONE && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1b1714] text-2xl text-white">✓</div>
              <h1 className="mb-2 font-hero text-4xl text-[#1b1714]">Thành công!</h1>
              <p className="mb-8 text-sm text-[#7a706a]">Mật khẩu đã được đặt lại. Hãy đăng nhập lại.</p>
              <button onClick={() => navigate("/dang-nhap")} className="primary-btn w-full py-3.5 text-[11px]">Đăng nhập ngay</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
