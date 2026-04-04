import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { fetchProfile, login as loginRequest, register as registerRequest } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("collabAuth"));
      return stored?.user || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("collabAuth"));
      return stored?.token || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const persistAuth = (nextUser, nextToken) => {
    localStorage.setItem("collabAuth", JSON.stringify({ user: nextUser, token: nextToken }));
  };

  const clearAuth = () => {
    localStorage.removeItem("collabAuth");
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      setUser(data.user);
      setToken(data.token);
      persistAuth(data.user, data.token);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    try {
      const data = await registerRequest(username, email, password);
      setUser(data.user);
      setToken(data.token);
      persistAuth(data.user, data.token);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearAuth();
  }, []);

  useEffect(() => {
    if (token && !user) {
      fetchProfile(token)
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          logout();
        });
    }
  }, [token, user, logout]);

  const value = useMemo(
    () => ({ user, token, login, logout, register, loading, isAuthenticated: Boolean(user && token) }),
    [user, token, login, logout, register, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
