import { useState, useEffect } from "react";
import { CartContext } from "./cart-context";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    const amount = product.quantity ?? qty;
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.size === product.size && item.color === product.color
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === product.size && item.color === product.color
            ? { ...item, quantity: item.quantity + amount }
            : item
        );
      }
      return [...prev, { ...product, quantity: amount }];
    });
  };

  const removeFromCart = (id, size, color) =>
    setCart((prev) => prev.filter((item) => !(item.id === id && item.size === size && item.color === color)));

  const updateQuantity = (id, size, color, quantity) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size && item.color === color ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}
