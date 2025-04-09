import React, { useEffect, useState } from "react";
import axios from "axios";

const PayslipStatus = () => {
  const [payslips, setPayslips] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:4050/status")
      .then(response => setPayslips(response.data))
      .catch(error => console.error("Error fetching payslip status:", error));
  }, []);

  return (
    <div className="container mt-4">
      <h3>Payslip Processing Status</h3>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Staff ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payslips.map((payslip, index) => (
            <tr key={index}>
              <td>{payslip.staff_id}</td>
              <td>{payslip.name}</td>
              <td>{payslip.email}</td>
              <td>
                <span className={`badge ${payslip.status === "Sent" ? "bg-success" : "bg-danger"}`}>
                  {payslip.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayslipStatus;
