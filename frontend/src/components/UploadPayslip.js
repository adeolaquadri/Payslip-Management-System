import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      const response = await axios.post("http://localhost:4050/upload", formData);
      toast.success(response.data.message);
    } catch (error) {
      toast.error("Error uploading files!");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Upload Payslip PDF & Staff Excel</h3>
      <div className="mb-3">
        <input type="file" accept=".pdf" onChange={handlePdfChange} className="form-control" />
      </div>
      <div className="mb-3">
        <input type="file" accept=".xlsx" onChange={handleExcelChange} className="form-control" />
      </div>
      <button className="btn btn-primary" onClick={handleUpload}>Upload</button>
      <ToastContainer />
    </div>
  );
};

export default UploadPayslip;
