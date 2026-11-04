import { after, afterEach, before, mock, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/user.js";
import { getJwtSecret } from "../config/env.js";
import { date, email, fields, pagination, password, search } from "../utils/adminValidation.js";
import { AcademicYear, MilestoneTemplate } from "../models/adminConfiguration.js";
import { updateUserStatus } from "../controller/adminController.js";
import { missingDocuments } from "../utils/submissionRequirements.js";
import Document from "../models/document.js";
import mongoose from "mongoose";
import { adminTransaction } from "../utils/adminTransaction.js";

const userId = "507f1f77bcf86cd799439011";
let server;
let base;
const token = () => jwt.sign({ id: userId }, getJwtSecret(), { audience: "researchhub-api", expiresIn: "1h" });
before(async () => {
  process.env.JWT_SECRET = "admin-test-secret-longer-than-thirty-two-characters";
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
afterEach(() => mock.restoreAll());
after(() => new Promise((resolve) => server.close(resolve)));
const currentRole = (role, isActive = true) => mock.method(User, "findById", () => ({ select: async () => ({ _id: userId, role, isActive }) }));

test("all admin endpoint groups reject anonymous and non-admin accounts", async () => {
  const routes = ["dashboard", "users", "supervisors", "research", "deadlines", "reports", "audit-logs", "settings", "departments", "batches", "programs", "academic-years", "milestone-templates"];
  for (const path of routes) assert.equal((await fetch(`${base}/admin/${path}`)).status, 401);
  for (const role of ["student", "supervisor", "public"]) {
    currentRole(role);
    for (const path of routes) assert.equal((await fetch(`${base}/admin/${path}`, { headers: { Authorization: `Bearer ${token()}` } })).status, 403);
    mock.restoreAll();
  }
});

test("admin mutation routes enforce roles before performing writes", async () => {
  currentRole("student");
  const paths = [["POST", "departments"], ["POST", "batches"], ["POST", "invitations/admin"], ["POST", "invitations/supervisor"], ["PATCH", `users/${userId}/status`], ["PATCH", `research/${userId}/supervisor`], ["PATCH", "settings"], ["DELETE", `deadlines/${userId}`]];
  for (const [method, path] of paths) assert.equal((await fetch(`${base}/admin/${path}`, { method, headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: "{}" })).status, 403);
});

test("admin role and identifier guards use current database state", async () => {
  currentRole("admin");
  assert.equal((await fetch(`${base}/admin/users/invalid`, { headers: { Authorization: `Bearer ${token()}` } })).status, 400);
  mock.restoreAll();
  currentRole("admin", false);
  assert.equal((await fetch(`${base}/admin/dashboard`, { headers: { Authorization: `Bearer ${token()}` } })).status, 401);
});

test("public registration cannot create an administrator", async () => {
  mock.method(User, "findOne", async () => null);
  const result = await fetch(`${base}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Unauthorized", role: "admin", email: "admin@example.com", password: "Password123456!", confirmPassword: "Password123456!" }) });
  assert.equal(result.status, 400);
});

test("admin status changes cannot deactivate the caller", async () => {
  await assert.rejects(updateUserStatus({ user: { id: userId }, params: { userId }, body: { isActive: false, reason: "Test" } }, {}), { status: 409 });
});

test("admin invitations validate inputs without exposing database state", async () => {
  for (const body of [{}, { email: "admin@example.com", role: "admin" }, { name: "Admin", email: "admin@example.com", password: "short", confirmPassword: "short", invitationToken: "invalid" }]) {
    const response = await fetch(`${base}/auth/admin/accept-invitation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    assert.equal(response.status, 400);
  }
});

test("pagination, search, dates and passwords reject unsafe inputs", () => {
  for (const query of [{ page: "0" }, { limit: "101" }, { page: ["1"] }, { page: "1.5" }, { limit: {} }]) assert.throws(() => pagination(query), { status: 400 });
  assert.equal(search("a.*b").test("aZZb"), false);
  assert.equal(search("a.*b").test("a.*b"), true);
  assert.throws(() => search({ $ne: null }), { status: 400 });
  assert.throws(() => date(42, "date"), { status: 400 });
  assert.throws(() => date("tomorrow", "date"), { status: 400 });
  assert.throws(() => date("2026-02-31", "date"), { status: 400 });
  assert.throws(() => fields(undefined, ["reason"]), { status: 400 });
  assert.throws(() => password("a".repeat(73)), { status: 400 });
  assert.throws(() => password("😀".repeat(19)), { status: 400 });
  assert.throws(() => fields({ role: "admin" }, ["isActive"]), { status: 400 });
  assert.equal(email(" ADMIN@Example.com "), "admin@example.com");
});

test("academic configuration models reject invalid document requirements", async () => {
  const year = new AcademicYear({ name: "2026" });
  await assert.rejects(year.validate(), { name: "ValidationError" });
  const template = new MilestoneTemplate({ name: "Test", requiredDocuments: [{ stage: "unknown", documentType: "script" }] });
  await assert.rejects(template.validate(), { name: "ValidationError" });
});

test("submission requirements require approved documents only for completion", async () => {
  const calls = [];
  mock.method(Document, "distinct", async (_field, filter) => { calls.push(filter); return ["proposal"]; });
  const research = { _id: userId, requiredDocuments: [{ stage: "proposal", documentType: "proposal" }, { stage: "completion", documentType: "final_report" }] };
  assert.deepEqual(await missingDocuments(research, "proposal"), []);
  assert.deepEqual(calls[0].status, { $in: ["pending", "approved"] });
  assert.deepEqual(await missingDocuments(research, "completion"), ["final_report"]);
  assert.equal(calls[1].status, "approved");
});

test("standalone MongoDB returns actionable 503 for admin writes", async () => {
  mock.method(mongoose.models.adminControl, "updateOne", async () => ({}));
  mock.method(mongoose.connection, "transaction", async () => { throw Object.assign(new Error("Transactions unavailable"), { code: 20 }); });
  await assert.rejects(adminTransaction(async () => {}), (error) => error.status === 503 && error.message.includes("replica set"));
});
