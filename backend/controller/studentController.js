import mongoose from "mongoose";

import Student from "../models/Student.js";
import Supervisor from "../models/supervisor.js";
import Research from "../models/research.js";
import Deadline from "../models/deadline.js";
import Document from "../models/document.js";
import Feedback from "../models/feedback.js";
import Notification from "../models/notification.js";
import Meeting from "../models/meeting.js";
import User from "../models/user.js";
import { activeStatuses, recalculateProgress, isWebUrl } from "../utils/researchPolicy.js";

const getStudent = (userId) =>
  Student.findOne({ userId })
    .populate("userId", "name email role phone")
    .populate("departmentId", "name")
    .populate("batchId", "batchName academicYear");

const getOwnedResearch = (researchId, studentId) => {
  if (!mongoose.isValidObjectId(researchId)) {
    return null;
  }
  return Research.findOne({ _id: researchId, studentId })
    .populate({
      path: "supervisorId",
      populate: [
        { path: "userId", select: "name email phone designation" },
        { path: "departmentId", select: "name" },
      ],
    })
    .populate("batchId", "batchName academicYear");
};

const defaultMilestones = [
  {
    title: "Research Proposal & Problem Formulation",
    description: "Formulate research questions, aims, objectives, and submit formal proposal.",
    status: "pending",
  },
  {
    title: "Literature Review & Theoretical Framework",
    description: "Comprehensive critical analysis of related peer-reviewed studies.",
    status: "pending",
  },
  {
    title: "Methodology & System Architecture",
    description: "Detailed system design, experimental setup, or algorithmic formulation.",
    status: "pending",
  },
  {
    title: "Implementation & Data Collection",
    description: "Core coding, model training, or experimental data collection.",
    status: "pending",
  },
  {
    title: "Evaluation & Results Discussion",
    description: "Performance metrics, comparative testing, and validation.",
    status: "pending",
  },
  {
    title: "Final Thesis Dissertation & Defense",
    description: "Final written dissertation submission and presentation to panel.",
    status: "pending",
  },
];

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

export const updateProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const { name, phone, program } = req.body;
    if (name !== undefined || phone !== undefined) {
      const updateData = {};
      if (name !== undefined) {
        if (!name.trim()) return res.status(400).json({ message: "Name cannot be empty." });
        updateData.name = name.trim();
      }
      if (phone !== undefined) updateData.phone = String(phone).trim();
      await User.findByIdAndUpdate(req.user.id, updateData, { runValidators: true });
    }

    if (program && typeof program === "string") {
      student.program = program.trim();
      await student.save();
    }

    const updated = await getStudent(req.user.id);
    return res.json({ student: updated, message: "Profile updated successfully." });
  } catch (error) {
    return next(error);
  }
};

export const getSupervisors = async (_req, res, next) => {
  try {
    const supervisors = await Supervisor.find()
      .populate("userId", "name email phone designation")
      .populate("departmentId", "name");
    return res.json({ supervisors });
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
    const [researchList, deadlines, meetings, unreadNotifications, allSupervisors, notifications] =
      await Promise.all([
        Research.find({ studentId: student._id })
          .populate({
            path: "supervisorId",
            populate: [
              { path: "userId", select: "name email phone designation" },
              { path: "departmentId", select: "name" },
            ],
          })
          .populate("batchId", "batchName academicYear")
          .sort({ updatedAt: -1 }),
        student.batchId
          ? Deadline.find({ batchId: student.batchId._id }).sort({ dueDate: 1 })
          : [],
        Meeting.find({ studentId: student._id })
          .populate({ path: "supervisorId", populate: { path: "userId", select: "name email designation" } })
          .populate("researchId", "title status")
          .sort({ meetingDate: 1 }),
        Notification.countDocuments({ userId: req.user.id, isRead: false }),
        Supervisor.find()
          .populate("userId", "name email designation")
          .populate("departmentId", "name"),
        Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }),
      ]);

    // Active project (first or currently ongoing/approved/pending project)
    const activeResearch = researchList[0] || null;
    let documents = [];
    let feedback = [];

    if (activeResearch) {
      [documents, feedback] = await Promise.all([
        Document.find({ researchId: activeResearch._id }).sort({ createdAt: -1 }),
        Feedback.find({ researchId: activeResearch._id })
          .populate("userId", "name role designation")
          .sort({ createdAt: -1 }),
      ]);
    }

    return res.json({
      student,
      research: activeResearch,
      allProjects: researchList,
      documents,
      feedback,
      deadlines,
      meetings,
      unreadNotifications,
      notifications,
      supervisors: allSupervisors,
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
    const research = await Research.find({ studentId: student._id })
      .populate({
        path: "supervisorId",
        populate: { path: "userId", select: "name email designation" },
      })
      .sort({ updatedAt: -1 });
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

    const { title, description, topic, academicYear, supervisorId, submit } = req.body;
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      (topic !== undefined && typeof topic !== "string") ||
      (academicYear !== undefined && typeof academicYear !== "string")
    ) {
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

    let assignedSupervisor = null;
    if (supervisorId) {
      if (!mongoose.isValidObjectId(supervisorId) || !await Supervisor.exists({ _id: supervisorId })) {
        return res.status(400).json({ message: "Select an existing supervisor." });
      }
      assignedSupervisor = supervisorId;
    }

    if (submit !== undefined && typeof submit !== "boolean") return res.status(400).json({ message: "submit must be a boolean." });
    if (submit === true && !assignedSupervisor) return res.status(400).json({ message: "Select a supervisor before submitting." });

    const initialStatus = submit === true ? "pending" : "draft";

    const research = await Research.create({
      studentId: student._id,
      supervisorId: assignedSupervisor,
      batchId: student.batchId._id,
      title: title.trim(),
      description: description.trim(),
      topic: topic?.trim(),
      academicYear: normalizedAcademicYear,
      status: initialStatus,
      milestones: defaultMilestones,
    });

    if (assignedSupervisor && initialStatus === "pending") {
      const sup = await Supervisor.findById(assignedSupervisor).select("userId");
      if (sup) {
        await Notification.create({
          userId: sup.userId,
          researchId: research._id,
          title: "New Research Proposal Submitted",
          message: `A student has submitted proposal "${research.title}" for your review.`,
          type: "proposal",
        });
      }
    }

    const populated = await getOwnedResearch(research._id, student._id);
    return res.status(201).json({ research: populated });
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
        .populate("userId", "name role designation")
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

    const research = await Research.findOne({ _id: req.params.researchId, studentId: student._id });
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

    if (req.body.supervisorId !== undefined) {
      if (req.body.supervisorId && mongoose.isValidObjectId(req.body.supervisorId)) {
        if (!await Supervisor.exists({ _id: req.body.supervisorId })) return res.status(400).json({ message: "Supervisor not found." });
        research.supervisorId = req.body.supervisorId;
      } else if (req.body.supervisorId === null || req.body.supervisorId === "") {
        research.supervisorId = null;
      } else {
        return res.status(400).json({ message: "Invalid supervisor ID." });
      }
    }

    if (req.body.submit !== undefined && typeof req.body.submit !== "boolean") {
      return res.status(400).json({ message: "submit must be a boolean." });
    }

    if (req.body.submit === true) {
      if (!research.supervisorId) return res.status(400).json({ message: "Select a supervisor before submitting." });
      research.status = "pending";
      if (research.supervisorId) {
        const sup = await Supervisor.findById(research.supervisorId).select("userId");
        if (sup) {
          await Notification.create({
            userId: sup.userId,
            researchId: research._id,
            title: "Research Proposal Submitted",
            message: `Proposal "${research.title}" is ready for your review.`,
            type: "proposal",
          });
        }
      }
    }

    await research.save();
    const populated = await getOwnedResearch(research._id, student._id);
    return res.json({ research: populated });
  } catch (error) {
    return next(error);
  }
};

export const updateMilestone = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const { researchId, milestoneId } = req.params;
    const { status } = req.body;
    if (!["pending", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid milestone status." });
    }

    const research = await Research.findOne({ _id: researchId, studentId: student._id });
    if (!research) {
      return res.status(404).json({ message: "Research project not found." });
    }

    const milestone = research.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found." });
    }

    if (!activeStatuses.includes(research.status)) return res.status(409).json({ message: "Only approved projects can update milestones." });

    if (status && ["pending", "in_progress", "completed"].includes(status)) {
      milestone.status = status;
      if (status === "completed" && !milestone.completedAt) {
        milestone.completedAt = new Date();
      } else if (status !== "completed") {
        milestone.completedAt = null;
      }
    }

    recalculateProgress(research);

    await research.save();
    return res.json({ research, milestone });
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

    const deadlines = await Deadline.find({ batchId: student.batchId }).sort({ dueDate: 1 });
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

    const research = await Research.findOne({ _id: req.params.researchId, studentId: student._id });
    if (!research) {
      return res.status(404).json({ message: "Research project not found." });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    const { title, fileUrl, documentType, visibility } = req.body;
    const allowedDocumentTypes = ["proposal", "report", "progress_report", "final_report", "other"];
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof fileUrl !== "string" ||
      !isWebUrl(fileUrl) ||
      !allowedDocumentTypes.includes(documentType)
    ) {
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
      visibility: visibility === "public" ? "public" : "private",
      status: "pending",
    });

    if (research.supervisorId) {
      const sup = await Supervisor.findById(research.supervisorId).select("userId");
      if (sup) {
        await Notification.create({
          userId: sup.userId,
          researchId: research._id,
          title: "New Document Uploaded",
          message: `Student uploaded a new ${documentType.replace("_", " ")}: "${title.trim()}".`,
          type: "feedback",
        });
      }
    }

    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
};

export const requestMeeting = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const { researchId, supervisorId, meetingDate, notes, location } = req.body;

    if (!researchId || !supervisorId || !meetingDate) {
      return res.status(400).json({ message: "researchId, supervisorId, and meetingDate are required." });
    }

    const research = await Research.findOne({ _id: researchId, studentId: student._id });
    if (!research) {
      return res.status(404).json({ message: "Research project not found." });
    }

    const supervisor = await Supervisor.findById(supervisorId).populate("userId", "name");
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor not found." });
    }

    if (research.supervisorId?.toString() !== supervisor._id.toString()) {
      return res.status(403).json({ message: "Meetings must be requested with your assigned supervisor." });
    }
    if (!Number.isFinite(new Date(meetingDate).getTime()) || new Date(meetingDate) <= new Date()) {
      return res.status(400).json({ message: "Choose a valid future meeting date." });
    }

    const meeting = await Meeting.create({
      studentId: student._id,
      supervisorId: supervisor._id,
      researchId: research._id,
      meetingDate: new Date(meetingDate),
      notes: notes?.trim() || "",
      location: location?.trim() || "Online Video Call / Faculty Office",
      status: "requested",
      requestedBy: req.user.id,
    });

    await Notification.create({
      userId: supervisor.userId._id,
      researchId: research._id,
      title: "New Meeting Request",
      message: `Student requested a meeting on ${new Date(meetingDate).toLocaleString()} regarding "${research.title}".`,
      type: "meeting",
    });

    return res.status(201).json({ meeting, message: "Meeting request submitted successfully." });
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
      .populate({ path: "supervisorId", populate: { path: "userId", select: "name email designation" } })
      .populate("researchId", "title status")
      .sort({ meetingDate: 1 });
    return res.json({ meetings });
  } catch (error) {
    return next(error);
  }
};

export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ notifications });
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
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
