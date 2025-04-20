import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import PDFParser from "pdf2json"
import { Resend } from "resend";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";
import PayslipStatus from "./models/Status.js";
import { verifyToken } from "./Middlewares/adminAuth.js";
import bcryptjs from  "bcryptjs"
import jsonwebtoken from "jsonwebtoken"
import cookieParser from "cookie-parser"
import nodemailer from "nodemailer"

// Setup
dotenv.config();
const app = express();
const port = process.env.PORT;
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(express.json());
app.use(cookieParser())
app.use(cors({
  credentials: true,
  origin: "https://www.fcahptibbursaryps.com.ng"
}));

// File upload config
// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Function to extract text from PDF using pdf2json
const extractTextFromPDFPage = (pdfPath, pageIndex) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", err => reject(err));
    pdfParser.on("pdfParser_dataReady", data => {
      if (data && data.Pages && data.Pages[pageIndex]) {
        const page = data.Pages[pageIndex];
        const text = page.Texts.map(t => decodeURIComponent(t.R[0].T)).join(" ");
        resolve(text);
      } else {
        reject(new Error(`No page at index ${pageIndex}`));
      }
    });
    pdfParser.loadPDF(pdfPath);
  });
};

// Match payslips by employee ID using pdf2json
const matchPayslipsByEmployeeId = async (pdfFilePath, excelPath) => {
  const staffData = xlsx.readFile(excelPath);
  const staffSheet = staffData.Sheets[staffData.SheetNames[0]];
  const staffRecords = xlsx.utils.sheet_to_json(staffSheet);

  const pdfBuffer = fs.readFileSync(pdfFilePath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const matchedPayslips = [];

  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const page = pdfDoc.getPage(i);
    const textContent = await extractTextFromPDFPage(pdfFilePath, i); // extract text from a specific page

    for (const record of staffRecords) {
      const employeeId = String(record["IPPIS Number"]).trim();

      if (new RegExp(`IPPIS Number[:\\s]*${employeeId}`, "i").test(textContent)) {
        const email = record.Email;
        if (!email || !email.includes("@")) continue;

        const name = record.Name || "employee";
        const sanitizedName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        const fileName = `${sanitizedName}_${employeeId}.pdf`;
        const filePath = path.join("uploads", fileName);

        await saveMatchedPageToPdf(pdfFilePath, i, filePath); // fixed page index

        matchedPayslips.push({
          staff_id: employeeId,
          name,
          email,
          file: filePath
        });
      }
    }
  }

  return matchedPayslips;
};

// Function to save only matched page from the original PDF into a new one
const saveMatchedPageToPdf = async (pdfFilePath, pageIndex, outputPath) => {
  const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfFilePath));
  const newPdfDoc = await PDFDocument.create();

  // Copy the matched page from the original PDF to the new one
  const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
  newPdfDoc.addPage(copiedPage);

  // Save the new PDF file with the matched page
  const pdfBytes = await newPdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
};

// Send email with Resend
const sendPayslipEmail = async (email, filePath) => {
  try {
    const content = fs.readFileSync(filePath).toString("base64");

    const { error } = await resend.emails.send({
      from: "Payslip App <admin@fcahptibbursaryps.com.ng>",
      to: email,
      subject: "Your Monthly Payslip",
      text: "Please find your payslip attached.",
      attachments: [
        {
          filename: path.basename(filePath),
          content,
          type: "application/pdf"
        }
      ]
    });

    if (error) {
      console.error(`Failed to send to ${email}:`, error);
      return "Failed";
    }

    console.log(`Successfully sent email to ${email}`);
    return "Sent";
  } catch (err) {
    console.error(`Error sending to ${email}:`, err);
    return "Failed";
  }
};

const results = [];

// Route to handle uploads
app.post("/upload", upload.fields([{ name: "pdf" }, { name: "excel" }]), async (req, res) => {
  try {
    const pdfFilePath = req.files.pdf[0].path;
    const excelFilePath = req.files.excel[0].path;

    const matched = await matchPayslipsByEmployeeId(pdfFilePath, excelFilePath);

    for (const match of matched) {
      const status = await sendPayslipEmail(match.email, match.file);
      results.push({ ...match, status });
    }

    res.json({ message: "Payslips processed", results });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process payslips" });
  }
});

// Status endpoint
app.get("/status", (req, res) => {
  res.json(results);
});

// Get status history
app.get("/status/history", verifyToken, async (req, res) => {
  try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ message: "Access Denied: No token provided" });
          }
    const token = authHeader.split(" ")[1];
    const verified = jsonwebtoken.verify(token, process.env.secret_key);
    const history = await PayslipStatus.find().sort({ createdAt: -1 });
    res.json({history, token});
  } catch (err) {
    console.error("Error fetching status history:", err);
    res.status(500).json({ message: "Internal server error." });
  }
})

//Admin Signup
app.post('/signup', async(req, res)=>{
  try {
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(403).json({ message: "Admin already exists. Registration closed." });
    }
    const { email, password, secretkey } = req.body;
    const hashedSecretKey = await bcryptjs.hash(secretkey, 10)
    const hashedPassword = await bcryptjs.hash(password, 10);
    const newAdmin = new Admin({ email, password: hashedPassword , secretkey: hashedSecretKey });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully." });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
})

//Admin authentication
app.post('/login', async(req, res)=>{
  try {
    const { email, password } = req.body;
 
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Unauthorized Access!" });
    }

    const isMatch = await bcryptjs.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Unauthorized Access!" });
    }

    // Generate JWT token (you can also use sessions instead)
    const token = jsonwebtoken.sign(
      { adminId: admin._id, email: admin.email },
      process.env.secret_key, {
        expiresIn: "1h",
      });
      return res.status(200).json({message: "Login Successful!", token, user: admin})
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
})

// Admin reset password
app.put('/reset_password', async(req, res)=>{
  try{
    const { email, password, confirm, secretkey } = req.body;
 
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email address!" });
    }
    if(confirm !== password){
      return res.status(403).json({ message: "Passwords do not match!"})
    }
    const isMatch = await bcryptjs.compare(secretkey, admin.secretkey);
    if (!isMatch) {
      return res.status(401).json({ message: "The secret key provided not found!"})
    }
    const hashedPassword = await bcryptjs.hash(password, 10);
    const updatedAdmin = {
      password: hashedPassword
    }
    const updateAdmin = await Admin.findByIdAndUpdate(admin._id, updatedAdmin, {new: true})
    return res.status(200).json({message: "Password reset successfully!", admin: updateAdmin})    

  }catch(e){
    return res.status(500).json({ message: e.message})
  }
})

// delete admin
app.delete('/admin', verifyToken, async(req, res)=>{
  try{
    const admin = await Admin.deleteOne()
    if(!admin){res.status(404).json({message: "Admin not found"})
    }else{
  return res.status(200).json({message: "Admin deleted successfully"})
}
  }catch(e){
    return res.status(500).json({'Error ': e.message})
  }
})

// verify token from cookie
app.get("/auth", (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access Denied: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const verified = jsonwebtoken.verify(token, process.env.secret_key);

    // You can send the user data back if needed
    return res.status(200).json({ authenticated: true, user: verified });

  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token", error: error.message });
  }
});


// Start server
mongoose.connect(process.env.MONGO_URL)
.then(()=>{
   app.listen(port, ()=>{console.log(`Server is listening to port ${port}`)})
   console.log("Connected to MongoDB successfully")
})
.catch((err)=>{
   console.log(err)
})