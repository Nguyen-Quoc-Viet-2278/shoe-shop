import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { API_URL } from "../lib/config";
import { CartContext } from "./contexts";

export function CartProvider({ children }) {
  const { token, logout } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cart") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [readyToken, setReadyToken] = useState(null);
  const serverCartReady = !token || readyToken === token;
  const [syncError, setSyncError] = useState(null);
  const cartRef = useRef(cart);
  const previousToken = useRef(token);
  const loginSync = useRef(null);
  const syncQueue = useRef(Promise.resolve());
  const preserveCartOnLogout = useRef(false);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    let active = true;
    if (token) {
      if (loginSync.current?.token !== token) {
        loginSync.current = {
          token,
          promise: fetch(API_URL + "/cart/merge", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ items: cartRef.current }),
          }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
              const error = new Error(data.error || "Không thể đồng bộ giỏ hàng");
              error.status = res.status;
              throw error;
            }
            return data;
          }),
        };
      }
      loginSync.current.promise
        .then((data) => {
          if (active) {
            setCart(data);
            localStorage.removeItem("cart");
            setSyncError(null);
          }
        })
        .catch((err) => {
          if (!active) return;
          if (err.status === 401) {
            preserveCartOnLogout.current = true;
            setSyncError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đồng bộ giỏ hàng.");
            logout();
            return;
          }
          setSyncError(err.message);
        })
        .finally(() => {
          if (active) setReadyToken(token);
        });
    } else {
      if (previousToken.current) {
        if (preserveCartOnLogout.current) {
          preserveCartOnLogout.current = false;
        } else {
          setCart([]);
          localStorage.removeItem("cart");
        }
      }
      loginSync.current = null;
    }
    previousToken.current = token;
    return () => { active = false; };
  }, [token, logout]);

  useEffect(() => {
    if (!token && serverCartReady) {
      try {
        localStorage.setItem("cart", JSON.stringify(cart));
      } catch (err) {
        console.error("Không thể lưu giỏ hàng trên thiết bị này", err);
      }
    }
  }, [cart, token, serverCartReady]);

  const syncCart = async (path, method, body) => {
    if (!token || !serverCartReady) return;
    syncQueue.current = syncQueue.current.then(async () => {
      const res = await fetch(API_URL + "/cart" + path, {
        method,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.error || "Không thể đồng bộ giỏ hàng");
        error.status = res.status;
        throw error;
      }
      setSyncError(null);
    }).catch((err) => {
      if (err.status === 401) {
        preserveCartOnLogout.current = true;
        setSyncError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đồng bộ giỏ hàng.");
        logout();
      } else {
        setSyncError(err.message);
      }
    });
    await syncQueue.current;
  };

  const addToCart = (product, qty = 1) => {
    const amount = Number(product.quantity ?? qty);
    if (!Number.isInteger(amount) || amount < 1) return;
    const safeAmount = Math.min(amount, 99);
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.size === product.size && item.color === product.color
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === product.size && item.color === product.color
            ? { ...item, quantity: Math.min(99, item.quantity + safeAmount) }
            : item
        );
      }
      return [...prev, { ...product, quantity: safeAmount }];
    });
    void syncCart("", "POST", { ...product, quantity: safeAmount });
  };

  const removeFromCart = (id, size, color) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.size === size && item.color === color)));
    void syncCart(`/${id}?size=${encodeURIComponent(size)}&color=${encodeURIComponent(color || "")}`, "DELETE");
  };

  const updateQuantity = (id, size, color, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size && item.color === color ? { ...item, quantity } : item
      )
    );
    void syncCart(`/${id}`, "PATCH", { size, color: color || "", quantity });
  };

  const clearCart = () => {
    setCart([]);
    void syncCart("", "DELETE");
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, syncError }}
    >
      {children}
    </CartContext.Provider>
  );
}
