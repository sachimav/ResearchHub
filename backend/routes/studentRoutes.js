import { Router } from "express";

import { getProfile } from "../controller/studentController.js";

const router = Router();

router.get("/me",getProfile);

export default router;