import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/studentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/rh/student", studentRoutes);

export default app