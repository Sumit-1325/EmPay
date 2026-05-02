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
  addSkillController,
  deleteSkillController,
  addCertificationController,
  deleteCertificationController,
  resetEmployeePasswordController,
} from "../controller/employee.controller.js";

const router = Router();

// All employee routes require auth + mustChangePassword cleared
router.use(verifyJWT, mustChangePasswordGuard);

// Middleware: allow if requester is a manager-role OR is accessing their own record
function selfOrManagerRole(...roles) {
  return (req, res, next) => {
    const isManager = roles.includes(req.user.role);
    const isSelf    = String(req.user.id) === String(req.params.id);
    if (isManager || isSelf) return next();
    return res.status(403).json({ success: false, message: "Access denied" });
  };
}

const createValidators = [
  body("firstName").trim().notEmpty().withMessage("First name is required."),
  body("lastName").trim().notEmpty().withMessage("Last name is required."),
  body("email").trim().isEmail().withMessage("Valid email is required."),
  body("role")
    .optional()
    .isIn(["ADMIN", "HR_OFFICER", "PAYROLL_OFFICER", "EMPLOYEE"])
    .withMessage("Invalid role."),
  body("monthlyWage").optional().isFloat({ min: 0 }).withMessage("Monthly wage must be a positive number."),
];

router.get(   "/",           requireRole("ADMIN", "HR_OFFICER", "PAYROLL_OFFICER"), listEmployeesController);
router.post(  "/",           requireRole("ADMIN", "HR_OFFICER"), createValidators, validatorMiddleware, createEmployeeController);
router.get(   "/:id",        selfOrManagerRole("ADMIN", "HR_OFFICER", "PAYROLL_OFFICER"), getEmployeeController);
router.put(   "/:id",        selfOrManagerRole("ADMIN", "HR_OFFICER"),                    updateEmployeeController);
router.delete("/:id",        requireRole("ADMIN"),               deleteEmployeeController);
router.patch( "/:id/avatar",              requireRole("ADMIN", "HR_OFFICER"), upload.single("avatar"), uploadAvatarController);
router.post(  "/:id/skills",              requireRole("ADMIN", "HR_OFFICER"), addSkillController);
router.delete("/:id/skills/:skillId",     requireRole("ADMIN", "HR_OFFICER"), deleteSkillController);
router.post(  "/:id/certifications",      requireRole("ADMIN", "HR_OFFICER"), addCertificationController);
router.delete("/:id/certifications/:certId", requireRole("ADMIN", "HR_OFFICER"), deleteCertificationController);
router.post(  "/:id/reset-password",         requireRole("ADMIN", "HR_OFFICER"), resetEmployeePasswordController);

export default router;
