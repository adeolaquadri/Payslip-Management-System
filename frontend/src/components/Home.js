import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UploadPayslip from "./UploadPayslip.js";
import PayslipStatus from "./PayslipStatus.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.js";
import Footer from "./Footer.js";

const Home = () => {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedIn) {
      window.location.href = "/login";
    }
  }, [loggedIn, navigate]);

  return (
    <div>
      <nav className="navbar navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Payslip Management System</span>
          <button className="btn btn-outline-light" onClick={()=> window.location.href = '/status/history'}
          >History</button>
          <button className="btn btn-outline-light" onClick={() => navigate("/logout")}>
      Logout
    </button>
        </div>
      </nav>
      <div className="container mt-4">
        <UploadPayslip />
        <PayslipStatus />
        <Footer />
      </div>
    </div>
  );
};

export default Home;
