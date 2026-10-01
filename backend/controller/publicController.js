import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.js";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Never send the password hash back to the client
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  institution: user.institution,
  designation: user.designation,
  phone: user.phone,
  createdAt: user.createdAt,
});

const clean = (value) => (typeof value === "string" ? value.trim() : "");

// POST /rh/public/register
export const registerPublicUser = async (req, res) => {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const institution = clean(req.body.institution);
    const designation = clean(req.body.designation);
    const phone = clean(req.body.phone);
    const { password, confirmPassword } = req.body;

    // Same rules as the AuthPage.jsx form
    if (!name) {
      return res.status(400).json({ message: "Full Name is required." });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password and Confirm Password do not match." });
    }
    if (!institution) {
      return res
        .status(400)
        .json({ message: "Institution / Organization is required for Public Users." });
    }
    if (!designation) {
      return res
        .status(400)
        .json({ message: "Designation / Job Title is required for Public Users." });
    }
    if (!phone) {
      return res
        .status(400)
        .json({ message: "Contact Phone Number is required for Public Users." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        message:
          "An account with this email address already exists. Please login or use a different email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // role is always forced to "public" - never taken from the request body
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "public",
      institution,
      designation,
      phone,
    });

    return res.status(201).json({
      message: "Successfully registered",
      user: sanitizeUser(user),
    });
  } catch (error) {
    // Two requests with the same email at the same time
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "An account with this email address already exists." });
    }
    return res.status(500).json({ message: error.message });
  }
};

// POST /rh/public/login
export const loginPublicUser = async (req, res) => {
  try {
    const email = clean(req.body.email).toLowerCase();
    const { password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "User Email is required." });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const user = await User.findOne({ email });

    // Same message for unknown email and wrong password (avoids revealing which emails exist)
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.role !== "public") {
      return res.status(403).json({
        message: `This account is registered as a "${user.role}". Please switch to the correct tab above to login.`,
      });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "This account has been deactivated. Please contact the administrator." });
    }

    return res.status(200).json({
      message: "Login successful",
      token: signToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /rh/public/me  (requires login)
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "This account has been deactivated. Please contact the administrator." });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};