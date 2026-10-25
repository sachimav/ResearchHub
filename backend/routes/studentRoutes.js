import { validateIds } from "../middleware/validateIds.js";
import { Router } from "express";

import {
  createDocument,
  createResearch,
  getDashboard,
  getProfile,
  getResearchDetails,
  getSupervisors,
  listDeadlines,
  listMeetings,
  listNotifications,
  listResearch,
  markAllNotificationsRead,
  markNotificationRead,
  requestMeeting,
  updateMilestone,
  updateProfile,
  updateResearch,
} from "../controller/studentController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();
for (const name of ["researchId", "milestoneId", "notificationId", "documentId", "meetingId", "deadlineId"]) router.param(name, validateIds);

router.use(protect, requireRole("student"));

router.get("/me", getProfile);
router.patch("/me", updateProfile);
router.get("/dashboard", getDashboard);
router.get("/supervisors", getSupervisors);
router.get("/research", listResearch);
router.post("/research", createResearch);
router.get("/research/:researchId", getResearchDetails);
router.patch("/research/:researchId", updateResearch);
router.patch("/research/:researchId/milestones/:milestoneId", updateMilestone);
router.post("/research/:researchId/documents", createDocument);
router.get("/deadlines", listDeadlines);
router.get("/meetings", listMeetings);
router.post("/meetings/request", requestMeeting);
router.get("/notifications", listNotifications);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.patch("/notifications/:notificationId/read", markNotificationRead);

export default router;
