import mongoose from "mongoose";

import Student from "../models/Student.js";
import Supervisor from "../models/supervisor.js";
import Research from "../models/research.js";
import Document from "../models/document.js";
import Feedback from "../models/feedback.js";
import Deadline from "../models/deadline.js";
import Meeting from "../models/meeting.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";

const researchStatuses = ["draft", "pending", "approved", "rejected", "ongoing", "completed"];
const progressStatuses = ["approved", "ongoing", "completed"];

const getSupervisor = (userId) =>
  Supervisor.findOne({ userId })
    .populate("userId", "name email phone designation")
    .populate("departmentId", "name");

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
    res.status(404).json({ message: "Assigned research project not found." });
    return null;
  }
  return research;
};

export const getDashboard = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const now = new Date();

    // Find all research assigned to or requesting this supervisor
    const [assignedProjects, meetings, notifications, allStudents] = await Promise.all([
      Research.find({ supervisorId: supervisor._id })
        .populate({
          path: "studentId",
          populate: [
            { path: "userId", select: "name email phone" },
            { path: "departmentId", select: "name" },
            { path: "batchId", select: "batchName academicYear" },
          ],
        })
        .populate("batchId", "batchName academicYear")
        .sort({ updatedAt: -1 }),
      Meeting.find({ supervisorId: supervisor._id })
        .populate({
          path: "studentId",
          populate: { path: "userId", select: "name email phone" },
        })
        .populate("researchId", "title status")
        .sort({ meetingDate: 1 }),
      Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }),
      Student.find()
        .populate("userId", "name email phone")
        .populate("departmentId", "name")
        .populate("batchId", "batchName academicYear"),
    ]);

    const projectIds = assignedProjects.map((p) => p._id);
    const batchIds = [...new Set(assignedProjects.map((p) => p.batchId?._id?.toString()).filter(Boolean))];

    const [documents, deadlines] = await Promise.all([
      Document.find({ researchId: { $in: projectIds } })
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 }),
      batchIds.length
        ? Deadline.find({ batchId: { $in: batchIds } }).sort({ dueDate: 1 })
        : [],
    ]);

    const pendingProposals = assignedProjects.filter((p) => p.status === "pending");
    const pendingDocuments = documents.filter((d) => d.status === "pending");
    const meetingRequests = meetings.filter((m) => m.status === "requested");
    const upcomingMeetings = meetings.filter((m) => m.status === "scheduled" && new Date(m.meetingDate) >= now);

    // Overdue tasks: deadlines passed or milestones past due
    const overdueDeadlines = deadlines.filter((d) => new Date(d.dueDate) < now);

    return res.json({
      supervisor,
      assignedProjects,
      allStudents,
      documents,
      deadlines,
      meetings,
      notifications,
      stats: {
        totalStudents: assignedProjects.length,
        activeProjects: assignedProjects.filter((p) => ["approved", "ongoing"].includes(p.status)).length,
        completedProjects: assignedProjects.filter((p) => p.status === "completed").length,
        pendingProposalsCount: pendingProposals.length,
        pendingDocumentsCount: pendingDocuments.length,
        pendingMeetingRequestsCount: meetingRequests.length,
        upcomingMeetingsCount: upcomingMeetings.length,
        overdueCount: overdueDeadlines.length,
      },
    });
  } catch (error) {
    return next(error);
  }
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

    const research = await Research.find(filter)
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name email phone" },
          { path: "departmentId", select: "name" },
          { path: "batchId", select: "batchName academicYear" },
        ],
      })
      .populate("batchId", "batchName academicYear")
      .sort({ updatedAt: -1 });

    return res.json({ research });
  } catch (error) {
    return next(error);
  }
};

export const getReviewQueue = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const [proposals, meetings] = await Promise.all([
      Research.find({ supervisorId: supervisor._id, status: "pending" })
        .populate({
          path: "studentId",
          populate: [
            { path: "userId", select: "name email" },
            { path: "departmentId", select: "name" },
            { path: "batchId", select: "batchName academicYear" },
          ],
        })
        .sort({ updatedAt: -1 }),
      Meeting.find({ supervisorId: supervisor._id, status: "scheduled" })
        .populate({
          path: "studentId",
          populate: { path: "userId", select: "name email" },
        })
        .populate("researchId", "title status")
        .sort({ meetingDate: 1 }),
    ]);

    return res.json({ proposals, meetings });
  } catch (error) {
    return next(error);
  }
};

export const getResearch = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const research = await Research.findOne({ _id: req.params.researchId, supervisorId: supervisor._id })
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name email phone" },
          { path: "departmentId", select: "name" },
          { path: "batchId", select: "batchName academicYear" },
        ],
      })
      .populate("batchId", "batchName academicYear");

    if (!research) {
      return res.status(404).json({ message: "Research project not found or not assigned to you." });
    }

    const [documents, feedback] = await Promise.all([
      Document.find({ researchId: research._id }).sort({ createdAt: -1 }),
      Feedback.find({ researchId: research._id })
        .populate("userId", "name role designation")
        .sort({ createdAt: -1 }),
    ]);

    return res.json({ research, student: research.studentId, documents, feedback });
  } catch (error) {
    return next(error);
  }
};

export const review = async (req, res, next) => {
  try {
    const research = await getAssignedResearchOrRespond(req, res);
    if (!research) return;

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A JSON object is required." });
    }

    const { status, remarks } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be approved or rejected." });
    }
    if (research.status !== "pending") {
      return res.status(409).json({ message: "Only pending proposals can be reviewed." });
    }

    research.status = status;
    if (status === "approved") {
      research.startDate = new Date();
      // Ensure milestones exist
      if (!research.milestones || research.milestones.length === 0) {
        research.milestones = [
          { title: "Literature Review & Problem Formulation", status: "in_progress" },
          { title: "Methodology & Architecture Design", status: "pending" },
          { title: "Implementation & Experimentation", status: "pending" },
          { title: "Final Evaluation & Thesis Defense", status: "pending" },
        ];
      }
    }

    await research.save();

    // If remarks provided, add feedback
    if (remarks && typeof remarks === "string" && remarks.trim()) {
      await Feedback.create({
        researchId: research._id,
        userId: req.user.id,
        message: remarks.trim(),
      });
    }

    // Notify student
    const student = await Student.findById(research.studentId).select("userId");
    if (student) {
      await Notification.create({
        userId: student.userId,
        researchId: research._id,
        title: `Research Proposal ${status === "approved" ? "Approved!" : "Requires Revision"}`,
        message: `Your research proposal "${research.title}" has been marked ${status} by your supervisor.${
          remarks ? ` Remarks: ${remarks.trim()}` : ""
        }`,
        type: status === "approved" ? "approval" : "rejection",
      });
    }

    return res.json({ research, message: `Proposal ${status} successfully.` });
  } catch (error) {
    return next(error);
  }
};

export const getProgress = async (req, res, next) => {
  try {
    const research = await getAssignedResearchOrRespond(req, res);
    if (!research) return;

    const { progressPercentage, status, isPublic } = req.body;
    if (progressPercentage === undefined && status === undefined && isPublic === undefined) {
      return res.status(400).json({
        message: "Provide progressPercentage, status, or isPublic.",
      });
    }
    if (
      progressPercentage !== undefined &&
      (typeof progressPercentage !== "number" ||
        !Number.isFinite(progressPercentage) ||
        progressPercentage < 0 ||
        progressPercentage > 100)
    ) {
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
    if (isPublic !== undefined) {
      if (typeof isPublic === "boolean") {
        research.isPublic = isPublic;
      } else if (isPublic === "true" || isPublic === "false") {
        research.isPublic = isPublic === "true";
      }
    }

    await research.save();

    const student = await Student.findById(research.studentId).select("userId");
    if (student) {
      const isOnlyShowcaseUpdate = isPublic !== undefined && progressPercentage === undefined && status === undefined;
      await Notification.create({
        userId: student.userId,
        researchId: research._id,
        title: isOnlyShowcaseUpdate
          ? (research.isPublic ? "Research Published to Showcase" : "Research Removed from Showcase")
          : "Research Progress Updated",
        message: isOnlyShowcaseUpdate
          ? `Your supervisor has ${research.isPublic ? "published your research to the public research showcase" : "removed your research from the public showcase"}.`
          : `Your supervisor updated progress to ${research.progressPercentage}% (${research.status}).`,
        type: "general",
      });
    }

    return res.json({ research, message: "Progress updated successfully." });
  } catch (error) {
    return next(error);
  }
};

export const manageMilestones = async (req, res, next) => {
  try {
    const research = await getAssignedResearchOrRespond(req, res);
    if (!research) return;

    const { action, milestoneId, title, description, dueDate, status } = req.body;

    if (action === "add") {
      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Milestone title is required." });
      }
      research.milestones.push({
        title: title.trim(),
        description: description?.trim() || "",
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "pending",
      });
    } else if (action === "update") {
      const milestone = research.milestones.id(milestoneId);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found." });
      }
      if (title !== undefined) milestone.title = title.trim();
      if (description !== undefined) milestone.description = description.trim();
      if (dueDate !== undefined) milestone.dueDate = dueDate ? new Date(dueDate) : null;
      if (status !== undefined && ["pending", "in_progress", "completed"].includes(status)) {
        milestone.status = status;
        milestone.completedAt = status === "completed" ? new Date() : null;
      }
    } else if (action === "delete") {
      research.milestones.pull(milestoneId);
    } else {
      return res.status(400).json({ message: "Valid action ('add', 'update', 'delete') is required." });
    }

    if (research.milestones.length > 0) {
      const completedCount = research.milestones.filter((m) => m.status === "completed").length;
      research.progressPercentage = Math.round((completedCount / research.milestones.length) * 100);
    }

    await research.save();
    return res.json({ research, milestones: research.milestones });
  } catch (error) {
    return next(error);
  }
};

export const reviewDocument = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const { status, feedback } = req.body;
    if (!["approved", "rejected", "revision_requested"].includes(status)) {
      return res.status(400).json({ message: "Valid status required ('approved', 'rejected', 'revision_requested')." });
    }

    const document = await Document.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const research = await Research.findOne({ _id: document.researchId, supervisorId: supervisor._id });
    if (!research) {
      return res.status(403).json({ message: "You are not authorized to review this document." });
    }

    document.status = status;
    document.feedback = feedback?.trim() || "";
    document.reviewedAt = new Date();
    await document.save();

    await Notification.create({
      userId: document.uploadedBy,
      researchId: research._id,
      title: `Document ${status.replace("_", " ")}`,
      message: `Your document "${document.title}" has been reviewed by your supervisor. Status: ${status}.${
        feedback ? ` Notes: ${feedback.trim()}` : ""
      }`,
      type: "feedback",
    });

    return res.json({ document, message: "Document review saved." });
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
          { path: "userId", select: "name email phone" },
          { path: "departmentId", select: "name" },
          { path: "batchId", select: "batchName academicYear" },
        ],
      })
      .sort({ updatedAt: -1 });

    const studentsById = new Map();
    for (const project of research) {
      const student = project.studentId;
      if (!student) continue;
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
    if (!research) return;

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

    const student = await Student.findById(research.studentId).select("userId");
    if (student) {
      await Notification.create({
        userId: student.userId,
        researchId: research._id,
        title: "New Supervisor Feedback",
        message: `Your supervisor provided new guidance on "${research.title}": "${req.body.message.trim()}"`,
        type: "feedback",
      });
    }

    return res.status(201).json({ feedback });
  } catch (error) {
    return next(error);
  }
};

export const listDocuments = async (req, res, next) => {
  try {
    const research = await getAssignedResearchOrRespond(req, res);
    if (!research) return;

    const documents = await Document.find({ researchId: research._id }).sort({ createdAt: -1 });
    return res.json({ documents });
  } catch (error) {
    return next(error);
  }
};

export const listMeetings = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const meetings = await Meeting.find({ supervisorId: supervisor._id })
      .populate({ path: "studentId", populate: { path: "userId", select: "name email phone" } })
      .populate("researchId", "title status")
      .sort({ meetingDate: 1 });
    return res.json({ meetings });
  } catch (error) {
    return next(error);
  }
};

export const scheduleMeeting = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const { researchId, meetingDate, meetingLink, location, notes } = req.body;
    if (!mongoose.isValidObjectId(researchId) || !meetingDate) {
      return res.status(400).json({ message: "Valid researchId and meetingDate are required." });
    }

    const research = await Research.findOne({ _id: researchId, supervisorId: supervisor._id }).populate("studentId");
    if (!research || !research.studentId) {
      return res.status(404).json({ message: "Assigned research project not found." });
    }

    const meeting = await Meeting.create({
      studentId: research.studentId._id,
      supervisorId: supervisor._id,
      researchId: research._id,
      meetingDate: new Date(meetingDate),
      meetingLink: meetingLink?.trim() || "",
      location: location?.trim() || "Supervisor Office / Microsoft Teams",
      notes: notes?.trim() || "",
      status: "scheduled",
    });

    await Notification.create({
      userId: research.studentId.userId,
      researchId: research._id,
      title: "New Meeting Scheduled",
      message: `Supervisor scheduled a research meeting for ${meeting.meetingDate.toLocaleString()}.`,
      type: "meeting",
    });

    return res.status(201).json({ meeting });
  } catch (error) {
    return next(error);
  }
};

export const respondMeetingRequest = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const { status, meetingLink, location, notes } = req.body;
    if (!["scheduled", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be 'scheduled' or 'rejected'." });
    }

    const meeting = await Meeting.findOne({ _id: req.params.meetingId, supervisorId: supervisor._id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    meeting.status = status;
    if (meetingLink) meeting.meetingLink = meetingLink.trim();
    if (location) meeting.location = location.trim();
    if (notes) meeting.notes = notes.trim();

    await meeting.save();

    const student = await Student.findById(meeting.studentId).select("userId");
    if (student) {
      await Notification.create({
        userId: student.userId,
        researchId: meeting.researchId,
        title: status === "scheduled" ? "Meeting Request Accepted" : "Meeting Request Declined",
        message:
          status === "scheduled"
            ? `Your supervisor accepted the meeting scheduled for ${meeting.meetingDate.toLocaleString()}.`
            : `Your supervisor declined the meeting request.${notes ? ` Note: ${notes}` : ""}`,
        type: "meeting",
      });
    }

    return res.json({ meeting, message: `Meeting request ${status}.` });
  } catch (error) {
    return next(error);
  }
};

export const updateMeeting = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const meeting = await Meeting.findOne({ _id: req.params.meetingId, supervisorId: supervisor._id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    const { meetingDate, meetingLink, location, notes, status } = req.body;
    if (meetingDate) meeting.meetingDate = new Date(meetingDate);
    if (meetingLink !== undefined) meeting.meetingLink = meetingLink.trim();
    if (location !== undefined) meeting.location = location.trim();
    if (notes !== undefined) meeting.notes = notes.trim();
    if (status && ["scheduled", "completed", "cancelled"].includes(status)) meeting.status = status;

    await meeting.save();
    return res.json({ meeting });
  } catch (error) {
    return next(error);
  }
};

export const listDeadlines = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const assignedResearch = await Research.find({ supervisorId: supervisor._id }).select("batchId").lean();
    const batchIds = [...new Set(assignedResearch.map(({ batchId }) => batchId?.toString()).filter(Boolean))];

    const deadlines = batchIds.length
      ? await Deadline.find({ batchId: { $in: batchIds } }).populate("batchId", "batchName academicYear").sort({ dueDate: 1 })
      : await Deadline.find().populate("batchId", "batchName academicYear").sort({ dueDate: 1 });

    return res.json({ deadlines });
  } catch (error) {
    return next(error);
  }
};

export const createDeadline = async (req, res, next) => {
  try {
    const { batchId, title, description, deadlineType, dueDate } = req.body;
    if (!batchId || !title || !dueDate || !deadlineType) {
      return res.status(400).json({ message: "batchId, title, deadlineType, and dueDate are required." });
    }

    const deadline = await Deadline.create({
      batchId,
      title: title.trim(),
      description: description?.trim() || "",
      deadlineType,
      dueDate: new Date(dueDate),
    });

    // Notify all students in this batch
    const students = await Student.find({ batchId }).select("userId");
    const notifications = students.map((s) => ({
      userId: s.userId,
      title: "New Academic Deadline Posted",
      message: `New deadline "${deadline.title}" due on ${deadline.dueDate.toLocaleDateString()}.`,
      type: "deadline",
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return res.status(201).json({ deadline, message: "Deadline created and students notified." });
  } catch (error) {
    return next(error);
  }
};

export const deleteDeadline = async (req, res, next) => {
  try {
    await Deadline.findByIdAndDelete(req.params.deadlineId);
    return res.json({ message: "Deadline deleted." });
  } catch (error) {
    return next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const supervisor = await Supervisor.findOne({ userId: req.user.id });
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const { availability } = req.body;
    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: "availability must be an array of slots." });
    }

    supervisor.availability = availability;
    await supervisor.save();

    return res.json({ supervisor, message: "Availability schedule updated." });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const supervisor = await Supervisor.findOne({ userId: req.user.id });
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const { name, phone, designation, expertise, departmentId } = req.body;

    if (name || phone) {
      const updateData = {};
      if (name && typeof name === "string") updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = String(phone).trim();
      await User.findByIdAndUpdate(req.user.id, updateData);
    }

    if (designation) supervisor.designation = designation.trim();
    if (departmentId && mongoose.isValidObjectId(departmentId)) supervisor.departmentId = departmentId;
    if (expertise) {
      supervisor.expertise = Array.isArray(expertise)
        ? expertise
        : String(expertise)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    await supervisor.save();
    const updated = await getSupervisor(req.user.id);
    return res.json({ supervisor: updated, message: "Profile updated successfully." });
  } catch (error) {
    return next(error);
  }
};

export const getProgressReports = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const projects = await Research.find({ supervisorId: supervisor._id })
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "batchId", select: "batchName" },
        ],
      })
      .sort({ progressPercentage: -1 });

    const totalProjects = projects.length;
    const avgProgress = totalProjects > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / totalProjects)
      : 0;

    const byStatus = {
      pending: projects.filter((p) => p.status === "pending").length,
      approved: projects.filter((p) => p.status === "approved").length,
      ongoing: projects.filter((p) => p.status === "ongoing").length,
      completed: projects.filter((p) => p.status === "completed").length,
      rejected: projects.filter((p) => p.status === "rejected").length,
    };

    return res.json({
      totalProjects,
      avgProgress,
      byStatus,
      projects,
    });
  } catch (error) {
    return next(error);
  }
};

export const getNotification = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
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

export const markAll = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
    return res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    return next(error);
  }
};
