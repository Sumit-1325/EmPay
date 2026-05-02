import { Router } from "express";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import {
  listAttendanceController,
  attendanceSummaryController,
  checkInController,
  checkOutController,
  updateAttendanceController,
} from "../controller/attendance.controller.js";

const router = Router();

router.use(verifyJWT, mustChangePasswordGuard);

// Employee: own month summary (days present, leaves count, total hours)
router.get("/summary",    attendanceSummaryController);

// All roles — filtered in service (EMPLOYEE sees own only, Admin/HR sees all)
router.get("/",           listAttendanceController);

// Any authenticated user can check in/out for themselves
router.post("/check-in",  checkInController);
router.post("/check-out", checkOutController);

// Admin / HR Officer: manually correct an attendance record
router.put("/:id",        requireRole("ADMIN", "HR_OFFICER"), updateAttendanceController);

export default router;
