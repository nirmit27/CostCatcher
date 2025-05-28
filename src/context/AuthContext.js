import { createContext, useState, useEffect } from "react";

import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

import { getUserFromToken } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Method to check token expiration and handle logout
  const checkTokenExpiration = () => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          toast.info("Session expired. Please sign in again.", {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
            toastId: "session-expired",
          });

          logout();
          return true;
        }
      } catch (err) {
        toast.info("Session expired. Please sign in again.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
          toastId: "session-expired",
        });

        logout();
        return true;
      }
    }
    return false;
  };

  // Check token expiration on token change
  useEffect(() => {
    checkTokenExpiration();
  }, [token]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) setToken(storedToken);
    setIsAuthenticated(!!storedToken);

    if (storedToken) {
      setUser(getUserFromToken(storedToken));
    } else {
      setUser(null);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    setToken(token);
    setIsAuthenticated(true);
    setUser(getUserFromToken(token));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        user,
        setUser,
        token,
        setToken,
        isAuthenticated,
        checkTokenExpiration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
