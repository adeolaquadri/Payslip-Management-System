import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UploadPayslip from "./UploadPayslip.js";
import PayslipStatus from "./PayslipStatus.js";

const Home = ()=>{
   return(
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
)
}
export default Home;