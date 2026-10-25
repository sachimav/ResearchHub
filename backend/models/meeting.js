import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "students",
      required: true,
    },

    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supervisors",
      required: true,
    },

    researchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "research",
      required: true,
    },

    meetingDate: {
      type: Date,
      required: true,
    },

    meetingLink: {
      type: String,
    },

    location: {
      type: String,
    },

    status: {
      type: String,
      enum: ["requested", "scheduled", "completed", "cancelled", "rejected"],
      default: "scheduled",
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

meetingSchema.index({ studentId: 1, meetingDate: 1 });
meetingSchema.index({ supervisorId: 1, meetingDate: 1 });

export default mongoose.model("meetings", meetingSchema);
