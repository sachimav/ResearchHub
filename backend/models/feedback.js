import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    researchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "research",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ researchId: 1, createdAt: -1 });

export default mongoose.model("feedbacks", feedbackSchema);
