import React, { useState, useEffect } from "react";
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
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    // Load last estimated processing time info from localStorage
    const storedEstimate = localStorage.getItem("estimatedProcessingTime");
    if (storedEstimate) {
      setEstimate(JSON.parse(storedEstimate));
    }
  }, []);

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
    setElapsedTime(0);

    const startTime = Date.now();

    // Start elapsed timer immediately
    const elapsedInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const response = await axios.post("https://api.fcahptibbursaryps.com.ng/upload", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      const total = data.results.length;
      setResults(data.results);

      let sentCount = 0;
      for (const r of data.results) {
        sentCount++;
        const percent = Math.round((sentCount / total) * 100);
        setProgress(percent);
        setStatusText(`Processing ${sentCount} of ${total}: ${r.name} (${r.email}) - ${r.status}`);

        if (r.status !== "Sent") setHasFailure(true);
        await new Promise((res) => setTimeout(res, 200)); // Visual feedback
      }

      const totalTimeInSeconds = Math.floor((Date.now() - startTime) / 1000);
      const averagePerEmail = total > 0 ? totalTimeInSeconds / total : 0;

      // Save estimate for future use
      localStorage.setItem(
        "estimatedProcessingTime",
        JSON.stringify({
          averagePerEmail,
          lastTotalEmails: total,
          lastTotalTime: totalTimeInSeconds,
          timestamp: Date.now(),
        })
      );

      setEstimate({
        averagePerEmail,
        lastTotalEmails: total,
        lastTotalTime: totalTimeInSeconds,
      });

      setStatusText(`All emails processed in ${Math.floor(totalTimeInSeconds / 60)}m ${totalTimeInSeconds % 60}s.`);
    } catch (err) {
      console.error(err);
      setStatusText("Upload failed.");
      setHasFailure(true);
      toast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      clearInterval(elapsedInterval);
    }
  };

  const downloadReport = () => {
    if (results.length === 0) return;

    const header = ["Name", "IPPIS Number", "Email", "Status"];
    const csvRows = [header.join(",")];

    results.forEach((r) => {
      const row = [`"${r.name}"`, `"${r.staff_id}"`, `"${r.email}"`, `"${r.status}"`];
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
      {estimate && (
        <div className="mb-3 text-center text-muted" style={{ maxWidth: "600px", width: "100%" }}>
          Estimated processing time per email: {estimate.averagePerEmail.toFixed(2)}s <br />
          Last batch: {estimate.lastTotalEmails} emails in {Math.floor(estimate.lastTotalTime / 60)}m {estimate.lastTotalTime % 60}s
        </div>
      )}

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
          <div className="mt-2 fw-bold text-center" style={{ backgroundColor: "#d4edda", padding: "8px", borderRadius: "4px" }}>
            {statusText}
          </div>
          <div className="text-center text-muted">
            Time Elapsed: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="w-100 mt-4" style={{ maxWidth: "600px" }}>
          <h5 className="mb-3">Results:</h5>
          <button onClick={downloadReport} className="btn btn-success mt-3">
            Download Report
          </button>
          <ul className="list-group mt-3">
            {results.map((r, idx) => (
              <li key={idx} className="list-group-item d-flex justify-content-between align-items-center" style={{ backgroundColor: "#d4edda" }}>
                <span>
                  {r.name} ({r.email})
                </span>
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