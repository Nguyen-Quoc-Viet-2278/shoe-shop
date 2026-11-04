import { useContext } from "react";
import { WishlistContext } from "./contexts";

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist phải dùng trong WishlistProvider");
  return ctx;
}
