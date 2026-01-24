/**
 * Quiz Routes
 */

import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getNextQuestion,
  submitAttempt
} from "../controllers/quiz.controller.js";

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/quiz/next?sessionId=...
router.get("/next", getNextQuestion);

// POST /api/quiz/attempt
router.post("/attempt", submitAttempt);

export default router;
