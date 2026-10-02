import { Router } from "express";

import { getProfile, listResearch } from "../controller/studentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/me", protect, getProfile);
router.get("/research", protect, listResearch);

export default router;