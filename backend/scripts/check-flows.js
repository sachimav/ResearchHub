import "../config/env.js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../app.js";
import connectDB from "../config/db.js";
import { getJwtSecret } from "../config/env.js";
import Department from "../models/department.js";
import Batch from "../models/batch.js";
import User from "../models/user.js";

// Every write targets a new, uniquely named database. Never use the application's database.
const testDatabase = `researchhub_check_${randomUUID().replaceAll("-", "")}`;
let server;
let checks = 0;
try {
  getJwtSecret();
  await connectDB({ dbName: testDatabase, autoIndex: true, autoCreate: true });
  assert.equal(mongoose.connection.name, testDatabase);
  await Promise.all(Object.values(mongoose.models).map((Model) => Model.init()));
  const department = await Department.create({ name: "Integration Test Department" });
  const batch = await Batch.create({ batchName: "Test Batch", academicYear: "2026/2027" });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, { method = "GET", body, token, expected = 200 } = {}) => {
    const response = await fetch(`${base}${path}`, {
      method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${data.message || response.status}`);
    checks += 1;
    return data;
  };
  await call("/health");
  const options = await call("/auth/options");
  assert.equal(options.departments.length, 1);
  const supervisorBody = { name: "Test Supervisor", email: "test.supervisor@vau.ac.lk", password: "TestPassword123", confirmPassword: "TestPassword123", role: "supervisor", department: department.id, designation: "Lecturer", expertise: "Testing" };
  await call("/auth/register", { method: "POST", body: supervisorBody, expected: 403 });
  supervisorBody.invitationToken = jwt.sign({ email: supervisorBody.email }, getJwtSecret(), { audience: "researchhub-registration", expiresIn: "1h" });
  const supervisor = await call("/auth/register", { method: "POST", body: supervisorBody, expected: 201 });
  const secondSupervisorBody = { ...supervisorBody, email: "test.other@vau.ac.lk" };
  secondSupervisorBody.invitationToken = jwt.sign({ email: secondSupervisorBody.email }, getJwtSecret(), { audience: "researchhub-registration", expiresIn: "1h" });
  const otherSupervisor = await call("/auth/register", { method: "POST", body: secondSupervisorBody, expected: 201 });
  const studentBody = { name: "Test Student", email: "test.student@stu.vau.ac.lk", password: "TestPassword123", confirmPassword: "TestPassword123", role: "student", department: department.id, batch: batch.id, regNo: "TEST/001", program: "ICT" };
  const student = await call("/auth/register", { method: "POST", body: studentBody, expected: 201 });
  const otherStudent = await call("/auth/register", { method: "POST", body: { ...studentBody, email: "test.other@stu.vau.ac.lk", regNo: "TEST/002" }, expected: 201 });
  await call("/auth/register", { method: "POST", body: studentBody, expected: 409 });
  const login = await call("/auth/login", { method: "POST", body: { email: studentBody.email, password: studentBody.password, role: "student" } });
  assert.ok(login.token);
  await call("/auth/me", { token: login.token });
  await call("/supervisor/dashboard", { token: student.token, expected: 403 });
  await call("/student/me", { method: "PATCH", token: student.token, body: { phone: "" } });
  await call("/supervisor/profile", { method: "PATCH", token: supervisor.token, body: { phone: "" } });
  const proposal = await call("/student/research", { method: "POST", token: student.token, expected: 201, body: { title: "Integration Research", description: "Full workflow test", supervisorId: supervisor.supervisor._id, submit: false } });
  const projectId = proposal.research._id;
  await call(`/student/research/${projectId}`, { method: "PATCH", token: student.token, body: { submit: true } });
  await call(`/student/research/${projectId}`, { token: otherStudent.token, expected: 404 });
  await call(`/supervisor/research/${projectId}`, { token: otherSupervisor.token, expected: 404 });
  await call(`/supervisor/research/${projectId}/progress`, { method: "PATCH", token: supervisor.token, body: { status: "completed" }, expected: 409 });
  const approved = await call(`/supervisor/research/${projectId}/review`, { method: "PATCH", token: supervisor.token, body: { status: "approved", remarks: "Approved for testing" } });
  await call(`/student/research/${projectId}`, { method: "PATCH", token: student.token, body: { title: "Cannot edit approved" }, expected: 409 });
  const dashboard = await call("/supervisor/dashboard", { token: supervisor.token });
  assert.equal(dashboard.allStudents.length, 1);
  assert.equal(dashboard.stats.totalStudents, 1);
  assert.equal(dashboard.allStudents[0].userId.email, studentBody.email);
  assert.equal((await call("/supervisor/dashboard", { token: otherSupervisor.token })).allStudents.length, 0);
  await call(`/supervisor/research/${projectId}/progress`, { method: "PATCH", token: supervisor.token, body: { status: "ongoing", isPublic: true } });
  await call(`/supervisor/research/${projectId}/progress`, { method: "PATCH", token: supervisor.token, body: { progressPercentage: 100 }, expected: 409 });
  const document = await call(`/student/research/${projectId}/documents`, { method: "POST", token: student.token, expected: 201, body: { title: "Public Report", fileUrl: "https://example.com/report.pdf", documentType: "report", visibility: "public" } });
  assert.equal((await call(`/public/research/${projectId}`)).documents.length, 0);
  await call(`/supervisor/documents/${document.document._id}/review`, { method: "PATCH", token: supervisor.token, body: { status: "approved", feedback: "Internal supervisor feedback" } });
  const publicDetail = await call(`/public/research/${projectId}`);
  assert.equal(publicDetail.documents.length, 1);
  assert.equal(publicDetail.documents[0].feedback, undefined);
  assert.equal(publicDetail.documents[0].uploadedBy, undefined);
  assert.equal(publicDetail.research.studentId.regNo, undefined);
  assert.equal(publicDetail.research.studentId.userId.email, undefined);
  const listing = await call("/public/research?page=1&limit=1");
  assert.equal(listing.pagination.total, 1);
  await call("/public/research?page=-1", { expected: 400 });
  await call(`/student/research/${projectId}/documents`, { method: "POST", token: student.token, expected: 400, body: { title: "Unsafe", fileUrl: "javascript:alert(1)", documentType: "report" } });
  const date = new Date(Date.now() + 86400000).toISOString();
  await call("/student/meetings/request", { method: "POST", token: student.token, expected: 403, body: { researchId: projectId, supervisorId: otherSupervisor.supervisor._id, meetingDate: date } });
  const meeting = await call("/student/meetings/request", { method: "POST", token: student.token, expected: 201, body: { researchId: projectId, supervisorId: supervisor.supervisor._id, meetingDate: date } });
  await call(`/supervisor/meetings/${meeting.meeting._id}/respond`, { method: "PATCH", token: supervisor.token, body: { status: "scheduled", meetingLink: "https://example.com/meeting" } });
  await call(`/supervisor/meetings/${meeting.meeting._id}/respond`, { method: "PATCH", token: supervisor.token, body: { status: "scheduled" }, expected: 409 });
  const deadlineBody = { batchId: batch.id, title: "Submission", deadlineType: "report", dueDate: date };
  await call("/supervisor/deadlines", { method: "POST", token: otherSupervisor.token, expected: 403, body: deadlineBody });
  deadlineBody.deadlineType = "progress_report";
  const deadline = await call("/supervisor/deadlines", { method: "POST", token: supervisor.token, expected: 201, body: deadlineBody });
  await call(`/supervisor/deadlines/${deadline.deadline._id}`, { method: "DELETE", token: otherSupervisor.token, expected: 404 });
  assert.equal((await call("/student/deadlines", { token: student.token })).deadlines.length, 1);
  await call(`/supervisor/deadlines/${deadline.deadline._id}`, { method: "DELETE", token: supervisor.token });
  for (const milestone of approved.research.milestones) {
    await call(`/student/research/${projectId}/milestones/${milestone._id}`, { method: "PATCH", token: student.token, body: { status: "completed" } });
  }
  const finished = await call(`/student/research/${projectId}`, { token: student.token });
  assert.equal(finished.research.progressPercentage, 100);
  assert.equal(finished.research.status, "ongoing");
  await call(`/supervisor/research/${projectId}/progress`, { method: "PATCH", token: supervisor.token, body: { status: "completed" } });
  const reopened = await call(`/student/research/${projectId}/milestones/${approved.research.milestones[0]._id}`, { method: "PATCH", token: student.token, body: { status: "in_progress" } });
  assert.equal(reopened.research.status, "ongoing");
  assert.equal(reopened.research.endDate, undefined);
  for (const path of ["dashboard", "research", "deadlines", "meetings", "notifications"]) await call(`/student/${path}`, { token: student.token });
  for (const path of ["dashboard", "profile", "students", "research", "deadlines", "meetings", "notifications", "reports"]) await call(`/supervisor/${path}`, { token: supervisor.token });
  await call("/student/notifications/read-all", { method: "PATCH", token: student.token });
  await User.updateOne({ _id: student.user._id }, { $set: { isActive: false } });
  await call("/student/dashboard", { token: student.token, expected: 401 });
  await call("/auth/login", { method: "POST", body: { email: studentBody.email, password: studentBody.password }, expected: 403 });
  console.log(`PASS: ${checks} HTTP checks with real MongoDB across registration, login, role isolation, proposals, reviews, documents, meetings, deadlines, progress, dashboards and inactive accounts.`);
} catch (error) {
  console.error("Workflow check failed:", error);
  process.exitCode = 1;
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === testDatabase && /^researchhub_check_[a-f0-9]{32}$/.test(testDatabase)) {
    await mongoose.connection.dropDatabase();
    console.log("Removed the isolated test database. Application records were not changed.");
  }
  await mongoose.disconnect();
}
