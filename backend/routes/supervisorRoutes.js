import { Router } from "express";

import { getReviewQueue } from "../controller/supervisorController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, requireRole("supervisor"));
router.get("/review-queue", getReviewQueue);

export default router;