import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./contexts";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || null);

  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("auth_token", token);
    else localStorage.removeItem("auth_token");
  }, [token]);

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
