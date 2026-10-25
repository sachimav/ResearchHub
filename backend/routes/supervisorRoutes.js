import { validateIds } from "../middleware/validateIds.js";
import { Router } from "express";

import {
  addFeedback,
  createDeadline,
  deleteDeadline,
  getDashboard,
  getNotification,
  getProgress,
  getProgressReports,
  getResearch,
  listDeadlines,
  listDocuments,
  listMeetings,
  listResearch,
  listStudents,
  manageMilestones,
  markAll,
  markNotification,
  respondMeetingRequest,
  review,
  reviewDocument,
  scheduleMeeting,
  updateAvailability,
  updateMeeting,
  updateProfile,
} from "../controller/supervisorController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();
for (const name of ["researchId", "milestoneId", "notificationId", "documentId", "meetingId", "deadlineId"]) router.param(name, validateIds);

router.use(protect, requireRole("supervisor"));

router.get("/dashboard", getDashboard);
router.get("/profile", getDashboard);
router.patch("/profile", updateProfile);
router.patch("/availability", updateAvailability);
router.get("/reports", getProgressReports);

router.get("/students", listStudents);
router.get("/research", listResearch);
router.get("/research/:researchId", getResearch);
router.patch("/research/:researchId/review", review);
router.patch("/research/:researchId/progress", getProgress);
router.patch("/research/:researchId/milestones", manageMilestones);
router.post("/research/:researchId/feedback", addFeedback);
router.get("/research/:researchId/documents", listDocuments);
router.patch("/documents/:documentId/review", reviewDocument);

router.get("/deadlines", listDeadlines);
router.post("/deadlines", createDeadline);
router.delete("/deadlines/:deadlineId", deleteDeadline);

router.get("/meetings", listMeetings);
router.post("/meetings", scheduleMeeting);
router.patch("/meetings/:meetingId", updateMeeting);
router.patch("/meetings/:meetingId/respond", respondMeetingRequest);

router.get("/notifications", getNotification);
router.patch("/notifications/read-all", markAll);
router.patch("/notifications/:notificationId/read", markNotification);

export default router;
