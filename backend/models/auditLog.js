import mongoose from "mongoose";

const schema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, immutable: true },
  action: { type: String, required: true, immutable: true },
  resource: { type: String, required: true, immutable: true },
  resourceId: { type: String, required: true, immutable: true },
  reason: { type: String, default: "", immutable: true },
  changes: { type: mongoose.Schema.Types.Mixed, immutable: true },
  createdAt: { type: Date, default: Date.now, immutable: true },
});
schema.index({ createdAt: -1, _id: -1 });
schema.index({ actorId: 1, createdAt: -1 });
export default mongoose.model("auditLogs", schema);
