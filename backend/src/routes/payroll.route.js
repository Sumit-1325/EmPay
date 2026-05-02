import { Router } from "express";
import { body } from "express-validator";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validatorMiddleware } from "../middleware/validator.middleware.js";
import {
  listPayslipsController,
  getPayslipController,
  runPayrollController,
  listPayrunsController,
  markPayslipPaidController,
  getDashboardController,
  getPayslipPdfController,
} from "../controller/payroll.controller.js";

const router = Router();

router.use(verifyJWT, mustChangePasswordGuard);

const runValidators = [
  body("month").isInt({ min: 1, max: 12 }).withMessage("Month must be 1–12."),
  body("year").isInt({ min: 2000 }).withMessage("Valid year is required."),
];

router.get(  "/dashboard",  requireRole("ADMIN", "PAYROLL_OFFICER", "HR_OFFICER"), getDashboardController);
router.get(  "/payruns",    requireRole("ADMIN", "PAYROLL_OFFICER"), listPayrunsController);
router.post( "/run",        requireRole("ADMIN", "PAYROLL_OFFICER"), runValidators, validatorMiddleware, runPayrollController);
router.get(  "/",           listPayslipsController);
router.get(  "/:id/pdf",    getPayslipPdfController);
router.get(  "/:id",        getPayslipController);
router.patch("/:id/pay",    requireRole("ADMIN", "PAYROLL_OFFICER"), markPayslipPaidController);

export default router;
