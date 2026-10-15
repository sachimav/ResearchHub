import mongoose from "mongoose";

import User from "../models/user.js";
import Research from "../models/research.js";
import Document from "../models/document.js";
import Feedback from "../models/feedback.js";
import Supervisor from "../models/supervisor.js";

const getPublicResearch = (researchId) => {
  if (!mongoose.isValidObjectId(researchId)) return null;
  return Research.findOne({ _id: researchId, isPublic: true });
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
};
 
export const updateProfile = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    const allowedFields = ["name", "institution", "designation", "phone"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({ message: ${field} must be a string. });
        }
        const value = req.body[field].trim();
        if (field === "name" && !value) {
          return res.status(400).json({ message: "name cannot be empty." });
        }
        updates[field] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update." });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
};
 
export const listResearch = async (req, res, next) => {
  try {
    const filter = { isPublic: true };

    const allowedStatuses = ["approved", "ongoing", "completed"];
    if (req.query.status !== undefined) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          message: status must be one of: ${allowedStatuses.join(", ")}.,
        });
      }
      filter.status = req.query.status;
    }

    if (req.query.academicYear !== undefined) {
      if (typeof req.query.academicYear !== "string" || !req.query.academicYear.trim()) {
        return res.status(400).json({ message: "academicYear must be a non-empty string." });
      }
      filter.academicYear = req.query.academicYear.trim();
    }

    const research = await Research.find(filter)
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "departmentId", select: "name" },
          { path: "batchId", select: "batchName academicYear" },
        ],
      })
      .populate({
        path: "supervisorId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({ research });
  } catch (error) {
    return next(error);
  }
};
 
export const getResearchDetails = async (req, res, next) => {
  try {
    const research = await getPublicResearch(req.params.researchId);
    if (!research) {
      return res.status(404).json({ message: "Research project not found." });
    }

    const [documents, feedback] = await Promise.all([
      Document.find({ researchId: research._id, visibility: "public" }).sort({ createdAt: -1 }),
      Feedback.find({ researchId: research._id })
        .populate("userId", "name role")
        .sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({ research, documents, feedback });
  } catch (error) {
    return next(error);
  }
};
 
export const addFeedback = async (req, res, next) => {
  try {
    const research = await getPublicResearch(req.params.researchId);
    if (!research) {
      return res.status(404).json({ message: "Research project not found." });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    if (typeof req.body.message !== "string" || !req.body.message.trim()) {
      return res.status(400).json({ message: "message is required." });
    }

    const feedback = await Feedback.create({
      researchId: research._id,
      userId: req.user.id,
      message: req.body.message.trim(),
    });

    return res.status(201).json({ feedback });
  } catch (error) {
    return next(error);
  }
};
 
export const listSupervisors = async (req, res, next) => {
  try {
    const supervisors = await Supervisor.find()
      .populate("userId", "name email")
      .populate("departmentId", "name")
      .select("designation expertise departmentId userId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ supervisors });
  } catch (error) {
    return next(error);
  }
};
