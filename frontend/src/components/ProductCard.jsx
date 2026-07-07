



import { useState } from "react";

export default function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-white rounded-[20px] overflow-hidden shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
      {/* Image Container */}
      <div className="relative bg-gray-100 h-[280px] overflow-hidden group">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
        />

        {/* Like Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:shadow-lg transition text-xl"
        >
          {isLiked ? "❤️" : "🤍"}
        </button>

        {/* Badge */}
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          NEW
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 text-gray-800">{product.name}</h3>

        <p className="text-gray-600 text-sm mb-4">Premium Quality</p>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
          <span className="text-xs text-gray-600">(128)</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 line-through text-sm">$150</p>
            <p className="text-2xl font-black text-black">$99</p>
          </div>
          <button className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center hover:opacity-80 transition text-xl">
            🛒
          </button>
        </div>
      </div>
    </div>
  );
}