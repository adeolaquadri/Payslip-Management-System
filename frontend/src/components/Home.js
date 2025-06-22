import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UploadPayslip from "./UploadPayslip";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "./Footer";
import useAuthCheck from "../hooks/useAuthCheck";

const Home = () => {
  const navigate = useNavigate();
  const { loading, authenticated } = useAuthCheck();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) return <p className="text-center mt-5">Checking authentication...</p>;
  if (!authenticated) return null; // or redirect fallback

  return (
    <div>
      <ToastContainer />
      <nav className="navbar navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Payslip Management System</span>
          <button className="btn btn-outline-light" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container mt-4">
        <UploadPayslip />
        <Footer />
      </div>
    </div>
  );
};

export default Home;