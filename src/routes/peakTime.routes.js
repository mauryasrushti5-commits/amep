import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getPeakStudyTime } from "../controllers/peakTime.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getPeakStudyTime);

export default router;
