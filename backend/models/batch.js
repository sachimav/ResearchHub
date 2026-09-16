import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    batchName: {
      type: String,
      required: true,
      trim: true,
    },

    academicYear: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("batch", batchSchema);