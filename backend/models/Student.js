import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },

    regNo: {
      type: String,
      required: true,
      unique: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "departments",
      required: true,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "batch",
      required: true,
    },

    program: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("students", studentSchema);