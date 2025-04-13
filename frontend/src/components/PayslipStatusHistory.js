import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const PayslipStatusHistory = () => {
    const { loggedIn } = useAuth();
    const navigate = useNavigate();
    const [payslips, setPayslips] = useState([]);

    
      useEffect(() => {
        if (!loggedIn) {
          navigate("/login");
        }
      }, [loggedIn, navigate]);
      
      useEffect(() => {
    const fetchStatus = async () => {
        try {
          const response = await axios.get("http://localhost:5000/status/history", { withCredentials: true });
          if (response.data) {
              setPayslips(response.data);
          }
          }catch(error){
            console.error("Error fetching payslip status:", error)
          }
    };

    fetchStatus(); // initial load
    const interval = setInterval(fetchStatus, 5000); // refresh every 5s
    return () => clearInterval(interval); // cleanup
  }, []);

  function formatDateToDDMMYY(date) {
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad it to 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed, so add 1) and pad
    const year = String(date.getFullYear()).slice(-2); // Get the last two digits of the year
  
    return `${day}-${month}-${year}`;
  }

  return (
    <Container className="mt-5">
      <h3 className="mb-4 text-center">Payslip Status History</h3>
      <Table striped bordered hover responsive>
        <thead className="table-primary">
          <tr>
            <th>Staff ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>File</th>
            <th>SentAt</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payslips.map((payslip, index) => (
            <tr key={index}>
              <td>{payslip.staff_id}</td>
              <td>{payslip.name}</td>
              <td>{payslip.email}</td>
              <td>{payslip.file}</td>
              <td>{formatDateToDDMMYY(new Date(payslip.sentAt))}</td>
              <td>
                <Badge bg={payslip.status === "Sent" ? "success" : "danger"}>
                  {payslip.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default PayslipStatusHistory;
