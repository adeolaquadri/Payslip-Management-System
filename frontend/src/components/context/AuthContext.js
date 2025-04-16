// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoggedIn(false);
        return;
      }

      const response = await axios.get("http://localhost:5000/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLoggedIn(response.data.authenticated);
    } catch (error) {
      console.error("Auth check failed:", error);
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (loggedIn) {
      checkAuth(); // Double confirm when login changes
    }
  }, [loggedIn]);

  return (
    <AuthContext.Provider value={{ loggedIn, setLoggedIn }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
