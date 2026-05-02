import { Router } from "express";
import { body } from "express-validator";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validatorMiddleware } from "../middleware/validator.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  listEmployeesController,
  getEmployeeController,
  createEmployeeController,
  updateEmployeeController,
  deleteEmployeeController,
  uploadAvatarController,
} from "../controller/employee.controller.js";

const router = Router();

// All employee routes require auth + mustChangePassword cleared
router.use(verifyJWT, mustChangePasswordGuard);

const createValidators = [
  body("firstName").trim().notEmpty().withMessage("First name is required."),
  body("lastName").trim().notEmpty().withMessage("Last name is required."),
  body("email").trim().isEmail().withMessage("Valid email is required."),
  body("role")
    .optional()
    .isIn(["ADMIN", "HR_OFFICER", "PAYROLL_OFFICER", "EMPLOYEE"])
    .withMessage("Invalid role."),
  body("basicSalary").optional().isFloat({ min: 0 }).withMessage("Basic salary must be a positive number."),
];

router.get(   "/",           requireRole("ADMIN", "HR_OFFICER", "PAYROLL_OFFICER"), listEmployeesController);
router.post(  "/",           requireRole("ADMIN", "HR_OFFICER"), createValidators, validatorMiddleware, createEmployeeController);
router.get(   "/:id",        requireRole("ADMIN", "HR_OFFICER", "PAYROLL_OFFICER"), getEmployeeController);
router.put(   "/:id",        requireRole("ADMIN", "HR_OFFICER"), updateEmployeeController);
router.delete("/:id",        requireRole("ADMIN"),               deleteEmployeeController);
router.patch( "/:id/avatar", requireRole("ADMIN", "HR_OFFICER"), upload.single("avatar"), uploadAvatarController);

export default router;
