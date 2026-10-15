import { Router } from "express";

import { getResearchDetails, listResearch } from "../controller/publicController.js";

const router = Router();

router.get("/research", listResearch);
router.get("/research/:researchId", getResearchDetails);

export default router;