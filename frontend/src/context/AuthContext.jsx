import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("crm-user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const hasToken = !!localStorage.getItem("accessToken");
  const [isBootstrapping, setIsBootstrapping] = useState(hasToken);

  const login = useCallback((userData, accessToken, refreshToken) => {
    setUser(userData);
    localStorage.setItem("crm-user",     JSON.stringify(userData));
    localStorage.setItem("accessToken",  accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("crm-user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("crm-user", JSON.stringify(next));
      return next;
    });
  }, []);

  // Bootstrap: rehydrate session from stored token on mount
  useEffect(() => {
    if (!localStorage.getItem("accessToken")) return;

    api.get("/auth/me")
      .then((res) => {
        const accessToken  = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        login(res.data.user, accessToken, refreshToken);
      })
      .catch(() => logout())
      .finally(() => setIsBootstrapping(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener("auth:logout", logout);
    return () => window.removeEventListener("auth:logout", logout);
  }, [logout]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isBootstrapping, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
