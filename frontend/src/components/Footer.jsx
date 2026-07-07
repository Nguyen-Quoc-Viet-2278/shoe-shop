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
        { label: "Liên hệ", to: "/" },
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
    <footer className="py-16 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-gray-400 hover:text-black transition"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-100 pt-8 gap-4">
          <Link to="/" className="font-hero text-3xl tracking-widest hover:opacity-70 transition">
            LIZSHOOS
          </Link>
          <p className="text-gray-400 text-xs tracking-widest">
            © 2025 LIZSHOOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
