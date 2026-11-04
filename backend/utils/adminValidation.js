import mongoose from "mongoose";

export const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
export const text = (value, field, max = 200, allowEmpty = false) => {
  if (typeof value !== "string" || (!allowEmpty && !value.trim()) || value.trim().length > max) {
    fail(400, `${field} must be ${allowEmpty ? "text" : "non-empty text"} of at most ${max} characters.`);
  }
  return value.trim();
};
export const id = (value, field) => {
  if (typeof value !== "string" || !mongoose.isObjectIdOrHexString(value)) fail(400, `${field} must be a valid ID.`);
  return value.toLowerCase();
};
export const boolean = (value, field) => {
  if (typeof value !== "boolean") fail(400, `${field} must be a boolean.`);
  return value;
};
export const integer = (value, field, min, max) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(400, `${field} must be an integer from ${min} to ${max}.`);
  return value;
};
export const date = (value, field) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) || !Number.isFinite(new Date(value).getTime())) fail(400, `${field} must be a valid ISO date with a timezone when including a time.`);
  const calendarDate = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== value.slice(0, 10)) fail(400, `${field} must be a real calendar date.`);
  return new Date(value);
};
export const fields = (body, allowed) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) fail(400, "A JSON object is required.");
  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !allowed.includes(key))) fail(400, `Provide only these fields: ${allowed.join(", ")}.`);
};
export const pagination = (query) => {
  for (const key of ["page", "limit"]) if (query[key] !== undefined && (typeof query[key] !== "string" || !/^\d+$/.test(query[key]))) fail(400, `${key} must be a positive integer.`);
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  integer(page, "page", 1, 10000);
  integer(limit, "limit", 1, 100);
  return { page, limit, skip: (page - 1) * limit };
};
export const search = (value) => new RegExp(text(value, "q", 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
export const email = (value) => {
  const normalized = text(value, "email", 254).toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) fail(400, "Enter a valid email address.");
  return normalized;
};
export const password = (value) => {
  if (typeof value !== "string" || value.length < 12 || Buffer.byteLength(value, "utf8") > 72) fail(400, "Password must contain at least 12 characters and at most 72 UTF-8 bytes.");
  return value;
};
