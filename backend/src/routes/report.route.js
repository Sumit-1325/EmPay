import { Router } from "express";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { getSalaryStatementController } from "../controller/report.controller.js";

const router = Router();

router.use(verifyJWT, mustChangePasswordGuard);

// Only ADMIN and PAYROLL_OFFICER can view reports
router.get(
  "/salary-statement",
  requireRole("ADMIN", "PAYROLL_OFFICER"),
  getSalaryStatementController
);

export default router;
