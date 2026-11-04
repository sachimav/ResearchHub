import "../config/env.js";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/user.js";
import { adminTransaction, audit } from "../utils/adminTransaction.js";
import { email, password, text } from "../utils/adminValidation.js";
import { getJwtSecret } from "../config/env.js";

// Passwords are never accepted in command-line arguments or printed.
let hidden = false;
const output = new Writable({ write(chunk, _encoding, callback) { if (!hidden) process.stdout.write(chunk); callback(); } });
let prompts;
try {
  getJwtSecret();
  let name = process.env.ADMIN_NAME;
  let address = process.env.ADMIN_EMAIL;
  let secret = process.env.ADMIN_PASSWORD;
  if ((!name || !address || !secret) && !process.stdin.isTTY) throw new Error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD, or run this command in an interactive terminal.");
  if (!name || !address || !secret) {
    prompts = createInterface({ input: process.stdin, output, terminal: true });
    name ||= await prompts.question("Admin name: ");
    address ||= await prompts.question("Admin email: ");
    if (!secret) {
      process.stdout.write("Admin password (hidden): ");
      hidden = true;
      secret = await prompts.question("");
      hidden = false;
      process.stdout.write("\n");
    }
  }
  prompts?.close();
  name = text(name, "name");
  address = email(address);
  const digest = await bcrypt.hash(password(secret), 12);
  delete process.env.ADMIN_PASSWORD;
  secret = undefined;
  await connectDB();
  await User.init();
  await adminTransaction(async (session) => {
    if (await User.exists({ role: "admin" }).session(session)) throw new Error("An admin account already exists. Use an admin invitation to add another.");
    if (await User.exists({ email: address }).session(session)) throw new Error("This email is already registered; bootstrap does not promote or overwrite existing accounts.");
    const [user] = await User.create([{ name, email: address, password: digest, role: "admin", isActive: true }], { session });
    await audit({ user: { id: user._id } }, session, "bootstrap", "admins", user._id, { email: address });
  });
  console.log("First admin created. Sign in using the existing POST /api/auth/login endpoint.");
} catch (error) {
  hidden = false;
  console.error("Admin bootstrap failed:", error.message);
  process.exitCode = 1;
} finally {
  prompts?.close();
  await mongoose.disconnect();
}
