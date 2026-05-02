export const USER_ROLES = {
  ADMIN:            "ADMIN",
  HR_OFFICER:       "HR_OFFICER",
  PAYROLL_OFFICER:  "PAYROLL_OFFICER",
  EMPLOYEE:         "EMPLOYEE",
  SUPER_ADMIN:      "SUPER_ADMIN",
};

export const ROLE_LABELS = {
  ADMIN:           "Admin",
  HR_OFFICER:      "HR Officer",
  PAYROLL_OFFICER: "Payroll Officer",
  EMPLOYEE:        "Employee",
  SUPER_ADMIN:     "Super Admin",
};

// Roles that can manage other employees
export const MANAGER_ROLES = [USER_ROLES.ADMIN, USER_ROLES.HR_OFFICER];

// Roles that can access payroll
export const PAYROLL_ROLES = [USER_ROLES.ADMIN, USER_ROLES.PAYROLL_OFFICER];

// Roles that can approve leave
export const LEAVE_APPROVER_ROLES = [USER_ROLES.ADMIN, USER_ROLES.PAYROLL_OFFICER];
