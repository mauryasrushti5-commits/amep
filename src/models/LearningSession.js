import mongoose from "mongoose";

const learningSessionSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    subject: String,
    topic: String,
    subtopic: String,
    difficulty: String,
    status: {
      type: String,
      default: "active"
    }
  },
  { timestamps: true }
);

export default mongoose.model("LearningSession", learningSessionSchema);
