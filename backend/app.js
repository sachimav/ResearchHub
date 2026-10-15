import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/publicRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import supervisorRoutes from "./routes/supervisorRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/rh/public", publicRoutes);
app.use("/api/student", studentRoutes);
app.use("/rh/student", studentRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/rh/supervisor", supervisorRoutes);

export default app