import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UploadPayslip from "./UploadPayslip.js";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "./Footer.js";
import axios from  "axios"

const Home = () => {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Session expired. Please log in.");
          return navigate("/login");
        }

      const response = await axios.get("https://api.fcahptibbursaryps.com.ng/auth", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response) {
          toast.error("Unauthorized. Redirecting to login.");
          return navigate("/login");
        }
        if (response.data.authenticated) {
          setChecked(true);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logging out...");
    navigate("/login");
  };

  if (!checked) return <p className="text-center mt-5">Checking authentication...</p>;

  return (
    <div>
      <ToastContainer />
      <nav className="navbar navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Payslip Management System</span>
          <div>
            {/* <button
              className="btn btn-outline-light me-2"
              onClick={() => navigate("/status/history")}
            >
              History
            </button> */}
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Logout
            </button>
          </div>
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
