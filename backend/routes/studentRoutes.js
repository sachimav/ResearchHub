import { Router } from "express";

import { getProfile,listResearch } from "../controller/studentController.js";

const router = Router();

router.get("/me",getProfile);
router.get("/research",listResearch);

export default router;