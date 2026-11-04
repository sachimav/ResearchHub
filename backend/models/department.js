import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: true },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "departments",
      default: null,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

departmentSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
export default mongoose.model("departments", departmentSchema);
