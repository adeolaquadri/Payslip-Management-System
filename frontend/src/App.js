import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UploadPayslip from "./components/UploadPayslip";
import PayslipStatus from "./components/PayslipStatus";

const App = () => {
  return (
    <div>
      <nav className="navbar navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Payslip Management System</span>
        </div>
      </nav>
      <div className="container mt-4">
        <UploadPayslip />
        <PayslipStatus />
      </div>
    </div>
  );
};

export default App;
