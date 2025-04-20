import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Badge } from "react-bootstrap";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";

const PayslipStatus = () => {
   const { loggedIn } = useAuth();
   const navigate = useNavigate();
   const [payslips, setPayslips] = useState([]);

   useEffect(() => {
           if (!loggedIn) {
             window.location.href = '/login'
           }
         }, [loggedIn, navigate]);
         

  useEffect(() => {
    const fetchStatus = async () => {
        try {
          const token = localStorage.getItem("token")
          const response = await axios.get("https://api.fcahptibbursaryps.com.ng/status", 
            {headers: {
              Authorization: `Bearer ${token}`,
            },});
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

  return (
    <Container className="mt-5">
      <h3 className="mb-4 text-center">Payslip Processing Status</h3>
      <Table striped bordered hover responsive>
        <thead className="table-primary">
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

export default PayslipStatus;
