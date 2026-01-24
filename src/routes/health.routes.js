import express from "express";
import { healthCheck } from "../controllers/health.controller.js";

const router = express.Router();

// No auth required for health check
router.get("/self-check", healthCheck);

export default router;
