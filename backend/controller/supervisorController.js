import mongoose from "mongoose";

import Student from "../models/Student.js";
import Supervisor from "../models/supervisor.js";
import Research from "../models/research.js";
import Document from "../models/document.js";
import Feedback from "../models/feedback.js";
import Deadline from "../models/deadline.js";
import Meeting from "../models/meeting.js";
import Notification from "../models/notification.js";

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


const getSupervisorOrRespond = async (req, res) => {
  const supervisor = await getSupervisor(req.user.id);
  if (!supervisor) {
    res.status(404).json({ message: "Supervisor profile not found." });
    return null;
  }
  return supervisor;
};

const validateMeetingDate = (meetingDate) => {
  if (typeof meetingDate !== "string" && !(meetingDate instanceof Date)) {
    return false;
  }
  const date = new Date(meetingDate);
  return !Number.isNaN(date.getTime());
};

const getAssignedMeeting = (meetingId, supervisorId) => {
  if (!mongoose.isValidObjectId(meetingId)) {
    return null;
  }
  return Meeting.findOne({ _id: meetingId, supervisorId });
};

const createMeetingNotification = (studentUserId, meeting, title, message) => Notification.create({
  userId: studentUserId,
  researchId: meeting.researchId,
  title,
  message,
  type: "meeting",
});

export const listMeetings = async (req, res, next) => {
  try {
    const supervisor = await getSupervisorOrRespond(req, res);
    if (!supervisor) {
      return;
    }

    const meetings = await Meeting.find({ supervisorId: supervisor._id })
      .populate({ path: "studentId", populate: { path: "userId", select: "name email" } })
      .populate("researchId", "title status")
      .sort({ meetingDate: 1 });
    return res.json({ meetings });
  } catch (error) {
    return next(error);
  }
};

export const sheduleMeeting = async (req, res, next) => {
  try {
    const supervisor = await getSupervisorOrRespond(req, res);
    if (!supervisor) {
      return;
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    const {
      researchId, meetingDate, meetingLink, location, notes,
    } = req.body;
    if (!mongoose.isValidObjectId(researchId) || !validateMeetingDate(meetingDate)) {
      return res.status(400).json({
        message: "researchId must be valid and meetingDate must be a valid date.",
      });
    }
    for (const [field, value] of [["meetingLink", meetingLink], ["location", location], ["notes", notes]]) {
      if (value !== undefined && typeof value !== "string") {
        return res.status(400).json({ message: `${field} must be a string.` });
      }
    }

    const research = await Research.findOne({
      _id: researchId,
      supervisorId: supervisor._id,
    }).populate("studentId", "userId");
    if (!research || !research.studentId) {
      return res.status(404).json({ message: "Assigned research project not found." });
    }

    const meeting = await Meeting.create({
      studentId: research.studentId._id,
      supervisorId: supervisor._id,
      researchId: research._id,
      meetingDate: new Date(meetingDate),
      meetingLink: meetingLink?.trim(),
      location: location?.trim(),
      notes: notes?.trim(),
    });
    await createMeetingNotification(
      research.studentId.userId,
      meeting,
      "New meeting scheduled",
      `A meeting has been scheduled for ${meeting.meetingDate.toISOString()}.`,
    );
    return res.status(201).json({ meeting });
  } catch (error) {
    return next(error);
  }
};

export const scheduleMeeting = sheduleMeeting;

export const updateMeeting = async (req, res, next) => {
  try {
    const supervisor = await getSupervisorOrRespond(req, res);
    if (!supervisor) {
      return;
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    const meeting = await getAssignedMeeting(req.params.meetingId, supervisor._id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }
    const allowedFields = ["meetingDate", "meetingLink", "location", "notes"];
    if (!allowedFields.some((field) => req.body[field] !== undefined)) {
      return res.status(400).json({ message: "Provide at least one meeting detail to update." });
    }

    if (req.body.meetingDate !== undefined) {
      if (!validateMeetingDate(req.body.meetingDate)) {
        return res.status(400).json({ message: "meetingDate must be a valid date." });
      }
      meeting.meetingDate = new Date(req.body.meetingDate);
    }
    for (const field of ["meetingLink", "location", "notes"]) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({ message: `${field} must be a string.` });
        }
        meeting[field] = req.body[field].trim();
      }
    }

    await meeting.save();
    const student = await Student.findById(meeting.studentId).select("userId");
    if (student) {
      await createMeetingNotification(
        student.userId,
        meeting,
        "Meeting updated",
        `Your meeting has been rescheduled or updated for ${meeting.meetingDate.toISOString()}.`,
      );
    }
    return res.json({ meeting });
  } catch (error) {
    return next(error);
  }
};

export const meetingStatus = async (req, res, next) => {
  try {
    const supervisor = await getSupervisorOrRespond(req, res);
    if (!supervisor) {
      return;
    }
    const { status } = req.body || {};
    if (!["completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "status must be completed or cancelled." });
    }

    const meeting = await getAssignedMeeting(req.params.meetingId, supervisor._id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }
    meeting.status = status;
    await meeting.save();

    const student = await Student.findById(meeting.studentId).select("userId");
    if (student) {
      await createMeetingNotification(
        student.userId,
        meeting,
        `Meeting ${status}`,
        `Your meeting on ${meeting.meetingDate.toISOString()} was marked ${status}.`,
      );
    }
    return res.json({ meeting });
  } catch (error) {
    return next(error);
  }
};

export const listDeadlines = async (req, res, next) => {
  try {
    const supervisor = await getSupervisorOrRespond(req, res);
    if (!supervisor) {
      return;
    }
    const assignedResearch = await Research.find({ supervisorId: supervisor._id })
      .select("batchId")
      .lean();
    const batchIds = [...new Set(assignedResearch.map(({ batchId }) => batchId?.toString()).filter(Boolean))];
    const deadlines = batchIds.length
      ? await Deadline.find({ batchId: { $in: batchIds } }).sort({ dueDate: 1 })
      : [];
    return res.json({ deadlines });
  } catch (error) {
    return next(error);
  }
};

export const getNotification = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    return res.json({ notifications });
  } catch (error) {
    return next(error);
  }
};

export const markNotification = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.notificationId)) {
      return res.status(404).json({ message: "Notification not found." });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user.id },
      { $set: { isRead: true } },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    return res.json({ notification });
  } catch (error) {
    return next(error);
  }
};

export const markAll = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } },
    );
    return res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    return next(error);
  }
};
