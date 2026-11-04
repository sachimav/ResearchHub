import { Router } from "express";

import { getCurrentUser, getRegistrationOptions, loginUser, registerUser } from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authRateLimit } from "../middleware/authRateLimit.js";
import { acceptAdminInvitation } from "../controller/adminAuthController.js";

const router = Router();

router.get("/options", getRegistrationOptions);
router.post("/register", authRateLimit, registerUser);
router.post("/login", authRateLimit, loginUser);
router.post("/admin/accept-invitation", authRateLimit, acceptAdminInvitation);
router.get("/me", protect, getCurrentUser);

export default router;
