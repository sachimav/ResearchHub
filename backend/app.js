import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "./config/env.js";

import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/publicRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import supervisorRoutes from "./routes/supervisorRoutes.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173").split(",").map((value) => value.trim());
app.disable("x-powered-by");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "256kb" }));
app.use((req, res, next) => {
  if (["POST", "PATCH", "PUT"].includes(req.method)) {
    const hasBody = req.headers["transfer-encoding"] || Number(req.headers["content-length"] || 0) > 0;
    if (req.body === undefined && !hasBody) req.body = {};
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }
    const textFields = ["name", "email", "password", "confirmPassword", "role", "regNo", "department", "batch", "program", "designation", "institution", "phone", "invitationToken", "title", "description", "topic", "academicYear", "fileUrl", "documentType", "visibility", "status", "meetingLink", "location", "notes", "remarks", "message", "feedback", "deadlineType", "action"];
    for (const field of textFields) {
      if (req.body[field] !== undefined && typeof req.body[field] !== "string") return res.status(400).json({ message: `${field} must be a string.` });
    }
    for (const field of ["researchId", "supervisorId", "batchId", "departmentId", "milestoneId"]) {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== "" &&
          (typeof req.body[field] !== "string" || !mongoose.isValidObjectId(req.body[field]))) {
        return res.status(400).json({ message: `${field} must be a valid ID.` });
      }
    }
    for (const field of ["meetingDate", "dueDate"]) {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== "" &&
          (typeof req.body[field] !== "string" || !Number.isFinite(new Date(req.body[field]).getTime()))) {
        return res.status(400).json({ message: `${field} must be a valid date string.` });
      }
    }
  }
  return next();
});

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "unavailable", database: connected ? "connected" : "disconnected" });
});

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/rh/public", publicRoutes);
app.use("/api/student", studentRoutes);
app.use("/rh/student", studentRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/rh/supervisor", supervisorRoutes);

app.use((_req, res) => res.status(404).json({ message: "API route not found." }));

// Global Error Handler
app.use((err, _req, res, _next) => {
  let status = err.status || err.statusCode || 500;
  let message = status < 500 ? err.message : "An unexpected server error occurred.";
  if (err.name === "ValidationError") { status = 400; message = "Invalid data. Check the submitted fields."; }
  if (err.name === "CastError") { status = 400; message = "Invalid identifier or field value."; }
  if (err.code === 11000) { status = 409; message = "An account or record with these unique details already exists."; }
  if (err.name === "VersionError") { status = 409; message = "This record changed while you were editing it. Refresh and try again."; }
  if (status >= 500) console.error("Unhandled error:", err);
  return res.status(status).json({
    message,
  });
});

export default app;
