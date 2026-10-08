import { Router } from "express";

import {
  createDocument,
  createResearch,
  getDashboard,
  getProfile,
  getResearchDetails,
  listDeadlines,
  listMeetings,
  listNotifications,
  listResearch,
  markAllNotificationsRead,
  markNotificationRead,
  updateResearch,
} from "../controller/studentController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, requireRole("student"));

router.get("/me", getProfile);
router.get("/dashboard", getDashboard);
router.get("/research", listResearch);
router.post("/research", createResearch);
router.get("/research/:researchId", getResearchDetails);
router.patch("/research/:researchId", updateResearch);
router.post("/research/:researchId/documents", createDocument);
router.get("/deadlines", listDeadlines);
router.get("/meetings", listMeetings);
router.get("/notifications", listNotifications);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.patch("/notifications/:notificationId/read", markNotificationRead);

export default router;