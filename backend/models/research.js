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

    milestones: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          default: "",
        },
        dueDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed"],
          default: "pending",
        },
        completedAt: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

researchSchema.index({ studentId: 1, updatedAt: -1 });
researchSchema.index({ supervisorId: 1, status: 1 });
researchSchema.index({ isPublic: 1, status: 1, updatedAt: -1 });

export default mongoose.model("research", researchSchema);
