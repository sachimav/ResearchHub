import mongoose from "mongoose";
import AuditLog from "../models/auditLog.js";
import { fail } from "./adminValidation.js";

const controlSchema = new mongoose.Schema({ _id: String, version: { type: Number, default: 0 } });
const AdminControl = mongoose.model("adminControl", controlSchema);

// Domain writes and their audit/notifications either commit together or roll back.
export const adminTransaction = async (work) => {
  try {
    // Serialize admin writes, including cross-record constraints such as capacity
    // and the last active admin. MongoDB retries conflicting transactions.
    try { await AdminControl.updateOne({ _id: "writes" }, { $setOnInsert: { version: 0 } }, { upsert: true }); }
    catch (error) { if (error.code !== 11000) throw error; }
    return await mongoose.connection.transaction(async (session) => {
      await AdminControl.updateOne({ _id: "writes" }, { $inc: { version: 1 } }, { session });
      return work(session);
    });
  } catch (error) {
    if (error.code === 20 || error.codeName === "IllegalOperation") fail(503, "Admin writes require MongoDB configured as a replica set or sharded cluster. See docs/ADMIN_API.md.");
    throw error;
  }
};
export const audit = async (req, session, action, resource, resourceId, changes = {}, reason = "") => {
  await AuditLog.create([{ actorId: req.user.id, action, resource, resourceId: String(resourceId), changes, reason }], { session });
};
