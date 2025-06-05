import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Container, Card, Form, Button, ProgressBar, Spinner } from "react-bootstrap";

const UploadPayslip = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [hasFailure, setHasFailure] = useState(false);
  const [results, setResults] = useState([]);

  const handleUpload = async () => {
    if (!pdfFile || !excelFile) {
      toast.error("Please upload both PDF and Excel files.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized. Please log in.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", pdfFile);
    formData.append("excel", excelFile);

    setIsUploading(true);
    setProgress(0);
    setStatusText("Uploading files...");
    setHasFailure(false);
    setResults([]);

    try {
      const response = await axios.post("https://api.fcahptibbursaryps.com.ng/upload", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      const total = data.results.length;
      let sentCount = 0;
      setResults(data.results);

      for (const r of data.results) {
        sentCount++;
        const percent = Math.round((sentCount / total) * 100);
        setProgress(percent);
        setStatusText(`Processing ${sentCount} of ${total}: ${r.name} (${r.email}) - ${r.status}`);

        if (r.status !== "Sent") setHasFailure(true);
        await new Promise((res) => setTimeout(res, 200)); // Visual feedback
      }

      setStatusText("All emails processed.");
      downloadReport();
    } catch (err) {
      console.error(err);
      setStatusText("Upload failed.");
      setHasFailure(true);
      toast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadReport = () => {
  if (results.length === 0) return;

  const header = ["Name", "IPPIS Number", "Email", "Status"];
  const csvRows = [header.join(",")];

  results.forEach(r => {
    const row = [
      `"${r.name}"`,
      `"${r.staff_id}"`
      `"${r.email}"`,
      `"${r.status}"`,
    ];
    csvRows.push(row.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "payslip_status_report.csv";
  a.click();
  URL.revokeObjectURL(url);
};


  return (
    <Container className="mt-5 d-flex flex-column align-items-center">
      <Card style={{ maxWidth: "600px", width: "100%" }} className="p-4 shadow-sm">
        <Card.Body>
          <h3 className="mb-4 text-center">Upload Payslip PDF & Excel</h3>
          <Form>
            <Form.Group controlId="formPdf" className="mb-3">
              <Form.Label>Payslip PDF File</Form.Label>
              <Form.Control type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} />
            </Form.Group>
            <Form.Group controlId="formExcel" className="mb-4">
              <Form.Label>Excel Staff Sheet</Form.Label>
              <Form.Control type="file" accept=".xlsx" onChange={(e) => setExcelFile(e.target.files[0])} />
            </Form.Group>
            <Button
              variant="primary"
              disabled={isUploading || !pdfFile || !excelFile}
              onClick={handleUpload}
              className="w-100"
            >
              {isUploading ? "Processing..." : "Upload and Send"}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <ToastContainer />

      {isUploading && (
        <div className="mt-4 text-center">
          <Spinner animation="border" variant="success" />
        </div>
      )}

      {progress > 0 && (
        <div className="w-100 mt-3" style={{ maxWidth: "600px" }}>
          <ProgressBar
            now={progress}
            label={`${progress}%`}
            variant={hasFailure ? "danger" : "success"}
            animated
            striped
          />
          <div className="mt-2 fw-bold text-center">{statusText}</div>
        </div>
      )}

      {results.length > 0 && (
        <div className="w-100 mt-4" style={{ maxWidth: "600px" }}>
          <h5 className="mb-3">Results:</h5>

          <ul className="list-group">
            {results.map((r, idx) => (
              <li key={idx} className={`list-group-item d-flex justify-content-between align-items-center`}>
                <span>{r.name} ({r.email})</span>
                <span className={`badge bg-${r.status === "Sent" ? "success" : "danger"}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
};

export default UploadPayslip;
