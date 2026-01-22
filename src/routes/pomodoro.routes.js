import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getPomodoroRecommendation,
  startPomodoroSession,
  endPomodoroSession,
  getPomodoroHistory
} from "../controllers/pomodoro.controller.js";

const router = express.Router();

// Get recommended Pomodoro settings based on learning context
router.get("/recommendation", authMiddleware, getPomodoroRecommendation);

// Start a new Pomodoro session
router.post("/start", authMiddleware, startPomodoroSession);

// End a Pomodoro session
router.put("/end/:sessionId", authMiddleware, endPomodoroSession);

// Get user's Pomodoro session history
router.get("/sessions", authMiddleware, getPomodoroHistory);

export default router;
