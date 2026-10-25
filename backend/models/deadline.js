import mongoose from "mongoose";

const deadlineSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "batch",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    deadlineType: {
      type: String,
      enum: [
        "proposal",
        "progress_report",
        "final_report",
        "presentation",
        "other",
      ],
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    isNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

deadlineSchema.index({ batchId: 1, dueDate: 1 });

export default mongoose.model("deadline", deadlineSchema);
