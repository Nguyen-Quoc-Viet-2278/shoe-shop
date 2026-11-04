import Header from "../components/Header";
import Footer from "../components/Footer";

const contactItems = [
  { label: "Địa chỉ cửa hàng", value: "269/20 Lý Thường Kiệt, Phường 15, Quận 11, TP.HCM", icon: "📍", color: "#f9d4d7" },
  { label: "Thời gian làm việc", value: "Thứ 2 - Thứ 7: 8:00 - 18:30", icon: "◔", color: "#dfe9d3" },
  { label: "Hotline", value: "028.6670.4455", icon: "☎", color: "#f9d4d7" },
  { label: "Email", value: "contact@hshop.vn", icon: "✉", color: "#dfe7f8" },
  { label: "Zalo", value: "0938.022.500", icon: "💬", color: "#f9d4d7" },
  { label: "Facebook", value: "Hshop – Điện tử & Robot", icon: "f", color: "#dfe7f8" },
];

export default function LienHe() {
  return (
    <div style={{ background: "#f2f0ee", color: "#1d2b4f" }}>
      <Header />

      <main style={{ paddingTop: 86, paddingBottom: 30 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 18px" }}>
          <div
            style={{
              background: "#f5f1ee",
              border: "1px solid #e6dfd9",
              borderRadius: 22,
              padding: "28px 28px 18px",
              boxShadow: "0 8px 22px rgba(17, 22, 32, 0.03)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#1c2a52", marginBottom: 12 }}>
              Liên hệ
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2.2rem, 3vw, 4rem)",
                lineHeight: 1.1,
                fontWeight: 900,
                color: "#1a254b",
                letterSpacing: "-0.04em",
              }}
            >
              Cửa hàng của chúng tôi
            </h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "26px 34px",
                marginTop: 30,
              }}
            >
              {contactItems.map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      background: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2a3768",
                      fontSize: item.label === "Facebook" ? 18 : 18,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#1a254b",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: item.label === "Địa chỉ cửa hàng" ? 18 : 18, color: "#1d2b4f", lineHeight: 1.5, fontWeight: item.label === "Facebook" ? 600 : 600 }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p
              style={{
                margin: "26px 0 0",
                maxWidth: 780,
                fontSize: 22,
                lineHeight: 1.6,
                color: "#2f3b5e",
                fontWeight: 500,
              }}
            >
              Quý khách có nhu cầu hỗ trợ, tư vấn sản phẩm hoặc đặt hàng, hãy liên hệ qua hotline, email hoặc đến trực tiếp cửa hàng để được phục vụ vụ nhanh nhất.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
