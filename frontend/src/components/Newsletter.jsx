import { useState } from "react";
import { API_URL } from "../lib/config";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể đăng ký nhận tin");
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 border-b border-gray-100">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
        <h2 className="text-6xl md:text-8xl font-black leading-none">
          Đăng ký<br />nhận tin
        </h2>

        <div className="flex-1 max-w-lg">
          <p className="text-gray-400 text-sm mb-6">
            Nhận ưu đãi độc quyền, sản phẩm mới nhất và cập nhật xu hướng thời trang thẳng vào hộp thư của bạn.
          </p>

          {submitted ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <p className="font-semibold">Đăng ký thành công!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
                className="flex-1 border-b-2 border-black bg-transparent text-base outline-none pb-2 placeholder:text-gray-300"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:opacity-75 transition shrink-0 text-lg"
              >
                {loading ? "…" : "→"}
              </button>
            </form>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  );
}
