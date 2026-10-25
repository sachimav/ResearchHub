import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { seedDatabase } from "../config/seed.js";

if (process.env.NODE_ENV === "production") throw new Error("Demo seeding is disabled in production.");
try {
  await connectDB();
  await seedDatabase();
} finally {
  await mongoose.disconnect();
}
