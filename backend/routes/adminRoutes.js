import { Router } from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { validateIds } from "../middleware/validateIds.js";
import * as admin from "../controller/adminController.js";
import { inviteAdmin, revokeAdminInvitation, inviteSupervisor } from "../controller/adminAuthController.js";
import { getSettings, listSetup, saveSetup, setupResources, updateSettings } from "../controller/adminSetupController.js";

const router = Router();
router.use(protect, requireRole("admin"));
for (const parameter of ["userId", "studentId", "supervisorId", "researchId", "deadlineId", "recordId", "invitationId"]) router.param(parameter, validateIds);
router.get("/dashboard", admin.dashboard);
router.get("/users", admin.listUsers);
router.get("/users/:userId", admin.userDetails);
router.patch("/users/:userId/status", admin.updateUserStatus);
router.patch("/students/:studentId/academic-profile", admin.updateStudentAcademic);
router.post("/invitations/admin", inviteAdmin);
router.delete("/invitations/admin/:invitationId", revokeAdminInvitation);
router.post("/invitations/supervisor", inviteSupervisor);
router.get("/supervisors", admin.listSupervisors);
router.patch("/supervisors/:supervisorId/capacity", admin.updateSupervisorCapacity);
router.get("/research", admin.listResearch);
router.get("/research/:researchId", admin.researchDetails);
router.patch("/research/:researchId/supervisor", admin.assignSupervisor);
router.patch("/research/:researchId/publication", admin.updatePublication);
router.get("/deadlines", admin.listDeadlines);
router.post("/deadlines", admin.saveDeadline);
router.patch("/deadlines/:deadlineId", admin.saveDeadline);
router.delete("/deadlines/:deadlineId", admin.deleteDeadline);
router.get("/reports", admin.reports);
router.get("/audit-logs", admin.listAudit);
router.get("/settings", getSettings);
router.patch("/settings", updateSettings);
for (const resource of setupResources) {
  const selectResource = (req, _res, next) => { req.params.resource = resource; next(); };
  router.get(`/${resource}`, selectResource, listSetup);
  router.post(`/${resource}`, selectResource, saveSetup);
  router.patch(`/${resource}/:recordId`, selectResource, saveSetup);
}
export default router;
