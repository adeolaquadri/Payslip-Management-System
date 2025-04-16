import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UploadPayslip from "./UploadPayslip.js";
import PayslipStatus from "./PayslipStatus.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "./Footer.js";

const Home = () => {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      if (!loggedIn) {
        navigate("/login");
      } else {
        setChecked(true);
      }
    };

    // Delay check slightly to allow context to update
    const timer = setTimeout(checkLogin, 300);
    return () => clearTimeout(timer);
  }, [loggedIn, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logging out...")
    navigate("/login");
  };

  if (!checked) return <p className="text-center mt-5">Checking authentication...</p>;

  return (
    <div>
      <nav className="navbar navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Payslip Management System</span>
          <button
            className="btn btn-outline-light"
            onClick={() => navigate("/status/history")}
          >
            History
          </button>
          <button className="btn btn-outline-light" onClick={handleLogout}>
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
