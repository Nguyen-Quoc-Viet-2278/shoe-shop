import { useState, useEffect, useCallback, useMemo } from "react";
import { API_URL } from "../lib/config";
import { WishlistContext } from "./contexts";

export function WishlistProvider({ children, token }) {
  const [ids, setIds] = useState([]);
  const [items, setItems] = useState([]);

  const authHeaders = useMemo(() => token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : null, [token]);

  const fetchIds = useCallback(async () => {
    if (!token) { setIds([]); setItems([]); return; }
    try {
      const res = await fetch(`${API_URL}/wishlist/ids`, { headers: authHeaders });
      if (res.ok) setIds(await res.json());
    } catch { /* ignore */ }
  }, [token, authHeaders]);

  const fetchItems = useCallback(async () => {
    if (!token) { setItems([]); return; }
    try {
      const res = await fetch(`${API_URL}/wishlist`, { headers: authHeaders });
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ }
  }, [token, authHeaders]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { void fetchIds(); }, [fetchIds]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggle = useCallback(async (productId) => {
    if (!token) return;
    const liked = ids.includes(productId);
    if (liked) {
      setIds((prev) => prev.filter((id) => id !== productId));
      setItems((prev) => prev.filter((p) => p.product_id !== productId));
      await fetch(`${API_URL}/wishlist/${productId}`, { method: "DELETE", headers: authHeaders });
    } else {
      setIds((prev) => [...prev, productId]);
      await fetch(`${API_URL}/wishlist/${productId}`, { method: "POST", headers: authHeaders });
      fetchItems();
    }
  }, [ids, token, authHeaders, fetchItems]);

  return (
    <WishlistContext.Provider value={{ ids, items, toggle, fetchItems, isLoggedIn: !!token }}>
      {children}
    </WishlistContext.Provider>
  );
}
