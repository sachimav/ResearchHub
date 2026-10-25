import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/user.js";
import Student from "../models/Student.js";
import Supervisor from "../models/supervisor.js";
import Research from "../models/research.js";
import Document from "../models/document.js";
import "../models/batch.js";
import "../models/department.js";

try {
  await connectDB({ autoIndex: false, autoCreate: false });
  await mongoose.connection.db.admin().ping();
  console.log("Database ping: OK");
  for (const Model of [User, Student, Supervisor, Research, Document]) {
    console.log(`${Model.modelName}: ${await Model.countDocuments()} records`);
  }
  for (const [Model, field, collection] of [
    [Student, "userId", "users"], [Student, "batchId", "batches"], [Student, "departmentId", "departments"],
    [Supervisor, "userId", "users"], [Supervisor, "departmentId", "departments"],
    [Research, "studentId", "students"], [Research, "supervisorId", "supervisors"], [Research, "batchId", "batches"],
    [Document, "researchId", "researches"],
  ]) {
    const result = await Model.aggregate([
      { $match: { [field]: { $ne: null } } },
      { $lookup: { from: collection, localField: field, foreignField: "_id", as: "reference" } },
      { $match: { reference: { $size: 0 } } }, { $count: "count" },
    ]);
    console.log(`${Model.modelName}.${field} missing references: ${result[0]?.count || 0}`);
    if (result[0]?.count) process.exitCode = 1;
  }
} catch (error) {
  console.error("Database check failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
