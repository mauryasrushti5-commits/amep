import mongoose from "mongoose";

const masteryProfileSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    subject: String,
    overallLevel: String,
    masteryPercentage: Number,
    strongConcepts: [String],
    weakConcepts: [String],
    learningSpeed: String,
    confidenceScore: Number
  },
  { timestamps: true }
);

export default mongoose.model("MasteryProfile", masteryProfileSchema);
