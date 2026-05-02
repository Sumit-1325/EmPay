import { Router } from "express";
import { body } from "express-validator";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validatorMiddleware } from "../middleware/validator.middleware.js";
import {
  listAllocationsController,
  getMyAllocationsController,
  createAllocationController,
  deleteAllocationController,
} from "../controller/leave-allocation.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT, mustChangePasswordGuard);

// Any authenticated user can see their OWN allocations
router.get("/me", getMyAllocationsController);

// Only ADMIN and HR_OFFICER can manage allocations
const hrAdminOnly = requireRole("ADMIN", "HR_OFFICER");

const createValidators = [
  body("targetUserId").notEmpty().withMessage("Employee is required."),
  body("leaveType").trim().notEmpty().withMessage("Leave type is required."),
  body("startDate").isISO8601().withMessage("Valid start date is required."),
  body("endDate").optional({ nullable: true }).isISO8601().withMessage("Valid end date required if provided."),
  body("days")
    .notEmpty().withMessage("Days is required.")
    .isInt({ min: 0 }).withMessage("Days must be a non-negative integer."),
];

router.get(    "/", hrAdminOnly, listAllocationsController);
router.post(   "/", hrAdminOnly, createValidators, validatorMiddleware, createAllocationController);
router.delete( "/:id", hrAdminOnly, deleteAllocationController);

export default router;
