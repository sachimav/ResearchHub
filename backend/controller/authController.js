import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/user.js";
import Student from "../models/Student.js";
import Supervisor from "../models/supervisor.js";
import Department from "../models/department.js";
import Batch from "../models/batch.js";

const JWT_SECRET = process.env.JWT_SECRET || "researchhub-dev-secret";

const createToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

//reomve password before sending to frontend

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  const { password, ...safeUser } = userObj;
  return safeUser;
};

//role based navigate

const getRoleProfile = async (user) => {
  if (!user || !user._id) return {};

  if (user.role === "student") {
    const studentProfile = await Student.findOne({ userId: user._id })
      .populate("departmentId", "name")
      .populate("batchId", "batchName academicYear");

    if (!studentProfile) {
      return {};
    }

    return {
      regNo: studentProfile.regNo,
      department: studentProfile.departmentId?.name || "",
      batch: studentProfile.batchId?.batchName || studentProfile.batchId?.academicYear || "",
      program: studentProfile.program,
    };
  }

  if (user.role === "supervisor") {
    const supervisorProfile = await Supervisor.findOne({ userId: user._id }).populate("departmentId", "name");

    if (!supervisorProfile) {
      return {};
    }

    return {
      designation: supervisorProfile.designation,
      department: supervisorProfile.departmentId?.name || "",
      expertise: Array.isArray(supervisorProfile.expertise)
        ? supervisorProfile.expertise.join(", ")
        : supervisorProfile.expertise || "",
    };
  }

  return {};
};

const getDepartmentById = async (departmentId) => {
  if (!mongoose.isValidObjectId(departmentId)) {
    return null;
  }

  return Department.findById(departmentId);
};

const getBatchById = async (batchId) => {
  if (!mongoose.isValidObjectId(batchId)) {
    return null;
  }

  return Batch.findById(batchId);
};

export const getRegistrationOptions = async (_req, res) => {
  try {
    const [departments, batches] = await Promise.all([
      Department.find().select("_id name").sort({ name: 1 }),
      Batch.find().select("_id batchName academicYear").sort({ academicYear: -1 }),
    ]);

    return res.status(200).json({ departments, batches });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch registration options." });
  }
};

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      regNo,
      department,
      batch,
      program,
      designation,
      expertise,
      institution,
      phone,
    } = req.body;

    const selectedRole = (role || "student").toLowerCase();

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Full name is required." });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const emailDomain = normalizedEmail.split("@")[1];
    if (selectedRole === "student" && emailDomain !== "stu.vau.ac.lk") {
      return res.status(400).json({ message: "Student accounts must use an @stu.vau.ac.lk email address." });
    }

    if (selectedRole === "supervisor" && emailDomain !== "vau.ac.lk") {
      return res.status(400).json({ message: "Supervisor accounts must use an @vau.ac.lk email address." });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password and confirm password do not match." });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    let profilePayload = {
      institution: "",
      designation: "",
      phone: "",
    };

    if (selectedRole === "student") {
      if (!regNo || !regNo.trim()) {
        return res.status(400).json({ message: "Registration number is required." });
      }

      const normalizedRegNo = regNo.trim().toUpperCase();
      const existingStudent = await Student.findOne({ regNo: normalizedRegNo });
      if (existingStudent) {
        return res.status(409).json({ message: "This student registration number is already registered." });
      }

      if (typeof department !== "string" || !department.trim()) {
        return res.status(400).json({ message: "Department is required." });
      }

      if (typeof batch !== "string" || !batch.trim()) {
        return res.status(400).json({ message: "Batch is required." });
      }

      if (!program || !program.trim()) {
        return res.status(400).json({ message: "Program is required." });
      }

      const [departmentDoc, batchDoc] = await Promise.all([
        getDepartmentById(department),
        getBatchById(batch),
      ]);

      if (!departmentDoc) {
        return res.status(400).json({ message: "Please select a valid department." });
      }

      if (!batchDoc) {
        return res.status(400).json({ message: "Please select a valid batch." });
      }

      const createdUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role: "student",
      });

      const studentDoc = await Student.create({
        userId: createdUser._id,
        regNo: normalizedRegNo,
        departmentId: departmentDoc._id,
        batchId: batchDoc._id,
        program: program.trim(),
      });

      const token = createToken(createdUser);

      return res.status(201).json({
        message: "Student registered successfully.",
        token,
        user: sanitizeUser(createdUser),
        student: studentDoc,
      });
    }

    if (selectedRole === "supervisor") {
      if (typeof department !== "string" || !department.trim()) {
        return res.status(400).json({ message: "Department is required." });
      }

      if (!designation || !designation.trim()) {
        return res.status(400).json({ message: "Designation is required." });
      }

      if (!expertise || !expertise.toString().trim()) {
        return res.status(400).json({ message: "Expertise is required." });
      }

      const departmentDoc = await getDepartmentById(department);
      if (!departmentDoc) {
        return res.status(400).json({ message: "Please select a valid department." });
      }
      const expertiseList = Array.isArray(expertise)
        ? expertise
        : expertise
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

      const createdUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role: "supervisor",
      });

      const supervisorDoc = await Supervisor.create({
        userId: createdUser._id,
        departmentId: departmentDoc._id,
        designation: designation.trim(),
        expertise: expertiseList,
      });

      const token = createToken(createdUser);

      return res.status(201).json({
        message: "Supervisor registered successfully.",
        token,
        user: sanitizeUser(createdUser),
        supervisor: supervisorDoc,
      });
    }

    if (selectedRole === "public") {
      if (!institution || !institution.trim()) {
        return res.status(400).json({ message: "Institution is required." });
      }

      if (!designation || !designation.trim()) {
        return res.status(400).json({ message: "Designation is required." });
      }

      if (!phone || !phone.trim()) {
        return res.status(400).json({ message: "Phone number is required." });
      }

      profilePayload = {
        institution: institution.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
      };
    } else {
      return res.status(400).json({ message: "Invalid role selected." });
    }

    const createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: selectedRole,
      ...profilePayload,
    });

    const token = createToken(createdUser);

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: sanitizeUser(createdUser),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Registration failed." });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "No account found with this email." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    if (role && user.role !== role.toLowerCase()) {
      return res.status(403).json({
        message: `This account is registered as a ${user.role}. Please switch to the correct role.`,
      });
    }

    const token = createToken(user);
    const profile = await getRoleProfile(user);
    const responseUser = {
      ...sanitizeUser(user),
      ...profile,
    };

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: responseUser,
      profile,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Login failed." });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch user profile." });
  }
};