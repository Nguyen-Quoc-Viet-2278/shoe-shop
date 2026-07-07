export default function Features() {
  return (
    <section className="relative overflow-hidden min-h-96">
      {/* Background photo */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1556048219-bb6978360b84?w=1920&h=700&fit=crop&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="max-w-xl">
          <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
            Thoải mái<br />cả ngày dài
          </h2>
          <p className="text-gray-400 mt-6 text-sm leading-relaxed max-w-sm">
            Thiết kế cao cấp, đế êm ái giúp bạn tự tin mọi bước đi. Từ đường phố đến sân thể thao — LIZSHOOS đồng hành cùng phong cách của bạn.
          </p>
        </div>

        {/* Floating shoe card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-5 w-48 shrink-0">
          <div className="rounded-2xl overflow-hidden mb-4 bg-white/10 aspect-square">
            <img
              src="https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=300&h=300&fit=crop&q=80"
              alt="Shoe"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-white font-bold text-sm">Hard & Modern</p>
          <p className="text-gray-400 text-xs mt-0.5">Shoes Design</p>
        </div>
      </div>
    </section>
  );
}
