import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Department from "../models/department.js";
import Batch from "../models/batch.js";

try {
  await connectDB();
  for (const name of [
    "Department of Information and Communication Technology", "Department of Physical Science",
    "Department of Bio Science", "Department of Business Studies",
  ]) await Department.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  for (const batchName of ["2020/2021", "2021/2022", "2022/2023"]) {
    await Batch.updateOne({ batchName }, { $setOnInsert: { batchName, academicYear: batchName } }, { upsert: true });
  }
  console.log("Reference departments and batches are ready. No user accounts were created.");
} catch (error) {
  console.error("Reference seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
