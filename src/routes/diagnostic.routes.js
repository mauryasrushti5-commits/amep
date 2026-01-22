import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  subjectDiagnostic,
  subtopicDiagnostic
} from "../controllers/diagnostic.controller.js";

const router = express.Router();

router.post("/subject", authMiddleware, subjectDiagnostic);
router.post("/subtopic", authMiddleware, subtopicDiagnostic);

export default router;
