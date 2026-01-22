import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import diagnosticRoutes from "./routes/diagnostic.routes.js";
import learningRoutes from "./routes/learning.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";

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

app.use(errorHandler);

export default app;
