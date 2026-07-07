import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Target, Zap, Heart } from "lucide-react";

const stats = [
  { number: "500+", label: "Sản phẩm" },
  { number: "10K+", label: "Khách hàng" },
  { number: "5★", label: "Đánh giá" },
];

const values = [
  {
    icon: Target,
    title: "Chất lượng",
    desc: "Mỗi đôi giày được kiểm tra kỹ càng trước khi đến tay bạn.",
  },
  {
    icon: Zap,
    title: "Phong cách",
    desc: "Luôn cập nhật xu hướng mới nhất từ các thương hiệu hàng đầu.",
  },
  {
    icon: Heart,
    title: "Tận tâm",
    desc: "Hỗ trợ khách hàng 24/7 với trải nghiệm mua sắm tốt nhất.",
  },
];

export default function GioiThieu() {
  return (
    <div className="bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-black min-h-[60vh] flex flex-col items-center justify-center pt-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&q=60"
            className="w-full h-full object-cover scale-110"
            alt=""
          />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gray-500 mb-6">
            Premium Footwear Since 2024
          </p>
          <h1 className="font-hero text-[15vw] text-white leading-none">
            LIZSHOOS
          </h1>
          <p className="text-gray-400 mt-6 max-w-md mx-auto text-sm leading-relaxed">
            Nơi thời trang và phong cách gặp nhau — một điểm đến dành cho
            những ai yêu giày.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-hero text-6xl md:text-7xl leading-none mb-2">
                {s.number}
              </p>
              <p className="text-gray-400 text-xs tracking-[0.3em] uppercase">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-4">
              Câu chuyện
            </p>
            <h2 className="text-5xl font-black leading-tight mb-6">
              Chúng tôi<br />là ai?
            </h2>
            <p className="text-gray-500 leading-relaxed mb-4">
              LIZSHOOS ra đời từ niềm đam mê với giày thể thao và thời trang
              đường phố. Chúng tôi tin rằng đôi giày không chỉ là vật dụng —
              đó là cách bạn thể hiện cá tính và phong cách sống.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Với hơn 500 sản phẩm từ các thương hiệu hàng đầu thế giới, chúng
              tôi mang đến lựa chọn hoàn hảo cho mọi phong cách và dịp sử dụng.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden aspect-square bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&q=80"
              className="w-full h-full object-cover"
              alt="About LIZSHOOS"
            />
          </div>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {values.map((v) => (
            <div key={v.title} className="border border-gray-100 rounded-3xl p-8">
              <v.icon className="w-8 h-8 mb-4" strokeWidth={1.5} />
              <h3 className="font-black text-xl mb-3">{v.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="rounded-3xl overflow-hidden aspect-square bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1556048219-bb6978360b84?w=600&h=600&fit=crop&q=80"
              className="w-full h-full object-cover"
              alt="Mission"
            />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-4">
              Sứ mệnh
            </p>
            <h2 className="text-5xl font-black leading-tight mb-6">
              Đồng hành<br />cùng bạn
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Mỗi sản phẩm trong bộ sưu tập được chọn lọc kỹ càng — đảm bảo
              chất lượng cao nhất, giá cả hợp lý và phong cách không bao giờ
              lỗi thời.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-20 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500 mb-4">
          Khám phá ngay
        </p>
        <h2 className="font-hero text-6xl md:text-8xl text-white mb-8">
          BẮT ĐẦU MUA SẮM
        </h2>
        <Link
          to="/san-pham"
          className="inline-flex items-center gap-3 border border-white/30 text-white rounded-full pl-7 pr-2 py-2 hover:bg-white hover:text-black transition duration-300 group"
        >
          <span className="text-xs font-semibold tracking-[0.2em] uppercase">
            Xem sản phẩm
          </span>
          <span className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center font-bold group-hover:bg-black group-hover:text-white transition">
            →
          </span>
        </Link>
      </section>

      <Footer />
    </div>
  );
}
