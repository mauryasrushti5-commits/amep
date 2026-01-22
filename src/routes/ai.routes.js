import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { askAIQuestion } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/ask", authMiddleware, askAIQuestion);

export default router;
