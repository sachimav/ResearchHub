import { Router } from "express";

import {
  addFeedback,
  getNotification,
  getProgress,
  getResearch,
  listDocuments,
  listDeadlines,
  listMeetings,
  listResearch,
  listStudents,
  markAll,
  markNotification,
  meetingStatus,
  review,
  scheduleMeeting,
  updateMeeting,
} from "../controller/supervisorController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, requireRole("supervisor"));

router.get("/research", listResearch);
router.get("/research/:researchId", getResearch);
router.patch("/research/:researchId/review", review);
router.patch("/research/:researchId/progress", getProgress);
router.get("/students", listStudents);
router.post("/research/:researchId/feedback", addFeedback);
router.get("/research/:researchId/documents", listDocuments);
router.get("/meetings", listMeetings);
router.post("/meetings", scheduleMeeting);
router.patch("/meetings/:meetingId", updateMeeting);
router.patch("/meetings/:meetingId/status", meetingStatus);
router.get("/deadlines", listDeadlines);
router.get("/notifications", getNotification);
router.patch("/notifications/read-all", markAll);
router.patch("/notifications/:notificationId/read", markNotification);

export default router;