import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from "./components/Signup.js";
import Home from "./components/Home.js";
import Login from "./components/Login.js";
import ResetPassword from "./components/Resetpassword.js";
import ProtectedRoute from "./components/PrivateRoute.js";
import axios from "axios";
import './App.css';

axios.defaults.baseURL = "https://payslip-dgg7.onrender.com";
axios.defaults.withCredentials = true;

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset_password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
