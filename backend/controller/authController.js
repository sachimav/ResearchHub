import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

//auth apis (logins and Reg)
