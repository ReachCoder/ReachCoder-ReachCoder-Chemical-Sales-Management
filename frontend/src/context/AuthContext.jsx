
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing login when app starts
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const currentUser = response.data.user ?? response.data.data;

        setUser(currentUser);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login
  const login = async (username, password) => {
    const response = await api.post("/auth/login", {
    username,
    password,
  });

    const token = response.data.token ?? response.data.data?.token;
    const loggedInUser =
      response.data.user ?? response.data.data?.user;

    if (!token) {
      throw new Error("Login response does not contain a token");
    }

    localStorage.setItem("token", token);

    if (loggedInUser) {
      setUser(loggedInUser);
    } else {
      const meResponse = await api.get("/auth/me");
      setUser(meResponse.data.user ?? meResponse.data.data);
    }

    return true;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
