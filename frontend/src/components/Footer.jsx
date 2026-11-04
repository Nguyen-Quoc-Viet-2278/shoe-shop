import { Link } from "react-router-dom";

export default function Footer() {
  const cols = [
    {
      title: "Cửa hàng",
      items: [
        { label: "Tất cả sản phẩm", to: "/san-pham" },
        { label: "Giới thiệu", to: "/gioi-thieu" },
        { label: "Giỏ hàng", to: "/cart" },
        { label: "Đơn hàng của tôi", to: "/don-hang" },
      ],
    },
    {
      title: "Tài khoản",
      items: [
        { label: "Đăng nhập", to: "/dang-nhap" },
        { label: "Đăng ký", to: "/dang-ky" },
        { label: "Đơn hàng của tôi", to: "/don-hang" },
      ],
    },
    {
      title: "Hỗ trợ",
      items: [
        { label: "Hướng dẫn mua hàng", to: "/" },
        { label: "Chính sách đổi trả", to: "/" },
        { label: "Chính sách giao hàng", to: "/" },
        { label: "Liên hệ", to: "/lien-he" },
      ],
    },
    {
      title: "Pháp lý",
      items: [
        { label: "Chính sách bảo mật", to: "/" },
        { label: "Điều khoản dịch vụ", to: "/" },
      ],
    },
  ];

  return (
    <footer className="bg-[#f5f1ed] text-[#1d1714]">
      <div className="section-shell py-16">
        <div className="mb-14 grid grid-cols-2 gap-10 md:grid-cols-4">
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-6 text-[10px] font-bold uppercase tracking-[0.28em] text-[#7a685e]">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-sm text-[#605750] hover:text-[#17120d] transition">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#e3d5c5] pt-8 md:flex-row">
          <Link to="/" className="font-hero text-4xl leading-none tracking-[0.16em] text-[#17120d]">
            LIZSHOOS
          </Link>
          <p className="text-[10px] uppercase tracking-[0.26em] text-[#7d7168]">
            © 2026 LIZSHOOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
