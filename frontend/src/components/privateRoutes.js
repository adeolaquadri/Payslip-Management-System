// components/ProtectedRoute.js
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { loggedIn } = useContext(AuthContext);
  return loggedIn ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
