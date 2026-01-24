import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getLearningSession,
  submitAttempt,
  endSession,
  startSession
} from "../controllers/learning.controller.js";

const router = express.Router();

router.post("/session/start", authMiddleware, startSession);
router.get("/session", authMiddleware, getLearningSession);
router.post("/attempt", authMiddleware, submitAttempt);
router.post("/end", authMiddleware, endSession);

export default router;
