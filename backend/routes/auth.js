import { Router } from "express";

import { getCurrentUser, getRegistrationOptions, loginUser, registerUser } from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/options", getRegistrationOptions);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);

export default router;
