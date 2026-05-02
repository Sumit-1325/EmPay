import { apiError } from "../utils/api-error.js";

export const PERMISSIONS = {
  CREATE_EMPLOYEE:     ["ADMIN", "HR_OFFICER"],
  EDIT_EMPLOYEE:       ["ADMIN", "HR_OFFICER"],
  DELETE_EMPLOYEE:     ["ADMIN"],
  VIEW_ALL_ATTENDANCE: ["ADMIN", "HR_OFFICER", "PAYROLL_OFFICER"],
  MANAGE_LEAVE_ALLOC:  ["ADMIN", "HR_OFFICER"],
  APPROVE_LEAVE:       ["ADMIN", "PAYROLL_OFFICER"],
  ACCESS_PAYROLL:      ["ADMIN", "PAYROLL_OFFICER"],
  SYSTEM_SETTINGS:     ["ADMIN"],
};

/**
 * Restrict a route to users whose role is in the provided list.
 * Usage: requireRole("ADMIN", "HR_OFFICER")
 */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new apiError(401, "Not authenticated"));
  if (!roles.includes(req.user.role)) return next(new apiError(403, "Insufficient permissions"));
  next();
};

/**
 * Restrict a route using a named permission from the PERMISSIONS matrix.
 * Usage: checkPermission("CREATE_EMPLOYEE")
 */
export const checkPermission = (permission) => (req, _res, next) => {
  if (!req.user) return next(new apiError(401, "Not authenticated"));
  const allowed = PERMISSIONS[permission] ?? [];
  if (!allowed.includes(req.user.role)) return next(new apiError(403, "Insufficient permissions"));
  next();
};
