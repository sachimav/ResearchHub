import { Router } from "express";

import {
  registerPublicUser,
  loginPublicUser,
  getPublicProfile,
} from "../controller/publicController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/ping", (req, res) => {
  res.status(200).json({ message: "Public module is running" });
});

// Open routes
router.post("/register", registerPublicUser);
router.post("/login", loginPublicUser);

// Protected route (valid JWT + public role)
router.get("/me", protect, authorizeRoles("public"), getPublicProfile);

export default router;