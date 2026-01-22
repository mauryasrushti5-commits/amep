import mongoose from "mongoose";

const pomodoroSessionSchema = new mongoose.Schema(
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
    focusDuration: {
      type: Number, // minutes
      required: true
    },
    breakDuration: {
      type: Number, // minutes
      required: true
    },
    cyclesCompleted: {
      type: Number,
      default: 0
    },
    startedAt: {
      type: Date,
      required: true
    },
    endedAt: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      enum: ["default", "fatigue_detected", "peak_time", "learning_momentum"],
      default: "default"
    }
  },
  { timestamps: true }
);

export default mongoose.model("PomodoroSession", pomodoroSessionSchema);
