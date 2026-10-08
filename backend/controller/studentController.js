import mongoose from "mongoose";

import Student from "../models/Student.js";
import Research from "../models/research.js";
import Deadline from "../models/deadline.js";
import Document from "../models/document.js";
import Feedback from "../models/feedback.js";
import Notification from "../models/notification.js";
import Meeting from "../models/meeting.js";

const getStudent = (userId) => Student.findOne({ userId })
    .populate("userId", "name email role")
    .populate("departmentId", "name")
    .populate("batchId", "batchName academicYear");

const getOwnedResearch = (researchId, studentId) => {
    if (!mongoose.isValidObjectId(researchId)) {
        return null;
    }
    return Research.findOne({ _id: researchId, studentId });
};

export const getProfile = async (req, res, next) => {
    try {
        const student = await getStudent(req.user.id);
        if (!student) {
            return res.status(404).json({ message: "Student profile not found." });
        }
        return res.status(200).json({ student });
    } catch (error) {
        return next(error);
    }
};

export const getDashboard = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const now = new Date();
    const [research, deadlines, meetings, unreadNotifications] = await Promise.all([
      Research.find({ studentId: student._id }).sort({ updatedAt: -1 }),
      student.batchId
        ? Deadline.find({ batchId: student.batchId._id, dueDate: { $gte: now } }).sort({ dueDate: 1 })
        : [],
      Meeting.find({ studentId: student._id, meetingDate: { $gte: now }, status: "scheduled" })
        .populate({ path: "supervisorId", populate: { path: "userId", select: "name email" } })
        .sort({ meetingDate: 1 }),
      Notification.countDocuments({ userId: req.user.id, isRead: false }),
    ]);

    return res.json({
      student,
      research,
      deadlines,
      meetings,
      unreadNotifications,
    });
  } catch (error) {
    return next(error);
  }
};


export const listResearch = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ message: "Student profile not found." });
        }
        const research = await Research.find({ studentId: student._id }).sort({ updatedAt: -1 });
        return res.json({ research });
    } catch (error) {
        return next(error);
    }
};

export const createResearch = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate("batchId", "academicYear");
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    const { title, description, topic, academicYear } = req.body;
    if (typeof title !== "string" || !title.trim()
      || typeof description !== "string" || !description.trim()
      || (topic !== undefined && typeof topic !== "string")
      || (academicYear !== undefined && typeof academicYear !== "string")) {
      return res.status(400).json({
        message: "Title and description are required; topic and academicYear must be strings.",
      });
    }
    if (!student.batchId) {
      return res.status(409).json({ message: "Student is not assigned to a batch." });
    }

    const normalizedAcademicYear = academicYear?.trim() || student.batchId.academicYear;
    if (!normalizedAcademicYear) {
      return res.status(409).json({ message: "Student batch has no academic year configured." });
    }

    const research = await Research.create({
      studentId: student._id,
      batchId: student.batchId._id,
      title: title.trim(),
      description: description.trim(),
      topic: topic?.trim(),
      academicYear: normalizedAcademicYear,
    });

    return res.status(201).json({ research });
  } catch (error) {
    return next(error);
  }
};

export const getResearchDetails = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const research = await getOwnedResearch(req.params.researchId, student._id);
    if (!research) {
      return res.status(404).json({ message: "Research project not found." });
    }

    const [documents, feedback] = await Promise.all([
      Document.find({ researchId: research._id }).sort({ createdAt: -1 }),
      Feedback.find({ researchId: research._id })
        .populate("userId", "name role")
        .sort({ createdAt: -1 }),
    ]);

    return res.json({ research, documents, feedback });
  } catch (error) {
    return next(error);
  }
};

export const updateResearch = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const research = await getOwnedResearch(req.params.researchId, student._id);
    if (!research) {
      return res.status(404).json({ message: "Research project not found." });
    }

    if (!["draft", "rejected"].includes(research.status)) {
      return res.status(409).json({
        message: "Only draft or rejected proposals can be edited.",
      });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    for (const field of ["title", "description", "topic"]) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({ message: `${field} must be a string.` });
        }
        const value = req.body[field].trim();
        if (field !== "topic" && !value) {
          return res.status(400).json({ message: `${field} cannot be empty.` });
        }
        research[field] = value;
      }
    }

    if (req.body.submit !== undefined && typeof req.body.submit !== "boolean") {
      return res.status(400).json({ message: "submit must be a boolean." });
    }
    if (req.body.submit === true) {
      research.status = "pending";
    }

    await research.save();
    return res.json({ research });
  } catch (error) {
    return next(error);
  }
};

export const listDeadlines = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }
    if (!student.batchId) {
      return res.status(409).json({ message: "Student is not assigned to a batch." });
    }

    const deadlines = await Deadline.find({ batchId: student.batchId })
      .sort({ dueDate: 1 });
    return res.json({ deadlines });
  } catch (error) {
    return next(error);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const research = await getOwnedResearch(req.params.researchId, student._id);
    if (!research) {
      return res.status(404).json({ message: "Research project not found." });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    const { title, fileUrl, documentType } = req.body;
    const allowedDocumentTypes = ["proposal", "report", "progress_report", "final_report", "other"];
    if (typeof title !== "string" || !title.trim()
      || typeof fileUrl !== "string" || !fileUrl.trim()
      || !allowedDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        message: "A title, fileUrl, and valid documentType are required.",
      });
    }

    const document = await Document.create({
      researchId: research._id,
      uploadedBy: req.user.id,
      title: title.trim(),
      fileUrl: fileUrl.trim(),
      documentType,
      visibility: "private",
    });

    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
};

export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    return res.json({ notifications });
  } catch (error) {
    return next(error);
  }
};

export const listMeetings = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const meetings = await Meeting.find({ studentId: student._id })
      .populate({ path: "supervisorId", populate: { path: "userId", select: "name email" } })
      .populate("researchId", "title status")
      .sort({ meetingDate: 1 });
    return res.json({ meetings });
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    return next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.notificationId)) {
      return res.status(404).json({ message: "Notification not found." });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    return res.json({ notification });
  } catch (error) {
    return next(error);
  }
};