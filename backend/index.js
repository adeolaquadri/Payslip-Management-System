import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
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
  origin: "http://localhost:3000"
}));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Extract pages from PDF
const extractPayslipPages = async (pdfPath) => {
  const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
  const payslipFiles = [];

  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const newPdfDoc = await PDFDocument.create();
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(copiedPage);

    const pdfBytes = await newPdfDoc.save();
    const payslipPath = `uploads/payslip_${i + 1}.pdf`;
    fs.writeFileSync(payslipPath, pdfBytes);
    payslipFiles.push(payslipPath);
  }

  console.log(`Extracted ${payslipFiles.length} payslip pages from ${pdfPath}`); // Log extraction
  return payslipFiles;
};

// Match payslips to emails by order in Excel
const matchPayslipsToEmailsByOrder = (payslipFiles, excelPath) => {
  const staffData = xlsx.readFile(excelPath);
  const staffSheet = staffData.Sheets[staffData.SheetNames[0]];
  const staffRecords = xlsx.utils.sheet_to_json(staffSheet);

  const matchedPaySlips = [];

  for (let i = 0; i < payslipFiles.length; i++) {
    const record = staffRecords[i];
    if (!record || !record.Email || !record.Email.includes("@")) continue;

    const name = record.Name || "N/A";
    const sanitizedFileName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase(); // sanitize name for filename
    const newFilePath = `uploads/${sanitizedFileName}.pdf`;

    // Rename the original file
    fs.renameSync(payslipFiles[i], newFilePath);

    matchedPaySlips.push({
      staff_id: record["Employee ID"],
      name,
      email: record.Email,
      file: newFilePath,
    });
  }

  console.log(`Matched ${matchedPaySlips.length} payslips to emails with employee names as filenames`);
  return matchedPaySlips;
};

// Configure Mailtrap's sandbox SMTP
// const transporter = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 587,
//   auth: {
//     user: "5d50d399504707", // from Mailtrap > Email Testing > SMTP Settings
//     pass: "b6b65a83e9bcfa",
//   },
// });

// Send email with Resend
const sendPayslipEmail = async (email, filePath) => {
  try {
    const content = fs.readFileSync(filePath).toString("base64");

    const { error } = await resend.emails.send({
      from: "Payslip App <onboarding@resend.dev>",
      to: email,
      subject: "Your Monthly Payslip",
      text: "Please find your payslip attached.",
      attachments: [
        {
          filename: path.basename(filePath),
          content,
          type: "application/pdf",
        },
      ],
    });

    if (error) {
      console.error(`Failed to send to ${email}:`, error); // Log error
      return "Failed";
    }

    console.log(`Successfully sent email to ${email}`); // Log success
    return "Sent";
  } catch (err) {
    console.error(`Error sending to ${email}:`, err); // Log exception
    return "Failed";
  }
};

// const sendPayslipEmail = async (email, filePath) => {
//   try {
//     const content = fs.readFileSync(filePath);

//     const mailOptions = {
//       from: '"Payslip App (Dev)" <dev@payslip.local>',
//       to: email,
//       subject: "Your Monthly Payslip (Test)",
//       text: "This is a test email from development. Please find the payslip attached.",
//       attachments: [
//         {
//           filename: path.basename(filePath),
//           content,
//           contentType: "application/pdf",
//         },
//       ],
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Test email sent to ${email}`);
//     return "Sent";
//   } catch (err) {
//     console.error(`Failed to send test email to ${email}:`, err);
//     return "Failed";
//   }
// };

// Global variable for storing latest matched payslips
let latestMatchedPayslips = [];

// Upload endpoint
app.post("/upload", upload.fields([{ name: "pdf" }, { name: "excel" }]), async (req, res) => {
  if (!req.files.pdf || !req.files.excel) {
    console.warn("Both PDF and Excel files are required!"); // Log warning
    return res.status(400).json({ message: "Both PDF and Excel files are required!" });
  }

  const pdfPath = req.files.pdf[0].path;
  const excelPath = req.files.excel[0].path;

  try {
    const payslipFiles = await extractPayslipPages(pdfPath);
    const matchedPayslips = matchPayslipsToEmailsByOrder(payslipFiles, excelPath);

    for (const payslip of matchedPayslips) {
      const status = await sendPayslipEmail(payslip.email, payslip.file);
      payslip.status = status;

      await PayslipStatus.create({
        staff_id: payslip.staff_id,
        name: payslip.name,
        email: payslip.email,
        file: payslip.file,
        status,
        sentAt: status === "Sent" ? new Date() : null,
      });
    }

    latestMatchedPayslips = matchedPayslips;
    console.log("Payslips processed successfully!"); // Log successful processing
    res.json({ message: "Payslips processed successfully!", matchedPayslips });
  } catch (error) {
    console.error("Error processing payslips:", error); // Log processing error
    res.status(500).json({ message: "Internal server error." });
  }
});

// Status endpoint
app.get("/status", (req, res) => {
  res.json(latestMatchedPayslips);
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

//Get Admin
app.get('/admin', async(req, res)=>{
  try{
    const admin = await Admin.find()
    if(!admin){ res.status(404).json({message: "Admin not found"})}
    else{
       return res.status(200).json(admin)
    }
 }catch(e){
    return res.status(500).json({'Error': e.message})
 }
})
// delete admin
app.delete('/admin', async(req, res)=>{
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