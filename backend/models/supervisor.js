import mongoose from "mongoose";

const supervisorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "departments",
      required: true,
    },

    designation: {
      type: String,
    },

    expertise: [
      {
        type: String,
      },
    ],

    availability: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Supervisors", supervisorSchema);