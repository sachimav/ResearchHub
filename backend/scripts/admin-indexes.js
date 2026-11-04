import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Department from "../models/department.js";
import Batch from "../models/batch.js";
import { AcademicYear, DegreeProgram, MilestoneTemplate, SystemSettings } from "../models/adminConfiguration.js";
import AuditLog from "../models/auditLog.js";
import AdminInvitation from "../models/adminInvitation.js";

try {
  await connectDB({ autoIndex: false });
  // Creates declared indexes without dropping unrelated existing indexes.
  for (const Model of [Department, Batch, AcademicYear, DegreeProgram, MilestoneTemplate, SystemSettings, AuditLog, AdminInvitation]) {
    await Model.createIndexes();
    console.log(`${Model.modelName}: indexes ready`);
  }
} catch (error) {
  console.error("Admin index setup failed:", error.message);
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
