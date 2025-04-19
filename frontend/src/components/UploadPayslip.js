import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Container, Card, Form, Button } from "react-bootstrap";

const UploadPayslip = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);

  const handlePdfChange = (e) => setPdfFile(e.target.files[0]);
  const handleExcelChange = (e) => setExcelFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!pdfFile || !excelFile) {
      toast.error("Please upload both PDF and Excel files!");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", pdfFile);
    formData.append("excel", excelFile);

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post("https://payslip-management-system.onrender.com/upload", formData, 
        {headers: {
          Authorization: `Bearer ${token}`,
        },});
        toast.success(response.data.message);
    } catch (error) {
      toast.error("Error uploading files!: ",error.message);
    }
  };

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <Card style={{ width: "100%", maxWidth: "600px" }} className="p-4 shadow-sm">
        <Card.Body>
          <h3 className="mb-4 text-center">Upload Payslip PDF & Excel</h3>
          <Form>
            <Form.Group controlId="formPdf" className="mb-3">
              <Form.Label>Payslip PDF File</Form.Label>
              <Form.Control type="file" accept=".pdf" onChange={handlePdfChange} />
            </Form.Group>

            <Form.Group controlId="formExcel" className="mb-4">
              <Form.Label>Excel Staff Sheet</Form.Label>
              <Form.Control type="file" accept=".xlsx" onChange={handleExcelChange} />
            </Form.Group>

            <Button variant="primary" onClick={handleUpload} className="w-100">
              Upload
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <ToastContainer />
    </Container>
  );
};

export default UploadPayslip;
