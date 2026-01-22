import mongoose from "mongoose";

const diagnosticRecordSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    subject: String,
    type: String,
    topic: String,
    answers: Array,
    analysisSummary: String
  },
  { timestamps: true }
);

export default mongoose.model("DiagnosticRecord", diagnosticRecordSchema);
