import { Link } from "react-router-dom";

export default function Banner() {
  return (
    <section className="relative overflow-hidden bg-[#f7f1ea]">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80"
          alt=""
          className="h-full w-full object-cover opacity-20 scale-110"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(238,205,148,0.25),_transparent_35%),linear-gradient(90deg,rgba(247,241,234,0.96),rgba(247,241,234,0.82),rgba(247,241,234,0.7))]" />
      </div>

      <div className="section-shell relative z-10 flex min-h-[85vh] w-full flex-col justify-between pb-12 pt-28">
        <div className="flex items-start justify-between gap-5">
          <p className="hidden max-w-[22rem] text-[10px] uppercase leading-6 tracking-[0.28em] text-[#5f544f] md:block">
            Phong cách không giới hạn. Chất lượng đỉnh cao. Mỗi bước đi là một tuyên ngôn.
          </p>

          <div className="ml-auto flex items-center gap-3 rounded-[22px] border border-[#eadfcf] bg-white/80 p-3 shadow-[0_18px_35px_rgba(17,12,9,0.07)] backdrop-blur-sm">
            <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#f8f3ee]">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80"
                alt="Featured shoe"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#17120d]">Nike Air Force 1</p>
              <p className="text-xs text-[#655d58]">2.500.000₫</p>
            </div>
            <button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#17120d] text-sm text-[#f8f1e7] hover:translate-x-0.5">
              →
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center">
          <div className="max-w-5xl">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.35em] text-[#8a7043]">
              New season 2026
            </p>
            <h1 className="font-hero text-[5.3rem] leading-[0.8] tracking-[-0.04em] text-[#17120d] md:text-[10.5rem]">
              LIZSHOOS
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#4e4944] md:text-base">
              Thiết kế sang trọng, mang đậm dấu ấn hiện đại và cảm giác thoải mái tối đa cho từng bước chân.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/san-pham" className="group inline-flex items-center gap-3 self-start rounded-full border border-[#d7c2a2] bg-[#17120d] pl-7 pr-2 py-2 text-white shadow-[0_16px_32px_rgba(17,12,9,0.1)] hover:border-[#b98d43] transition-all">
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em]">Khám phá ngay</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0d89e] text-lg font-bold text-[#17120d] group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>

            <Link to="/lien-he" className="inline-flex items-center self-start rounded-full border border-[#d9c7a8] bg-white/80 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#17120d] shadow-[0_12px_24px_rgba(17,12,9,0.05)] transition hover:bg-[#17120d] hover:text-white">
              Liên hệ
            </Link>
          </div>

          <p className="hidden text-[10px] uppercase tracking-[0.32em] text-[#7d7269] md:block">
            Premium Footwear Collection
          </p>
        </div>
      </div>
    </section>
  );
}
