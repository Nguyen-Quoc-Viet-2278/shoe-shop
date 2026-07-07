import { useContext } from "react";
import { WishlistContext } from "./wishlist-context";

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist phải dùng trong WishlistProvider");
  return ctx;
}
