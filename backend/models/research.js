import mongoose from "mongoose";

const researchSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "students",
      required: true,
    },

    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supervisors",
      default: null,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "batch",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    topic: {
      type: String,
    },

    academicYear: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "ongoing",
        "completed",
      ],
      default: "draft",
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("research", researchSchema);