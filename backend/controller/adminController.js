import mongoose from "mongoose";
import User from "../models/user.js";
import Student from "../models/Student.js";
import Supervisor from "../models/supervisor.js";
import Research from "../models/research.js";
import Document from "../models/document.js";
import Feedback from "../models/feedback.js";
import Meeting from "../models/meeting.js";
import Notification from "../models/notification.js";
import Deadline from "../models/deadline.js";
import Department from "../models/department.js";
import Batch from "../models/batch.js";
import AuditLog from "../models/auditLog.js";
import { DegreeProgram } from "../models/adminConfiguration.js";
import { activeReference } from "./adminSetupController.js";
import { audit, adminTransaction } from "../utils/adminTransaction.js";
import { boolean, date, fail, fields, id, integer, pagination, search, text } from "../utils/adminValidation.js";

const roles = ["admin", "student", "supervisor", "public"];
const statuses = ["draft", "pending", "approved", "rejected", "ongoing", "completed"];
const workloadStatuses = ["pending", "approved", "ongoing"];
const pageResult = async (Model, filter, query, populate = [], projection) => {
  const { page, limit, skip } = pagination(query);
  const [items, total] = await Promise.all([
    Model.find(filter).select(projection).populate(populate).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Model.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const dashboard = async (_req, res) => {
  const now = new Date();
  const [users, projects, unassignedProposals, overdueMilestones, overdueDeadlines, pendingDocuments, upcomingMeetings, recentActivity] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", total: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } }]),
    Research.aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }]),
    Research.countDocuments({ status: "pending", supervisorId: null }),
    Research.aggregate([{ $match: { status: { $in: ["approved", "ongoing"] } } }, { $unwind: "$milestones" }, { $match: { "milestones.status": { $ne: "completed" }, "milestones.dueDate": { $lt: now } } }, { $count: "total" }]),
    Deadline.countDocuments({ dueDate: { $lt: now } }), Document.countDocuments({ status: "pending" }),
    Meeting.countDocuments({ status: "scheduled", meetingDate: { $gte: now } }),
    AuditLog.find().sort({ createdAt: -1, _id: -1 }).limit(10).populate("actorId", "name email"),
  ]);
  res.json({ users, projects, unassignedProposals, overdueMilestones: overdueMilestones[0]?.total || 0, pastDeadlines: overdueDeadlines, pendingDocuments, upcomingMeetings, recentActivity });
};

export const listUsers = async (req, res) => {
  const filter = {};
  if (req.query.role !== undefined) {
    if (!roles.includes(req.query.role)) fail(400, "Invalid role filter.");
    filter.role = req.query.role;
  }
  if (req.query.isActive !== undefined) {
    if (!["true", "false"].includes(req.query.isActive)) fail(400, "isActive must be true or false.");
    filter.isActive = req.query.isActive === "true";
  }
  if (req.query.q !== undefined) { const q = search(req.query.q); filter.$or = [{ name: q }, { email: q }]; }
  res.json(await pageResult(User, filter, req.query, [], "-password"));
};

export const userDetails = async (req, res) => {
  const user = await User.findById(req.params.userId).select("-password");
  if (!user) fail(404, "User not found.");
  const Model = user.role === "student" ? Student : user.role === "supervisor" ? Supervisor : null;
  const profile = Model ? await Model.findOne({ userId: user._id }).populate("departmentId", "name").populate(user.role === "student" ? { path: "batchId", select: "batchName academicYear" } : []) : null;
  res.json({ user, profile });
};

export const updateUserStatus = async (req, res) => {
  fields(req.body, ["isActive", "reason"]);
  const isActive = boolean(req.body.isActive, "isActive");
  const reason = text(req.body.reason, "reason", 1000);
  if (req.params.userId.toLowerCase() === String(req.user.id).toLowerCase() && !isActive) fail(409, "You cannot deactivate your own account.");
  const user = await adminTransaction(async (session) => {
    const record = await User.findById(req.params.userId).select("-password").session(session);
    if (!record) fail(404, "User not found.");
    if (record.role === "admin" && !isActive && await User.countDocuments({ role: "admin", isActive: true }).session(session) <= 1) fail(409, "The last active admin cannot be deactivated.");
    // A role-profile must exist before an incomplete registration can be activated.
    if (isActive && record.role === "student" && !await Student.exists({ userId: record._id }).session(session)) fail(409, "Student profile is missing.");
    if (isActive && record.role === "supervisor" && !await Supervisor.exists({ userId: record._id }).session(session)) fail(409, "Supervisor profile is missing.");
    const previous = record.isActive;
    record.isActive = isActive;
    await record.save({ session });
    await audit(req, session, "set-active", "users", record._id, { before: previous, after: isActive }, reason);
    return record;
  });
  res.json({ user });
};

export const updateStudentAcademic = async (req, res) => {
  fields(req.body, ["departmentId", "batchId", "programId", "reason"]);
  const reason = text(req.body.reason, "reason", 1000);
  if (!["departmentId", "batchId", "programId"].some((key) => req.body[key] !== undefined)) fail(400, "Provide an academic field to update.");
  const student = await adminTransaction(async (session) => {
    const record = await Student.findById(req.params.studentId).session(session);
    if (!record) fail(404, "Student not found.");
    const before = record.toObject();
    if (req.body.departmentId !== undefined) {
      await activeReference(Department, req.body.departmentId, "departmentId", session);
      if (String(record.departmentId) !== req.body.departmentId && !req.body.programId) fail(400, "Select a program when changing departments.");
      record.departmentId = req.body.departmentId;
    }
    if (req.body.batchId !== undefined) { await activeReference(Batch, req.body.batchId, "batchId", session); record.batchId = req.body.batchId; }
    if (req.body.programId !== undefined) {
      const program = await activeReference(DegreeProgram, req.body.programId, "programId", session);
      if (String(program.departmentId) !== String(record.departmentId)) fail(400, "Program must belong to the student's department.");
      record.program = program.name;
      record.programId = program._id;
    }
    await record.save({ session });
    await audit(req, session, "update-academic-profile", "students", record._id, { before, after: record.toObject() }, reason);
    return record;
  });
  res.json({ student, message: "Student academic profile updated. Existing projects retain their original batch and academic year." });
};

export const listSupervisors = async (req, res) => {
  const filter = {};
  if (req.query.departmentId !== undefined) filter.departmentId = id(req.query.departmentId, "departmentId");
  const result = await pageResult(Supervisor, filter, req.query, [{ path: "userId", select: "name email isActive" }, { path: "departmentId", select: "name" }]);
  const counts = await Research.aggregate([{ $match: { supervisorId: { $in: result.items.map((s) => s._id) }, status: { $in: workloadStatuses } } }, { $group: { _id: "$supervisorId", count: { $sum: 1 } } }]);
  const workloads = new Map(counts.map((item) => [String(item._id), item.count]));
  result.items = result.items.map((item) => ({ ...item.toObject(), activeProjects: workloads.get(String(item._id)) || 0 }));
  res.json(result);
};

export const updateSupervisorCapacity = async (req, res) => {
  fields(req.body, ["maxActiveProjects", "reason"]);
  const maximum = integer(req.body.maxActiveProjects, "maxActiveProjects", 1, 1000);
  const reason = text(req.body.reason, "reason", 1000);
  const supervisor = await adminTransaction(async (session) => {
    const record = await Supervisor.findById(req.params.supervisorId).session(session);
    if (!record) fail(404, "Supervisor not found.");
    const current = await Research.countDocuments({ supervisorId: record._id, status: { $in: workloadStatuses } }).session(session);
    if (maximum < current) fail(409, "Capacity cannot be lower than the current workload.");
    const previous = record.maxActiveProjects;
    record.maxActiveProjects = maximum;
    await record.save({ session });
    await audit(req, session, "set-capacity", "supervisors", record._id, { before: previous, after: maximum }, reason);
    return record;
  });
  res.json({ supervisor });
};

const researchFilter = async (query) => {
  const filter = {};
  if (query.status !== undefined) { if (!statuses.includes(query.status)) fail(400, "Invalid research status."); filter.status = query.status; }
  for (const field of ["batchId", "supervisorId", "studentId"]) if (query[field] !== undefined) filter[field] = id(query[field], field);
  if (query.departmentId !== undefined) {
    const students = await Student.find({ departmentId: id(query.departmentId, "departmentId") }).select("_id");
    filter.studentId = { $in: students.map((item) => item._id).filter((value) => !query.studentId || String(value) === query.studentId) };
  }
  if (query.academicYear !== undefined) filter.academicYear = text(query.academicYear, "academicYear");
  if (query.unassigned !== undefined) {
    if (!["true", "false"].includes(query.unassigned)) fail(400, "unassigned must be true or false.");
    if (query.supervisorId !== undefined) fail(400, "Use either unassigned or supervisorId.");
    filter.supervisorId = query.unassigned === "true" ? null : { $ne: null };
  }
  if (query.q !== undefined) { const q = search(query.q); filter.$or = [{ title: q }, { topic: q }]; }
  return filter;
};
const researchPopulation = [
  { path: "studentId", populate: [{ path: "userId", select: "name email" }, { path: "departmentId", select: "name" }] },
  { path: "supervisorId", populate: { path: "userId", select: "name email" } }, { path: "batchId", select: "batchName academicYear" },
];
export const listResearch = async (req, res) => res.json(await pageResult(Research, await researchFilter(req.query), req.query, researchPopulation));

export const researchDetails = async (req, res) => {
  const research = await Research.findById(req.params.researchId).populate(researchPopulation);
  if (!research) fail(404, "Research project not found.");
  // Documents and feedback are paginated to avoid unbounded administrative responses.
  res.json({ research, documents: await pageResult(Document, { researchId: research._id }, req.query), feedback: await pageResult(Feedback, { researchId: research._id }, req.query, [{ path: "userId", select: "name role" }]) });
};

export const assignSupervisor = async (req, res) => {
  fields(req.body, ["supervisorId", "reason"]);
  const supervisorId = id(req.body.supervisorId, "supervisorId");
  const reason = text(req.body.reason, "reason", 1000);
  const research = await adminTransaction(async (session) => {
    const project = await Research.findById(req.params.researchId).session(session);
    if (!project) fail(404, "Research project not found.");
    if (["draft", "completed"].includes(project.status)) fail(409, "Only submitted, unfinished projects can be allocated.");
    const supervisor = await Supervisor.findById(supervisorId).session(session);
    if (!supervisor || !await User.exists({ _id: supervisor.userId, isActive: true, role: "supervisor" }).session(session)) fail(400, "Select an active supervisor.");
    const student = await Student.findById(project.studentId).session(session);
    if (!student) fail(409, "Student profile is missing.");
    if (String(student.departmentId) !== String(supervisor.departmentId)) fail(409, "Supervisor and student must belong to the same department.");
    await activeReference(Department, String(supervisor.departmentId), "departmentId", session);
    const oldSupervisorId = project.supervisorId;
    if (String(oldSupervisorId) === supervisorId) fail(409, "This supervisor is already assigned.");
    const count = await Research.countDocuments({ supervisorId, status: { $in: workloadStatuses } }).session(session);
    if (workloadStatuses.includes(project.status) && count >= supervisor.maxActiveProjects) fail(409, "Supervisor has reached their project capacity.");
    project.supervisorId = supervisorId;
    await project.save({ session });
    // A reassignment invalidates future meetings with the previous supervisor.
    await Meeting.updateMany({ researchId: project._id, status: { $in: ["requested", "scheduled"] }, meetingDate: { $gte: new Date() } }, { $set: { status: "cancelled" } }, { session });
    const recipients = [student.userId, supervisor.userId];
    if (oldSupervisorId) { const old = await Supervisor.findById(oldSupervisorId).session(session); if (old) recipients.push(old.userId); }
    await Notification.insertMany([...new Set(recipients.map(String))].map((userId) => ({ userId, researchId: project._id, title: "Supervisor Assignment Updated", message: `The administrator updated the supervisor for "${project.title}". Future meetings with the previous supervisor were cancelled.`, type: "general" })), { session });
    await audit(req, session, "assign-supervisor", "research", project._id, { before: oldSupervisorId, after: supervisorId }, reason);
    return project;
  });
  res.json({ research });
};

export const updatePublication = async (req, res) => {
  fields(req.body, ["isPublic", "reason"]);
  const isPublic = boolean(req.body.isPublic, "isPublic");
  const reason = text(req.body.reason, "reason", 1000);
  const research = await adminTransaction(async (session) => {
    const project = await Research.findById(req.params.researchId).session(session);
    if (!project) fail(404, "Research project not found.");
    if (isPublic && !["approved", "ongoing", "completed"].includes(project.status)) fail(409, "Only approved research can be published.");
    const before = project.isPublic;
    project.isPublic = isPublic;
    await project.save({ session });
    const student = await Student.findById(project.studentId).session(session);
    if (student) await Notification.create([{ userId: student.userId, researchId: project._id, title: "Research Publication Updated", message: `The administrator ${isPublic ? "published" : "unpublished"} "${project.title}".`, type: "general" }], { session });
    await audit(req, session, "set-publication", "research", project._id, { before, after: isPublic }, reason);
    return project;
  });
  res.json({ research });
};

export const listDeadlines = async (req, res) => {
  const filter = {};
  if (req.query.batchId !== undefined) filter.batchId = id(req.query.batchId, "batchId");
  res.json(await pageResult(Deadline, filter, req.query, [{ path: "batchId", select: "batchName academicYear" }]));
};
export const saveDeadline = async (req, res) => {
  fields(req.body, ["batchId", "title", "description", "deadlineType", "dueDate", "reason"]);
  const reason = text(req.body.reason, "reason", 1000);
  const deadline = await adminTransaction(async (session) => {
    let record = req.params.deadlineId ? await Deadline.findById(req.params.deadlineId).session(session) : null;
    if (req.params.deadlineId && !record) fail(404, "Deadline not found.");
    const before = record?.toObject();
    const data = {};
    if (req.body.title !== undefined) data.title = text(req.body.title, "title");
    if (req.body.description !== undefined) data.description = text(req.body.description, "description", 2000, true);
    if (req.body.batchId !== undefined) { await activeReference(Batch, req.body.batchId, "batchId", session); data.batchId = req.body.batchId; }
    if (req.body.deadlineType !== undefined) {
      if (!["proposal", "progress_report", "final_report", "presentation", "other"].includes(req.body.deadlineType)) fail(400, "Invalid deadline type.");
      data.deadlineType = req.body.deadlineType;
    }
    if (req.body.dueDate !== undefined) { data.dueDate = date(req.body.dueDate, "dueDate"); if (data.dueDate <= new Date()) fail(400, "Choose a future deadline."); }
    if (!Object.keys(data).length) fail(400, "Provide deadline fields to update.");
    if (record && data.batchId && String(record.batchId) !== data.batchId) fail(409, "A deadline's batch cannot be changed. Create a separate deadline.");
    if (record) { record.set(data); await record.save({ session }); }
    else [record] = await Deadline.create([{ ...data, createdBy: req.user.id }], { session });
    const students = await Student.find({ batchId: record.batchId }).select("userId").session(session);
    if (students.length) await Notification.insertMany(students.map((s) => ({ userId: s.userId, title: before ? "Academic Deadline Updated" : "New Academic Deadline", message: `"${record.title}" is due ${record.dueDate.toISOString()}.`, type: "deadline" })), { session });
    await audit(req, session, before ? "update" : "create", "deadlines", record._id, { before, after: record.toObject() }, reason);
    return record;
  });
  res.status(req.params.deadlineId ? 200 : 201).json({ deadline });
};
export const deleteDeadline = async (req, res) => {
  fields(req.body, ["reason"]);
  const reason = text(req.body.reason, "reason", 1000);
  await adminTransaction(async (session) => {
    const record = await Deadline.findByIdAndDelete(req.params.deadlineId, { session });
    if (!record) fail(404, "Deadline not found.");
    const students = await Student.find({ batchId: record.batchId }).select("userId").session(session);
    if (students.length) await Notification.insertMany(students.map((s) => ({ userId: s.userId, title: "Academic Deadline Removed", message: `The deadline "${record.title}" was removed by the administrator.`, type: "deadline" })), { session });
    await audit(req, session, "delete", "deadlines", record._id, { before: record.toObject() }, reason);
  });
  res.json({ message: "Deadline deleted and students notified." });
};

const csvCell = (value) => {
  let content = String(value ?? "");
  if (/^[\s]*[=+@\-\t\r\n]/.test(content)) content = `'${content}`;
  return `"${content.replaceAll('"', '""')}"`;
};
export const reports = async (req, res) => {
  const filter = await researchFilter(req.query);
  if (req.query.format !== undefined && !["json", "csv"].includes(req.query.format)) fail(400, "format must be json or csv.");
  if (req.query.format === "csv") {
    const records = await Research.find(filter).populate(researchPopulation).sort({ createdAt: -1, _id: -1 }).limit(10001);
    if (records.length > 10000) fail(400, "Export is limited to 10,000 projects. Narrow the filters.");
    const rows = [["Title", "Status", "Progress", "Academic year", "Batch", "Student", "Supervisor"]];
    for (const r of records) rows.push([r.title, r.status, r.progressPercentage, r.academicYear, r.batchId?.batchName, r.studentId?.userId?.name, r.supervisorId?.userId?.name]);
    res.set("Content-Type", "text/csv; charset=utf-8").set("Content-Disposition", 'attachment; filename="research-report.csv"');
    return res.send(rows.map((row) => row.map(csvCell).join(",")).join("\r\n"));
  }
  // Aggregation does not apply Mongoose's query casting.
  const aggregateFilter = { ...filter };
  for (const key of ["batchId", "supervisorId", "studentId"]) if (typeof aggregateFilter[key] === "string") aggregateFilter[key] = new mongoose.Types.ObjectId(aggregateFilter[key]);
  const [summary, records] = await Promise.all([
    Research.aggregate([{ $match: aggregateFilter }, { $group: { _id: "$status", count: { $sum: 1 }, averageProgress: { $avg: "$progressPercentage" } } }]),
    pageResult(Research, filter, req.query, researchPopulation),
  ]);
  res.json({ summary, ...records });
};

export const listAudit = async (req, res) => {
  const filter = {};
  if (req.query.actorId !== undefined) filter.actorId = id(req.query.actorId, "actorId");
  for (const key of ["resource", "action"]) if (req.query[key] !== undefined) filter[key] = text(req.query[key], key, 100);
  if (req.query.from !== undefined || req.query.to !== undefined) {
    filter.createdAt = {};
    if (req.query.from !== undefined) filter.createdAt.$gte = date(req.query.from, "from");
    if (req.query.to !== undefined) filter.createdAt.$lte = date(req.query.to, "to");
    if (filter.createdAt.$gte > filter.createdAt.$lte) fail(400, "from must be before to.");
  }
  res.json(await pageResult(AuditLog, filter, req.query, [{ path: "actorId", select: "name email" }]));
};
