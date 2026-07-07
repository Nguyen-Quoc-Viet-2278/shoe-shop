import { useAuth } from "./useAuth";
import { WishlistProvider } from "./WishlistContext";

export function WishlistWrapper({ children }) {
  const { token } = useAuth();
  return <WishlistProvider token={token}>{children}</WishlistProvider>;
}
