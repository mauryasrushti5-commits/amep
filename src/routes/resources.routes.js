/**
 * Resources Routes
 */

import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getResourceRecommendation,
  submitResourceFeedback
} from "../controllers/resources.controller.js";

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/resources/recommendation?sessionId=...
router.get("/recommendation", getResourceRecommendation);

// POST /api/resources/feedback (optional)
router.post("/feedback", submitResourceFeedback);

export default router;
