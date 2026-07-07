import { useState, useEffect } from "react";
import staticProducts from "../data/products";
import { API_URL } from "../lib/config";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => {
        if (!res.ok) throw new Error("API lỗi");
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback về dữ liệu tĩnh nếu backend chưa chạy
        setProducts(staticProducts);
        setLoading(false);
        setError("Đang dùng dữ liệu offline");
      });
  }, []);

  return { products, loading, error };
}

export async function submitOrder(orderData, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Lỗi khi đặt hàng");
  }
  return res.json();
}
