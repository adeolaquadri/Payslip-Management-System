import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import fsExtra from "fs-extra";
import { PDFDocument } from "pdf-lib";
import PDFParser from "pdf2json";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
const { getDocument } = pdfjsLib;
import { createCanvas } from "canvas";
import Tesseract from "tesseract.js";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";
import PayslipStatus from "./models/Status.js";
import { verifyToken } from "./Middlewares/adminAuth.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import cookieParser from "cookie-parser";
import nodemailer from  "nodemailer"
import validator from "validator";


// --- App Configuration ---
dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: "https://www.fcahptibbursaryps.com.ng"
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// --- Utility Functions ---

// Extract text from PDF normally
const extractTextFromPDFPages = (pdfPath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", err => reject(err));
    pdfParser.on("pdfParser_dataReady", data => {
      if (data && data.Pages) {
        const pagesTexts = data.Pages.map(page => {
          const text = page.Texts.map(t => decodeURIComponent(t.R[0].T)).join(" ");
          return text.replace(/\s+/g, ' ').trim();
        });
        resolve(pagesTexts);
      } else {
        reject(new Error("No pages found"));
      }
    });
    pdfParser.loadPDF(pdfPath);
  });
};

// OCR page using PDF.js + canvas
const ocrPageUsingPDFJS = async (pdfPath, pageIndex) => {
  const loadingTask = getDocument(pdfPath);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageIndex + 1); // PDF.js pages are 1-based

  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  const imageBuffer = canvas.toBuffer("image/png");

  const { data: { text } } = await Tesseract.recognize(imageBuffer, "eng");
  return text.replace(/\s+/g, ' ').trim();
};

// Save single page to a new PDF
const saveMatchedPageToPdf = async (pdfDoc, pageIndex, outputPath) => {
  const newPdfDoc = await PDFDocument.create();
  const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
  newPdfDoc.addPage(copiedPage);

  const pdfBytes = await newPdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
};

// Send email with Segnivo
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,                   
  secure: false,                
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendPayslipEmail = async (email, filePath) => {
  try {
    const info = await smtpTransporter.sendMail({
      from: '"Payslip App" <admin@fcahptibbursaryps.com.ng>',
      to: email,
      subject: "Your Monthly Payslip",
      html: "<p>Please find your payslip attached.</p>",
      attachments: [
        {
          filename: path.basename(filePath),
          path: filePath,
        },
      ],
    });

    console.log(`✅ Sent to ${email} (${info.messageId})`);
    return "Sent";
  } catch (err) {
    console.error(`❌ Failed to send to ${email}:`, err.message);
    return "Failed";
  }
};



// --- Main Payslip Matching Function ---
const matchPayslipsByIPPISNumber = async (pdfFilePath, excelPath) => {
  const staffData = xlsx.readFile(excelPath);
  const staffSheet = staffData.Sheets[staffData.SheetNames[0]];
  const staffRecords = xlsx.utils.sheet_to_json(staffSheet);

  const staffMap = new Map();
  for (const record of staffRecords) {
    const ippisNumber = String(record["IPPIS Number"]).trim();
    if (ippisNumber) {
      staffMap.set(ippisNumber, record);
    }
  }

  const pdfBuffer = fs.readFileSync(pdfFilePath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();

  const pageTexts = await extractTextFromPDFPages(pdfFilePath);

  const matchedPayslips = [];

  for (let i = 0; i < pageCount; i++) {
    console.log(`Processing page ${i + 1}...`);

    let textContent = pageTexts[i];
    let usedOCR = false;

    if (!textContent || textContent.length < 30) {
      console.log(`Performing OCR on page ${i + 1}...`);
      textContent = await ocrPageUsingPDFJS(pdfFilePath, i);
      usedOCR = true;
    }

    let foundMatch = false;

    for (const [ippisNumber, record] of staffMap.entries()) {
      const regex = new RegExp(`IPPIS\\s*Number\\s*:?\\s*${ippisNumber}`, "i");

      if (regex.test(textContent)) {
        console.log(`✅ Matched: ${record.Name} (${record.Email}) on page ${i + 1} ${usedOCR ? "(OCR)" : "(text)"}`);

        const name = record.Name || "employee";
        const sanitizedName = name.replace(/[^a-z0-9]/gi, "_").toUpperCase();
        const fileName = `${sanitizedName}_${ippisNumber}.pdf`;
        const filePath = path.join("uploads", fileName);

        await saveMatchedPageToPdf(pdfDoc, i, filePath);

        matchedPayslips.push({
          staff_id: ippisNumber,
          name,
          email: record.Email,
          file: filePath,
        });

        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
      console.warn(`⚠️ No match found for page ${i + 1}`);
    }
  }

  return matchedPayslips;
};

// --- Upload Route ---
app.post("/upload", upload.fields([{ name: "pdf" }, { name: "excel" }]), async (req, res) => {
  const results = [];
  try {
    const pdfFilePath = req.files.pdf[0].path;
    const excelFilePath = req.files.excel[0].path;

    const matched = await matchPayslipsByIPPISNumber(pdfFilePath, excelFilePath);

    console.log("Matched Staffs:");
    matched.forEach((payslip, index) => {
      console.log(`${index + 1}. Name: ${payslip.name}, IPPIS: ${payslip.staff_id}, Email: ${payslip.email}`);
    });
    
    for (const match of matched) {
    const { email, name, file, staff_id } = match;

  // Step 1: Validate email
    if (!validator.isEmail(email)) {
       console.warn(`Invalid email for ${name} (${staff_id}): ${email}`);
       results.push({ ...match, status: "Invalid Email" });
       continue;
     }

  try {
    // Step 2: Send email
    const status = await sendPayslipEmail(email, file);
    console.log(`Email to ${email} - Status: ${status}`);
    results.push({ ...match, status });

  } catch (err) {
    // Step 3: Catch unexpected failures
    console.error(`Unexpected error sending to ${email}:`, err.message);
    results.push({ ...match, status: "Failed (Exception)" });
  }

  // Step 4: Wait before next email to prevent rate-limiting
  await new Promise(res => setTimeout(res, 700)); // 700ms delay
}


    // 🧹 Clean up uploaded and generated files
    await fsExtra.remove(pdfFilePath);
    await fsExtra.remove(excelFilePath);
    for (const match of matched) {
      await fsExtra.remove(match.file);
    }
    console.log("✅ Uploads cleaned.");

    res.json({ message: "Payslips processed", results });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process payslips" });
  }
});



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