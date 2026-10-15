import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    researchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "research",
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    documentType: {
      type: String,
      enum: [
        "proposal",
        "report",
        "progress_report",
        "final_report",
        "other",
      ],
      required: true,
    },

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revision_requested"],
      default: "pending",
    },

    feedback: {
      type: String,
      default: "",
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("documents", documentSchema);