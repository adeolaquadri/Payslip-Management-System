import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const PayslipStatusHistory = () => {
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login");
    } else {
      setChecked(true);
    }
  }, [loggedIn, navigate]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "https://api.fcahptibbursaryps.com.ng/status/history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.token) {
          setPayslips(response.data.history);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching payslip status:", error);
        setError("Failed to fetch payslip history");
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  function formatDateToDDMMYY(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  }

  if (!checked) return <p className="text-center mt-5">Checking authentication...</p>;
  if (loading) return <p className="text-center mt-5">Loading...</p>;
  if (error) return <p className="text-danger text-center mt-5">{error}</p>;

  return (
    <Container className="mt-5">
      <h3 className="mb-4 text-center">Payslip Status History</h3>
      <Table striped bordered hover responsive>
        <thead className="table-primary">
          <tr>
            <th>IPPIS Number</th>
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
              <td>
                <a href={payslip.file} target="_blank" rel="noopener noreferrer">
                  View File
                </a>
              </td>
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
