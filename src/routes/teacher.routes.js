import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import teacherOnly from "../middlewares/teacher.middleware.js";
import {
  getStudents,
  getStudentSummary
} from "../controllers/teacher.controller.js";

const router = express.Router();

router.get("/students", authMiddleware, teacherOnly, getStudents);
router.get(
  "/students/:studentId",
  authMiddleware,
  teacherOnly,
  getStudentSummary
);

export default router;
