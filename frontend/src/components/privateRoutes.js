import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ loggedIn, children }) => {
  return loggedIn ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
