import mongoose from "mongoose";

const payslipStatusSchema = new mongoose.Schema({
  staff_id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: "N/A",
  },
  email: {
    type: String,
    required: true,
  },
  file: {
    type: String,
    required: true, // path to the saved PDF file
  },
  status: {
    type: String,
    enum: ["Sent", "Failed"],
    default: "Failed",
  },
  sentAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

const PayslipStatus = mongoose.model("PayslipStatus", payslipStatusSchema);

export default PayslipStatus;
