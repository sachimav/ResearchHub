import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  tokenHash: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("adminInvitations", schema);
