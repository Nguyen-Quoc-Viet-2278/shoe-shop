import { Link } from "react-router-dom";

export default function Banner() {
  return (
    <section className="bg-black min-h-screen relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&q=60"
          alt=""
          className="w-full h-full object-cover opacity-15 scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-br from-black via-black/85 to-black/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col min-h-screen pt-28 pb-16">
        {/* Top row */}
        <div className="flex justify-between items-start">
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600 max-w-50 leading-loose hidden md:block">
            Phong cách không giới hạn. Chất lượng đỉnh cao. Mỗi bước đi là một tuyên ngôn.
          </p>

          {/* Featured card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center gap-3 ml-auto">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/20 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80"
                className="w-full h-full object-cover"
                alt="Nike Air"
              />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Nike Air Force 1</p>
              <p className="text-gray-400 text-xs">2,500,000₫</p>
            </div>
            <button className="ml-2 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hero Text */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="font-hero text-[18vw] md:text-[17vw] leading-[0.85] text-white -ml-1 select-none">
            LIZSHOOS
          </h1>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <Link to="/san-pham" className="group flex items-center gap-3 border border-white/20 rounded-full pl-7 pr-2 py-2 text-white hover:border-white transition duration-300">
            <span className="text-xs font-semibold tracking-[0.25em] uppercase">Khám phá ngay</span>
            <span className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center font-bold group-hover:bg-white/90 transition">
              →
            </span>
          </Link>
          <p className="text-gray-700 text-[10px] tracking-widest uppercase hidden md:block">
            Premium Footwear Collection
          </p>
        </div>
      </div>
    </section>
  );
}
