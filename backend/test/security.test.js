import { after, afterEach, before, mock, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import app from "../app.js";
import User from "../models/user.js";
import Student from "../models/Student.js";
import Supervisor from "../models/supervisor.js";
import Research from "../models/research.js";
import Document from "../models/document.js";
import Deadline from "../models/deadline.js";
import Department from "../models/department.js";
import Batch from "../models/batch.js";
import { getJwtSecret } from "../config/env.js";
import { recalculateProgress, isWebUrl } from "../utils/researchPolicy.js";
import { registerUser, loginUser } from "../controller/authController.js";
import { getProgress, deleteDeadline, createDeadline, manageMilestones } from "../controller/supervisorController.js";
import { createResearch, requestMeeting, updateMilestone } from "../controller/studentController.js";
import { getResearchDetails } from "../controller/publicController.js";

const ids = { user: "507f1f77bcf86cd799439011", student: "507f1f77bcf86cd799439012", supervisor: "507f1f77bcf86cd799439013", research: "507f1f77bcf86cd799439014", batch: "507f1f77bcf86cd799439015" };
const response = () => ({ code: 200, data: null, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } });
const chain = (value) => ({ populate() { return this; }, select() { return this; }, sort() { return this; }, lean() { return this; }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
const supervisorProfile = () => mock.method(Supervisor, "findOne", () => chain({ _id: ids.supervisor }));
const request = (body = {}) => ({ user: { id: ids.user }, body, params: { researchId: ids.research, deadlineId: ids.research } });
const next = (error) => { throw error; };
let server;
let base;
before(async () => {
  process.env.JWT_SECRET = "test-only-secret-with-more-than-thirty-two-characters";
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterEach(() => mock.restoreAll());
after(() => new Promise((resolve) => server.close(resolve)));

test("HTTP rejects missing tokens, invalid bodies and malformed identifiers", async () => {
  assert.equal((await fetch(`${base}/api/student/dashboard`)).status, 401);
  assert.equal((await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "[]" })).status, 400);
  assert.equal((await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"email":' })).status, 400);
  assert.equal((await fetch(`${base}/api/public/research/not-an-id`)).status, 400);
  assert.equal((await fetch(`${base}/api/unknown`)).status, 404);
});

test("access tokens use the current configured secret and correct audience", async () => {
  const password = await bcrypt.hash("Password123", 4);
  mock.method(User, "findOne", async () => ({ _id: ids.user, email: "test@example.com", role: "public", password, isActive: true }));
  const res = response();
  await loginUser({ body: { email: "test@example.com", password: "Password123" } }, res, next);
  assert.equal(res.code, 200);
  assert.equal(jwt.verify(res.data.token, getJwtSecret(), { audience: "researchhub-api" }).id, ids.user);
});

test("inactive users cannot log in or use an existing access token", async () => {
  const password = await bcrypt.hash("Password123", 4);
  mock.method(User, "findOne", async () => ({ password, isActive: false }));
  const res = response();
  await loginUser({ body: { email: "test@example.com", password: "Password123" } }, res, next);
  assert.equal(res.code, 403);
  mock.method(User, "findById", () => chain({ _id: ids.user, role: "student", isActive: false }));
  const token = jwt.sign({ id: ids.user }, getJwtSecret(), { audience: "researchhub-api" });
  assert.equal((await fetch(`${base}/api/student/dashboard`, { headers: { Authorization: `Bearer ${token}` } })).status, 401);
});

test("middleware uses current database role and rejects invitation tokens as access tokens", async () => {
  mock.method(User, "findById", () => chain({ _id: ids.user, role: "public", isActive: true }));
  const token = jwt.sign({ id: ids.user, role: "supervisor" }, getJwtSecret(), { audience: "researchhub-api" });
  assert.equal((await fetch(`${base}/api/supervisor/dashboard`, { headers: { Authorization: `Bearer ${token}` } })).status, 403);
  const invitation = jwt.sign({ email: "lecturer@vau.ac.lk" }, getJwtSecret(), { audience: "researchhub-registration" });
  assert.equal((await fetch(`${base}/api/supervisor/dashboard`, { headers: { Authorization: `Bearer ${invitation}` } })).status, 401);
});

test("notification read actions accept the frontend's empty PATCH body", async () => {
  mock.method(User, "findById", () => chain({ _id: ids.user, role: "student", isActive: true }));
  const { default: Notification } = await import("../models/notification.js");
  mock.method(Notification, "updateMany", async () => ({ modifiedCount: 1 }));
  const token = jwt.sign({ id: ids.user }, getJwtSecret(), { audience: "researchhub-api" });
  const result = await fetch(`${base}/api/student/notifications/read-all`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
  assert.equal(result.status, 200);
});

test("supervisor signup rejects missing, wrong-email and expired invitations", async () => {
  for (const invitationToken of [undefined,
    jwt.sign({ email: "other@vau.ac.lk" }, getJwtSecret(), { audience: "researchhub-registration" }),
    jwt.sign({ email: "lecturer@vau.ac.lk" }, getJwtSecret(), { audience: "researchhub-registration", expiresIn: -1 }),
  ]) {
    const res = response();
    await registerUser({ body: { name: "Lecturer", email: "lecturer@vau.ac.lk", role: "supervisor", invitationToken } }, res, next);
    assert.equal(res.code, 403);
  }
});

test("failed profile creation removes the pending account", async () => {
  mock.method(User, "findOne", async () => null);
  mock.method(Student, "findOne", async () => null);
  mock.method(Department, "findById", async () => ({ _id: ids.batch }));
  mock.method(Batch, "findById", async () => ({ _id: ids.batch }));
  mock.method(User, "create", async (data) => { assert.equal(data.isActive, false); return { _id: ids.user }; });
  mock.method(Student, "create", async () => { throw new Error("Profile write failed"); });
  const cleanup = mock.method(User, "deleteOne", async () => ({}));
  mock.method(Student, "deleteOne", async () => ({}));
  mock.method(Supervisor, "deleteOne", async () => ({}));
  let caught;
  await registerUser({ body: { name: "Student", email: "student@stu.vau.ac.lk", password: "Password123", confirmPassword: "Password123", regNo: "REG1", department: ids.batch, batch: ids.batch, program: "ICT", role: "student" } }, response(), (error) => { caught = error; });
  assert.equal(caught.message, "Profile write failed");
  assert.deepEqual(cleanup.mock.calls[0].arguments[0], { _id: ids.user });
});

test("deadline deletion requires both ownership and an assigned batch", async () => {
  supervisorProfile();
  mock.method(Research, "distinct", async () => [ids.batch]);
  const remove = mock.method(Deadline, "findOneAndDelete", async () => null);
  const res = response();
  await deleteDeadline(request(), res, next);
  assert.equal(res.code, 404);
  assert.deepEqual(remove.mock.calls[0].arguments[0], { _id: ids.research, batchId: { $in: [ids.batch] }, createdBy: ids.user });
});

test("deadline creation rejects an unrelated batch", async () => {
  supervisorProfile();
  mock.method(Research, "exists", async () => null);
  const res = response();
  await createDeadline(request({ batchId: ids.batch, title: "Deadline", deadlineType: "proposal", dueDate: "2099-01-01" }), res, next);
  assert.equal(res.code, 403);
});

test("proposals reject nonexistent supervisors", async () => {
  mock.method(Student, "findOne", () => chain({ _id: ids.student, batchId: { _id: ids.batch, academicYear: "2026" } }));
  mock.method(Supervisor, "exists", async () => null);
  const res = response();
  await createResearch(request({ title: "Research", description: "Description", supervisorId: ids.supervisor }), res, next);
  assert.equal(res.code, 400);
});

test("meeting requests cannot target another project's supervisor", async () => {
  mock.method(Student, "findOne", async () => ({ _id: ids.student }));
  mock.method(Research, "findOne", async () => ({ supervisorId: ids.student }));
  mock.method(Supervisor, "findById", () => chain({ _id: ids.supervisor }));
  const res = response();
  await requestMeeting(request({ researchId: ids.research, supervisorId: ids.supervisor, meetingDate: "2099-01-01" }), res, next);
  assert.equal(res.code, 403);
});

test("public documents require approval and omit internal feedback", async () => {
  mock.method(Research, "findOne", () => chain({ _id: ids.research }));
  let projection;
  const query = chain([]);
  query.select = (value) => { projection = value; return query; };
  const find = mock.method(Document, "find", () => query);
  const res = response();
  await getResearchDetails({ params: { researchId: ids.research } }, res, next);
  assert.equal(res.code, 200);
  assert.deepEqual(find.mock.calls[0].arguments[0], { researchId: ids.research, visibility: "public", status: "approved" });
  assert.equal(projection.includes("feedback"), false);
  assert.equal(projection.includes("uploadedBy"), false);
});

test("progress derives from milestones and reopening work clears final completion", () => {
  const project = { status: "completed", progressPercentage: 100, endDate: new Date(), milestones: [{ status: "completed" }, { status: "pending" }] };
  recalculateProgress(project);
  assert.equal(project.progressPercentage, 50);
  assert.equal(project.status, "ongoing");
  assert.equal(project.endDate, undefined);
  project.milestones = [];
  recalculateProgress(project);
  assert.equal(project.progressPercentage, 0);
});

test("students finishing milestones do not self-certify final completion", async () => {
  mock.method(Student, "findOne", async () => ({ _id: ids.student }));
  const milestone = { status: "in_progress" };
  const milestones = [milestone];
  milestones.id = () => milestone;
  const project = { status: "ongoing", milestones, async save() {} };
  mock.method(Research, "findOne", async () => project);
  const res = response();
  await updateMilestone(request({ status: "completed" }), res, next);
  assert.equal(project.progressPercentage, 100);
  assert.equal(project.status, "ongoing");
});

test("supervisors cannot complete unfinished projects or bypass proposal review", async () => {
  supervisorProfile();
  const project = { status: "ongoing", milestones: [{ status: "pending" }] };
  mock.method(Research, "findOne", async () => project);
  const res = response();
  await getProgress(request({ status: "completed" }), res, next);
  assert.equal(res.code, 409);
  project.status = "pending";
  const pendingRes = response();
  await getProgress(request({ status: "ongoing" }), pendingRes, next);
  assert.equal(pendingRes.code, 409);
});

test("deleting the last milestone resets progress and reopens completed projects", async () => {
  supervisorProfile();
  const milestones = [{ _id: ids.research, status: "completed" }];
  milestones.id = () => milestones[0];
  milestones.pull = () => milestones.splice(0, 1);
  const project = { status: "completed", milestones, progressPercentage: 100, async save() {} };
  mock.method(Research, "findOne", async () => project);
  await manageMilestones(request({ action: "delete", milestoneId: ids.research }), response(), next);
  assert.equal(project.progressPercentage, 0);
  assert.equal(project.status, "ongoing");
});

test("document and meeting links accept only HTTP(S) without embedded credentials", () => {
  assert.equal(isWebUrl("https://example.com/report.pdf"), true);
  for (const value of ["javascript:alert(1)", "data:text/html,test", "file:///etc/passwd", "https://user:password@example.com", "invalid"]) assert.equal(isWebUrl(value), false);
});
