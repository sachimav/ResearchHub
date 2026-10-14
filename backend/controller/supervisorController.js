import mongoose from "mongoose";

import Student from "../models/Student.js";
import Supervisor from "../models/supervisor.js";
import Research from "../models/research.js";
import Document from "../models/document.js";
import Feedback from "../models/feedback.js";
import Deadline from "../models/deadline.js";
import Meeting from "../models/meeting.js";
import Notification from "../models/notification.js";

//asry apis

const researchStatuses = ["draft", "pending", "approved", "rejected", "ongoing", "completed"];
const progressStatuses = ["approved", "ongoing", "completed"];

const getSupervisor = (userId) => Supervisor.findOne({ userId });

const getAssignedResearch = (researchId, supervisorId) => {
  if (!mongoose.isValidObjectId(researchId)) {
    return null;
  }
  return Research.findOne({ _id: researchId, supervisorId });
};

const getAssignedResearchOrRespond = async (req, res) => {
  const supervisor = await getSupervisor(req.user.id);
  if (!supervisor) {
    res.status(404).json({ message: "Supervisor profile not found." });
    return null;
  }

  const research = await getAssignedResearch(req.params.researchId, supervisor._id);
  if (!research) {
    res.status(404).json({ message: "Research project not found." });
    return null;
  }
  return research;
};

export const listResearch = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const filter = { supervisorId: supervisor._id };
    if (req.query.status !== undefined) {
      if (typeof req.query.status !== "string" || !researchStatuses.includes(req.query.status)) {
        return res.status(400).json({
          message: `status must be one of: ${researchStatuses.join(", ")}.`,
        });
      }
      filter.status = req.query.status;
    }

    const research = await Research.find(filter).sort({ updatedAt: -1 });
    return res.json({ research });
  } catch (error) {
    return next(error);
  }
};

export const getResearch = async (req, res, next) => {
  try {
    const research = await getAssignedResearchOrRespond(req, res);
    if (!research) {
      return;
    }

    const [student, documents, feedback] = await Promise.all([
      Student.findById(research.studentId)
        .populate("userId", "name email")
        .populate("departmentId", "name")
        .populate("batchId", "batchName academicYear"),
      Document.find({ researchId: research._id }).sort({ createdAt: -1 }),
      Feedback.find({ researchId: research._id })
        .populate("userId", "name role")
        .sort({ createdAt: -1 }),
    ]);

    return res.json({ research, student, documents, feedback });
  } catch (error) {
    return next(error);
  }
};

export const review = async (req, res, next) => {
  try {
    const research = await getAssignedResearchOrRespond(req, res);
    if (!research) {
      return;
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }
    if (!["approved", "rejected"].includes(req.body.status)) {
      return res.status(400).json({ message: "status must be approved or rejected." });
    }
    if (research.status !== "pending") {
      return res.status(409).json({ message: "Only pending proposals can be reviewed." });
    }

    research.status = req.body.status;
    await research.save();
    return res.json({ research });
  } catch (error) {
    return next(error);
  }
};

export const getProgress = async (req, res, next) => {
  try {
    const research = await getAssignedResearchOrRespond(req, res);
    if (!research) {
      return;
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    const { progressPercentage, status } = req.body;
    if (progressPercentage === undefined && status === undefined) {
      return res.status(400).json({
        message: "Provide progressPercentage, status, or both.",
      });
    }
    if (progressPercentage !== undefined
      && (typeof progressPercentage !== "number"
        || !Number.isFinite(progressPercentage)
        || progressPercentage < 0
        || progressPercentage > 100)) {
      return res.status(400).json({ message: "progressPercentage must be a number from 0 to 100." });
    }
    if (status !== undefined && !progressStatuses.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${progressStatuses.join(", ")}.`,
      });
    }

    if (progressPercentage !== undefined) {
      research.progressPercentage = progressPercentage;
    }
    if (status !== undefined) {
      research.status = status;
    }
    await research.save();
    return res.json({ research });
  } catch (error) {
    return next(error);
  }
};

export const listStudents = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const research = await Research.find({ supervisorId: supervisor._id })
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "departmentId", select: "name" },
          { path: "batchId", select: "batchName academicYear" },
        ],
      })
      .sort({ updatedAt: -1 });

    const studentsById = new Map();
    for (const project of research) {
      const student = project.studentId;
      if (!student) {
        continue;
      }
      const studentId = student._id.toString();
      if (!studentsById.has(studentId)) {
        studentsById.set(studentId, { ...student.toObject(), research: [] });
      }
      studentsById.get(studentId).research.push(project);
    }

    return res.json({ students: Array.from(studentsById.values()) });
  } catch (error) {
    return next(error);
  }
};

export const addFeedback = async (req, res, next) => {
  try {
    const research = await getAssignedResearchOrRespond(req, res);
    if (!research) {
      return;
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

export const listDoucments = async (req, res, next) => {
  try {
    const research = await getAssignedResearchOrRespond(req, res);
    if (!research) {
      return;
    }

    const documents = await Document.find({ researchId: research._id })
      .sort({ createdAt: -1 });
    return res.json({ documents });
  } catch (error) {
    return next(error);
  }
};

export const listDocuments = listDoucments;


//linath apis


