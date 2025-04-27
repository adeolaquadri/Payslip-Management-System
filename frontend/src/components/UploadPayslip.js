import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Container, Card, Form, Button } from "react-bootstrap";

const UploadPayslip = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Waiting to start...");
  const [isUploading, setIsUploading] = useState(false);
  const [hasFailure, setHasFailure] = useState(false);
  const [results, setResults] = useState([]);

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

    setStatusText("Uploading files...");
    setProgress(0);
    setIsUploading(true);
    setHasFailure(false);

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post("https://api.fcahptibbursaryps.com.ng/upload", formData, 
        {headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data;
      const total = data.results.length;
      let sentCount = 0;
      setResults(data.results);

      // Now simulate progress
      for (const r of data.results) {
        sentCount++;
        const percentage = Math.round((sentCount / total) * 100);
        setProgress(percentage);
        setStatusText(`Sending ${sentCount} of ${total}: ${r.name} (${r.email}) - ${r.status}`);

        if (r.status !== "Sent") {
          setHasFailure(true); // Detect failure
        }

        // Optional small delay to see progress visually
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setStatusText("All emails processed!");
    } catch (error) {
      console.error(error);
      setStatusText("Upload failed.");
      setHasFailure(true);
    }finally{
      setHasFailure(false);
    }
  };
  return (
    <>
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

            <Button variant="primary" disabled={isUploading || !pdfFile || !excelFile} onClick={handleUpload} className="w-100">
              {isUploading ? "Processing..." : "Upload and Send"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <ToastContainer />
    </Container>
    {isUploading && (
        <div style={{ marginTop: "10px" }}>
          <div className="spinner" style={{
            width: "30px",
            height: "30px",
            border: "4px solid #ccc",
            borderTop: "4px solid #4caf50",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "auto"
          }} />
        </div>
      )}
    <div style={{ marginTop: "20px", width: "100%", backgroundColor: "#eee", borderRadius: "10px" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "30px",
            backgroundColor: hasFailure ? "#f44336" : "#4caf50", // Red if failed, Green if success,
            color: "white",
            textAlign: "center",
            lineHeight: "30px",
            borderRadius: "10px",
            transition: "width 0.3s"
          }}
        >
          {progress}%
        </div>
      </div>

      <div style={{ marginTop: "10px", fontWeight: "bold" }}>
        {statusText}
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Results:</h3>
          <ul>
            {results.map((r, idx) => (
              <li key={idx}>
                {r.name} ({r.email}) - {r.status}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Spinner Keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default UploadPayslip;
