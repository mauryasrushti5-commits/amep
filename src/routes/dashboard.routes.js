import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getStudentDashboard } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getStudentDashboard);

export default router;
