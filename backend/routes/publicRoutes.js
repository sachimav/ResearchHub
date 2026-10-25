import { validateIds } from "../middleware/validateIds.js";
import { Router } from "express";

import { getResearchDetails, listResearch } from "../controller/publicController.js";

const router = Router();
for (const name of ["researchId", "milestoneId", "notificationId", "documentId", "meetingId", "deadlineId"]) router.param(name, validateIds);

router.get("/research", listResearch);
router.get("/research/:researchId", getResearchDetails);

export default router;
