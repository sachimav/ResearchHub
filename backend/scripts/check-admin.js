import "../config/env.js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import app from "../app.js";
import connectDB from "../config/db.js";
import User from "../models/user.js";
import Student from "../models/Student.js";
import Supervisor from "../models/supervisor.js";
import Research from "../models/research.js";
import Meeting from "../models/meeting.js";
import Notification from "../models/notification.js";
import AuditLog from "../models/auditLog.js";
import AdminInvitation from "../models/adminInvitation.js";
import { adminTransaction, audit } from "../utils/adminTransaction.js";
import { fileURLToPath } from "node:url";

const testDatabase = `researchhub_admin_check_${randomUUID().replaceAll("-", "")}`;
let server;
let checks = 0;
try {
  process.env.MONGO_URL = process.env.ADMIN_TEST_MONGO_URL || process.env.MONGO_URL;
  await connectDB({ dbName: testDatabase, autoIndex: true, autoCreate: true });
  assert.equal(mongoose.connection.name, testDatabase);
  const topology = await mongoose.connection.db.admin().command({ hello: 1 });
  assert.ok(topology.setName || topology.msg === "isdbgrid", "Admin integration checks require a replica set. Set ADMIN_TEST_MONGO_URL to a test replica set URI.");
  await Promise.all(Object.values(mongoose.models).map((Model) => Model.init()));

  // Test the actual first-admin command only against our unique temporary database.
  const bootstrapUri = new URL(process.env.MONGO_URL);
  bootstrapUri.pathname = `/${testDatabase}`;
  const bootstrapEnvironment = { ...process.env, MONGO_URL: bootstrapUri.toString(), ADMIN_NAME: "First Admin", ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD: "TestAdminPassword123!" };
  const bootstrapPath = fileURLToPath(new URL("./bootstrap-admin.js", import.meta.url));
  execFileSync(process.execPath, [bootstrapPath], { env: bootstrapEnvironment, windowsHide: true, stdio: "pipe" });
  assert.equal(await User.countDocuments({ role: "admin" }), 1);
  assert.throws(() => execFileSync(process.execPath, [bootstrapPath], { env: bootstrapEnvironment, windowsHide: true, stdio: "pipe" }));
  checks += 2;
  delete bootstrapEnvironment.ADMIN_PASSWORD;

  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, { method = "GET", body, token, expected = 200 } = {}) => {
    const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = response.headers.get("content-type")?.includes("text/csv") ? await response.text() : await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${typeof data === "string" ? data : data.message || response.status}`);
    checks++;
    return data;
  };
  const login = await call("/auth/login", { method: "POST", body: { email: "admin@example.com", password: "TestAdminPassword123!" } });
  assert.equal(login.user.role, "admin");
  const token = login.token;
  const write = (path, body, expected = 201, method = "POST") => call(`/admin/${path}`, { method, body, token, expected });
  const department = (await write("departments", { name: "Computing" })).item;
  await write("departments", { name: "computing" }, 409);
  const otherDepartment = (await write("departments", { name: "Science" })).item;
  const batch = (await write("batches", { batchName: "2026 Intake", academicYear: "2026/2027" })).item;
  const program = (await write("programs", { name: "BSc Computing", departmentId: department._id })).item;
  const year = (await write("academic-years", { name: "2026/2027", startDate: "2026-01-01", endDate: "2027-12-31" })).item;
  await write("academic-years", { name: "Invalid year", startDate: "2028-01-01", endDate: "2027-01-01" }, 400);
  const template = (await write("milestone-templates", { name: "Standard research", milestones: [{ title: "Proposal", offsetDays: 7 }, { title: "Thesis", offsetDays: 30 }], requiredDocuments: [{ documentType: "proposal", stage: "proposal" }, { documentType: "final_report", stage: "completion" }] })).item;
  await write("settings", { universityName: "Test University", currentAcademicYearId: year._id, defaultMilestoneTemplateId: template._id }, 200, "PATCH");
  await write(`academic-years/${year._id}`, { isActive: false }, 409, "PATCH");
  await write(`milestone-templates/${template._id}`, { isActive: false }, 409, "PATCH");
  await write("settings", { logoUrl: "javascript:alert(1)" }, 400, "PATCH");
  const archived = (await write("departments", { name: "Archived" })).item;
  await write(`departments/${archived._id}`, { isActive: false }, 200, "PATCH");
  assert.ok(!(await call("/auth/options")).departments.some((d) => d._id === archived._id));

  const studentBody = { name: "Student", email: "student@stu.vau.ac.lk", password: "StudentPassword123!", confirmPassword: "StudentPassword123!", role: "student", regNo: "ADMIN/TEST/001", department: department._id, batch: batch._id, programId: program._id };
  const student = await call("/auth/register", { method: "POST", body: studentBody, expected: 201 });
  assert.equal(student.student.program, program.name);
  await call("/admin/dashboard", { token: student.token, expected: 403 });
  const supervisorPassword = await bcrypt.hash("SupervisorPassword123!", 4);
  const supUser = await User.create({ name: "Supervisor", email: "supervisor@vau.ac.lk", role: "supervisor", password: supervisorPassword });
  const supervisor = await Supervisor.create({ userId: supUser._id, departmentId: department._id, maxActiveProjects: 1 });
  const supUser2 = await User.create({ name: "Second supervisor", email: "second@vau.ac.lk", role: "supervisor", password: supervisorPassword });
  const supervisor2 = await Supervisor.create({ userId: supUser2._id, departmentId: department._id });
  const supUser3 = await User.create({ name: "Other department supervisor", email: "science@vau.ac.lk", role: "supervisor", password: supervisorPassword });
  const supervisor3 = await Supervisor.create({ userId: supUser3._id, departmentId: otherDepartment._id });
  const supervisorLogin = await call("/auth/login", { method: "POST", body: { email: supUser.email, password: "SupervisorPassword123!" } });

  await call("/student/research", { method: "POST", token: student.token, expected: 400, body: { title: "Invalid template", description: "Cannot bypass default requirements", templateId: "" } });

  const draft = await call("/student/research", { method: "POST", token: student.token, expected: 201, body: { title: "=unsafe CSV title", description: "Template snapshot", supervisorId: String(supervisor2._id) } });
  assert.equal(draft.research.milestones.length, 2);
  assert.equal(draft.research.requiredDocuments.length, 2);
  await write(`research/${draft.research._id}/supervisor`, { supervisorId: String(supervisor._id), reason: "Draft" }, 409, "PATCH");
  await call(`/student/research/${draft.research._id}`, { method: "PATCH", token: student.token, body: { submit: true }, expected: 409 });
  await call(`/student/research/${draft.research._id}/documents`, { method: "POST", token: student.token, expected: 201, body: { title: "Proposal", documentType: "proposal", fileUrl: "https://example.com/proposal" } });
  await call(`/student/research/${draft.research._id}`, { method: "PATCH", token: student.token, body: { submit: true } });
  await write(`milestone-templates/${template._id}`, { milestones: [{ title: "New default", offsetDays: 3 }] }, 200, "PATCH");
  assert.equal((await Research.findById(draft.research._id)).milestones.length, 2);
  await write(`research/${draft.research._id}/supervisor`, { supervisorId: String(supervisor3._id), reason: "Wrong department" }, 409, "PATCH");
  const meeting = await Meeting.create({ researchId: draft.research._id, studentId: student.student._id, supervisorId: supervisor2._id, meetingDate: new Date(Date.now() + 86400000), status: "scheduled" });
  await write(`research/${draft.research._id}/supervisor`, { supervisorId: String(supervisor._id), reason: "Balance workload" }, 200, "PATCH");
  assert.equal((await Meeting.findById(meeting._id)).status, "cancelled");
  const project2 = await Research.create({ studentId: student.student._id, batchId: batch._id, title: "Another", description: "Capacity test", academicYear: "2026/2027", status: "pending" });
  await write(`research/${project2._id}/supervisor`, { supervisorId: String(supervisor._id), reason: "Over capacity" }, 409, "PATCH");
  await write(`supervisors/${supervisor._id}/capacity`, { maxActiveProjects: 2, reason: "Increase capacity" }, 200, "PATCH");
  await write(`research/${project2._id}/supervisor`, { supervisorId: String(supervisor._id), reason: "Available capacity" }, 200, "PATCH");
  await write(`supervisors/${supervisor._id}/capacity`, { maxActiveProjects: 1, reason: "Too low" }, 409, "PATCH");
  await write(`research/${project2._id}/publication`, { isPublic: true, reason: "Not approved" }, 409, "PATCH");
  await call(`/supervisor/research/${draft.research._id}/review`, { method: "PATCH", token: supervisorLogin.token, body: { status: "approved" } });
  for (const milestone of draft.research.milestones) await call(`/student/research/${draft.research._id}/milestones/${milestone._id}`, { method: "PATCH", token: student.token, body: { status: "completed" } });
  await call(`/supervisor/research/${draft.research._id}/progress`, { method: "PATCH", token: supervisorLogin.token, body: { status: "completed" }, expected: 409 });
  await write(`research/${draft.research._id}/publication`, { isPublic: true, reason: "Approved for showcase" }, 200, "PATCH");

  const dueDate = new Date(Date.now() + 86400000).toISOString();
  const deadline = (await write("deadlines", { batchId: batch._id, title: "Submission", deadlineType: "proposal", dueDate, reason: "Academic calendar" })).deadline;
  await write(`deadlines/${deadline._id}`, { title: "Updated submission", reason: "Correction" }, 200, "PATCH");
  await write(`deadlines/${deadline._id}`, undefined, 400, "DELETE");
  await write(`deadlines/${deadline._id}`, { reason: "Cancelled" }, 200, "DELETE");
  assert.ok(await Notification.exists({ userId: student.user._id, title: "Academic Deadline Removed" }));
  const users = await call("/admin/users?limit=1", { token });
  assert.equal(users.items.length, 1);
  assert.equal(users.items[0].password, undefined);
  await call(`/admin/users/${student.user._id}`, { token });
  await write(`students/${student.student._id}/academic-profile`, { programId: program._id, reason: "Confirm program" }, 200, "PATCH");
  await write(`users/${student.user._id}/status`, { isActive: false, reason: "Suspended" }, 200, "PATCH");
  await call("/student/dashboard", { token: student.token, expected: 401 });
  await write(`users/${student.user._id}/status`, { isActive: true, reason: "Restored" }, 200, "PATCH");
  await write(`users/${login.user._id}/status`, { isActive: false, reason: "Self" }, 409, "PATCH");

  const invitation = await write("invitations/admin", { email: "second.admin@example.com" });
  const accept = { name: "Second Admin", email: "second.admin@example.com", password: "SecondAdminPassword123!", confirmPassword: "SecondAdminPassword123!", invitationToken: invitation.invitationToken };
  await call("/auth/admin/accept-invitation", { method: "POST", body: { ...accept, email: "wrong@example.com" }, expected: 403 });
  await call("/auth/admin/accept-invitation", { method: "POST", body: accept, expected: 201 });
  await call("/auth/admin/accept-invitation", { method: "POST", body: accept, expected: 403 });
  const revoked = await write("invitations/admin", { email: "revoked@example.com" });
  await write(`invitations/admin/${revoked.invitation._id}`, undefined, 200, "DELETE");
  await call("/auth/admin/accept-invitation", { method: "POST", body: { ...accept, email: "revoked@example.com", invitationToken: revoked.invitationToken }, expected: 403 });
  const expired = await write("invitations/admin", { email: "expired@example.com" });
  await AdminInvitation.updateOne({ _id: expired.invitation._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  await call("/auth/admin/accept-invitation", { method: "POST", body: { ...accept, email: "expired@example.com", invitationToken: expired.invitationToken }, expected: 403 });
  const invitation2 = await write("invitations/admin", { email: "parallel@example.com" });
  const parallelAccept = { ...accept, email: "parallel@example.com", invitationToken: invitation2.invitationToken };
  const acceptStatuses = await Promise.all([1, 2].map(async () => (await fetch(`${base}/auth/admin/accept-invitation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parallelAccept) })).status));
  assert.deepEqual(acceptStatuses.sort(), [201, 403]);
  checks++;
  await write("invitations/supervisor", { email: "new.supervisor@vau.ac.lk" });

  const csv = await call("/admin/reports?format=csv", { token });
  assert.ok(csv.includes("'=unsafe CSV title"));
  const report = await call(`/admin/reports?departmentId=${department._id}&batchId=${batch._id}`, { token });
  assert.equal(report.pagination.total, 2);
  for (const path of ["dashboard", "supervisors", "research", `research/${draft.research._id}`, "deadlines", "reports", "audit-logs", "settings", "departments", "batches", "programs", "academic-years", "milestone-templates"]) await call(`/admin/${path}`, { token });
  const auditText = JSON.stringify((await call("/admin/audit-logs?limit=100", { token })).items);
  assert.ok(!auditText.includes(invitation.invitationToken));
  assert.ok(!auditText.includes("$2b$"));

  // Deliberately fail the audit after a domain write: neither write may commit.
  const before = await Research.findById(project2._id);
  const auditCount = await AuditLog.countDocuments();
  await assert.rejects(adminTransaction(async (session) => {
    await Research.updateOne({ _id: before._id }, { $set: { title: "Must roll back" } }, { session });
    await audit({ user: { id: "invalid" } }, session, "test", "research", before._id);
  }));
  assert.equal((await Research.findById(project2._id)).title, before.title);
  assert.equal(await AuditLog.countDocuments(), auditCount);
  checks++;
  console.log(`PASS: ${checks} admin workflow checks, including bootstrap, access control, configuration, invitations, allocation, templates, reports, notifications and transaction rollback.`);
} catch (error) {
  console.error("Admin workflow check failed:", error);
  process.exitCode = 1;
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === testDatabase && /^researchhub_admin_check_[a-f0-9]{32}$/.test(testDatabase)) {
    await mongoose.connection.dropDatabase();
    console.log("Removed the isolated admin test database. Application records were not changed.");
  }
  await mongoose.disconnect();
}
