import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Badge } from "react-bootstrap";

const PayslipStatusHistory = () => {
  const [payslips, setPayslips] = useState([]);

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

  return (
    <Container className="mt-5">
      <h3 className="mb-4 text-center">Payslip Processing Status</h3>
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
              <td>{payslip.sentAt}</td>
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
