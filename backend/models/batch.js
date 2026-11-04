import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: true },
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
    optimisticConcurrency: true,
  }
);

batchSchema.index({ batchName: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
export default mongoose.model("batch", batchSchema);
