import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.js";
import { getJwtSecret } from "../config/env.js";

export const protect = async (req, res, next) => {
  let decoded;
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }

    decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"], audience: "researchhub-api" });
    if (!mongoose.isValidObjectId(decoded.id)) throw new Error("Invalid subject");
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
  try {
    const user = await User.findById(decoded.id).select("email role isActive");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "This account is unavailable or inactive." });
    }
    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to access this resource." });
  }

  return next();
};
