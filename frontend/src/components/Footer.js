import React from "react";
import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="bg-primary text-white text-center py-3 mt-5">
      <Container>
        <p className="mb-0">&copy; {new Date().getFullYear()} FCAHPTIB Payslip Management System.</p>
        <small>All rights reserved.</small>
      </Container>
    </footer>
  );
};

export default Footer;
