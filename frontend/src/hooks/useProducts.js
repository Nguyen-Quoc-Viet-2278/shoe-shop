import { useState, useEffect, useCallback } from "react";
import fallbackProducts from "../data/products";
import { API_URL } from "../lib/config";

const SAFE_FALLBACK_PRODUCTS = Array.isArray(fallbackProducts) ? fallbackProducts : [];

function normalizeProductList(data) {
  if (Array.isArray(data) && data.length > 0) return data;
  return SAFE_FALLBACK_PRODUCTS;
}

export function notifyProductsChanged() {
  const payload = String(Date.now());

  try {
    window.localStorage.setItem("shop-products-updated", payload);
  } catch (error) {
    // ignore localStorage issues in private mode or restricted environments
  }

  try {
    window.dispatchEvent(new CustomEvent("shop-products-refresh", { detail: payload }));
  } catch (error) {
    // ignore custom event issues
  }

  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel("shop-products-updated");
      channel.postMessage(payload);
      channel.close();
    } catch (error) {
      // ignore BroadcastChannel support issues
    }
  }
}

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    let isMounted = true;
    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error("API lỗi");
        const data = await res.json();
        if (!isMounted) return;
        const resolvedProducts = normalizeProductList(data);
        setProducts(resolvedProducts);
        setError(null);
      } catch {
        if (!isMounted) return;
        setProducts(SAFE_FALLBACK_PRODUCTS);
        setError(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    await run();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error("API lỗi");
        const data = await res.json();
        if (!active) return;
        setProducts(normalizeProductList(data));
        setError(null);
      } catch {
        if (!active) return;
        setProducts(SAFE_FALLBACK_PRODUCTS);
        setError(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    const handleStorage = (event) => {
      if (event.key === "shop-products-updated") {
        void load();
      }
    };

    const handleChannel = () => {
      void load();
    };

    const handleCustomRefresh = () => {
      void load();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      window.addEventListener("shop-products-refresh", handleCustomRefresh);
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("shop-products-updated");
        channel.addEventListener("message", handleChannel);
        return () => {
          active = false;
          channel.removeEventListener("message", handleChannel);
          channel.close();
          window.removeEventListener("storage", handleStorage);
          window.removeEventListener("shop-products-refresh", handleCustomRefresh);
        };
      }
    }

    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("shop-products-refresh", handleCustomRefresh);
      }
    };
  }, []);

  return { products, loading, error, refreshProducts: fetchProducts };
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
