import { Router } from "express";

import { getCurrentUser, loginUser, registerUser } from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);

export default router;
