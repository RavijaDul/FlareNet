import { createContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      // try to reload minimal user info from storage
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    }
  }, []);

  const login = async ({ username, password }) => {
    const resp = await authAPI.login({ username, password });
    // resp.data contains { token, username, role }
    const payload = resp.data;
    const u = { username: payload.username, role: payload.role, token: payload.token };
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", payload.token);
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
