import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import diagnosticRoutes from "./routes/diagnostic.routes.js";
import learningRoutes from "./routes/learning.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import peakTimeRoutes from "./routes/peakTime.routes.js";
import pomodoroRoutes from "./routes/pomodoro.routes.js";
import catalogRoutes from "./routes/catalog.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import resourcesRoutes from "./routes/resources.routes.js";
import healthRoutes from "./routes/health.routes.js";

import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/diagnostic", diagnosticRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/peak-time", peakTimeRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/health", healthRoutes);

app.use(errorHandler);

export default app;
