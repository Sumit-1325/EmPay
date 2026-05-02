import { Router } from "express";
import { body } from "express-validator";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validatorMiddleware } from "../middleware/validator.middleware.js";
import {
  listLeaveController,
  createLeaveController,
  approveLeaveController,
  deleteLeaveController,
} from "../controller/leave.controller.js";

const router = Router();

router.use(verifyJWT, mustChangePasswordGuard);

const createValidators = [
  body("leaveType").trim().notEmpty().withMessage("Leave type is required."),
  body("startDate").isISO8601().withMessage("Valid start date is required."),
  body("endDate").isISO8601().withMessage("Valid end date is required."),
  body("isPaid").optional().isBoolean().withMessage("isPaid must be true or false."),
];

router.get(  "/",                listLeaveController);
router.post( "/",                createValidators, validatorMiddleware, createLeaveController);
router.put(  "/:id/:action",     requireRole("ADMIN", "HR_OFFICER", "PAYROLL_OFFICER"), approveLeaveController);
router.delete("/:id",            deleteLeaveController);

export default router;
