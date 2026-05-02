import { Router } from "express";
import { body } from "express-validator";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validatorMiddleware } from "../middleware/validator.middleware.js";
import {
  listPayslipsController,
  getPayslipController,
  createPayslipController,
  markPayslipPaidController,
  getDashboardController,
} from "../controller/payroll.controller.js";

const router = Router();

router.use(verifyJWT, mustChangePasswordGuard);

const createValidators = [
  body("userId").isInt({ min: 1 }).withMessage("Valid employee ID is required."),
  body("month").isInt({ min: 1, max: 12 }).withMessage("Month must be 1-12."),
  body("year").isInt({ min: 2000 }).withMessage("Valid year is required."),
  // basicSalary is read from the employee record — not accepted from request body
  body("deductions").optional().isFloat({ min: 0 }).withMessage("Deductions must be a positive number."),
];

router.get(  "/dashboard", requireRole("ADMIN", "PAYROLL_OFFICER", "HR_OFFICER"), getDashboardController);
router.get(  "/",          listPayslipsController);
router.post( "/",          requireRole("ADMIN", "PAYROLL_OFFICER"), createValidators, validatorMiddleware, createPayslipController);
router.get(  "/:id",       getPayslipController);
router.patch("/:id/pay",   requireRole("ADMIN", "PAYROLL_OFFICER"), markPayslipPaidController);

export default router;
