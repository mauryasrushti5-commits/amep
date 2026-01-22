import mongoose from "mongoose";

const studyActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    accuracy: {
      type: Number, // 0 or 1
      required: true
    },
    responseTime: {
      type: Number, // seconds
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("StudyActivity", studyActivitySchema);
