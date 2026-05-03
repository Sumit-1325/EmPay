import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { formatUser } from "../helpers/formatters.js";
import { generateTempPassword } from "../helpers/password-helpers.js";
import { generateLoginId } from "./loginIdService.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { sendEmail } from "../utils/mail.util.js";

const COMPANY_SELECT = { id: true, name: true, code: true };

export const listEmployees = async (companyId) => {
  const users = await prisma.user.findMany({
    where:   { companyId },
    include: { company: { select: COMPANY_SELECT } },
    orderBy: { createdAt: "desc" },
  });

  return new apiResponse(200, "Employees fetched successfully", {
    employees: users.map(formatUser),
    total: users.length,
  });
};

export const getEmployee = async (companyId, employeeId) => {
  const user = await prisma.user.findFirst({
    where:   { id: employeeId, companyId },
    include: {
      company:        { select: COMPANY_SELECT },
      manager:        { select: { id: true, firstName: true, lastName: true, name: true } },
      skills:         { orderBy: { createdAt: "asc" } },
      certifications: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!user) throw new apiError(404, "Employee not found");

  return new apiResponse(200, "Employee fetched successfully", { employee: formatUser(user) });
};

export const createEmployee = async (companyId, data) => {
  const { firstName, lastName, email, role, joiningDate, monthlyWage, pfNumber, managerId } = data;
  const basicSalary = monthlyWage != null ? monthlyWage * 0.5 : null;

  const joining   = joiningDate ? new Date(joiningDate) : new Date();
  const company   = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new apiError(404, "Company not found");

  // Inherit company-level break time default for new employees
  const defaultBreakTime = company.breakTimeHours ?? 1;

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const emailExists = await prisma.user.findFirst({ where: { companyId, email: email.trim().toLowerCase() } });
  if (emailExists) throw new apiError(409, "An employee with this email already exists in your company");

  const employee = await prisma.$transaction(async (tx) => {
    const loginId = await generateLoginId(tx, {
      companyId,
      companyCode: company.code,
      firstName,
      lastName,
      joiningDate: joining,
    });

    return tx.user.create({
      data: {
        companyId,
        firstName:          firstName.trim(),
        lastName:           lastName.trim(),
        name:               `${firstName.trim()} ${lastName.trim()}`,
        loginId,
        email:              email.trim().toLowerCase(),
        passwordHash,
        role:               role || "EMPLOYEE",
        joiningDate:        joining,
        monthlyWage:        monthlyWage ?? null,
        basicSalary:        basicSalary,          // auto-computed: 50% of monthlyWage
        pfNumber:           pfNumber    ?? null,
        breakTimeHours:     defaultBreakTime,      // inherit from company setting
        ...(managerId && { managerId: parseInt(managerId) }),
        mustChangePassword: true,
      },
      include: { company: { select: COMPANY_SELECT } },
    });
  });

  // Send welcome email — fire and forget, don't block response on failure
  sendEmail({
    to: employee.email,
    subject: `Welcome to ${company.name} — Your EmPay Login Credentials`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#6366f1">Welcome to ${company.name}!</h2>
        <p>Your HRMS account has been created. Use the credentials below to log in.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr>
            <td style="padding:10px 14px;background:#f3f4f6;font-weight:600;border-radius:6px 0 0 6px">Login ID</td>
            <td style="padding:10px 14px;background:#f9fafb;font-family:monospace;border-radius:0 6px 6px 0">${formatUser(employee).loginId}</td>
          </tr>
          <tr><td colspan="2" style="height:8px"></td></tr>
          <tr>
            <td style="padding:10px 14px;background:#f3f4f6;font-weight:600;border-radius:6px 0 0 6px">Password</td>
            <td style="padding:10px 14px;background:#f9fafb;font-family:monospace;border-radius:0 6px 6px 0">${tempPassword}</td>
          </tr>
        </table>
        <p style="color:#ef4444;font-size:13px">⚠️ You will be asked to change your password on first login.</p>
        <p style="font-size:13px;color:#6b7280">Login at: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
      </div>
    `,
  }).catch(() => {}); // email failure must not block employee creation

  return new apiResponse(201, "Employee created successfully", {
    employee:    formatUser(employee),
    tempPassword,
    note: "Share the temp password securely — it will not be shown again.",
  });
};

export const updateEmployee = async (companyId, employeeId, data, requesterRole = "ADMIN") => {
  const existing = await prisma.user.findFirst({ where: { id: employeeId, companyId } });
  if (!existing) throw new apiError(404, "Employee not found");

  const isSelfEdit = requesterRole === "EMPLOYEE";

  const {
    // HR/Admin-only fields (ignored when employee updates own profile)
    firstName, lastName, role, basicSalary, pfNumber, joiningDate,
    monthlyWage, pfRate, workingDaysPerWeek, breakTimeHours,
    jobTitle, managerId,
    // Fields any user can edit on their own profile
    mobile, location, about, jobPassion, interests,
    dateOfBirth, address, nationality, personalEmail, gender, maritalStatus,
    bankAccountNumber, bankName, ifscCode, panNumber, uanNumber, empCode,
  } = data;

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: {
      // ── Manager/Admin-only fields ─────────────────────────────────────────
      ...(!isSelfEdit && firstName    != null && { firstName: firstName.trim() }),
      ...(!isSelfEdit && lastName     != null && { lastName:  lastName.trim()  }),
      ...(!isSelfEdit && (firstName != null || lastName != null) && {
        name: `${(firstName ?? existing.firstName ?? "").trim()} ${(lastName ?? existing.lastName ?? "").trim()}`.trim(),
      }),
      ...(!isSelfEdit && role               != null && { role }),
      ...(!isSelfEdit && basicSalary        != null && { basicSalary }),
      ...(!isSelfEdit && pfNumber           != null && { pfNumber }),
      ...(!isSelfEdit && joiningDate        != null && { joiningDate: new Date(joiningDate) }),
      ...(!isSelfEdit && monthlyWage        != null && { monthlyWage, basicSalary: monthlyWage * 0.5 }),
      ...(!isSelfEdit && pfRate             != null && { pfRate }),
      ...(!isSelfEdit && workingDaysPerWeek != null && { workingDaysPerWeek }),
      ...(!isSelfEdit && breakTimeHours     != null && { breakTimeHours }),
      ...(!isSelfEdit && jobTitle           != null && { jobTitle }),
      ...(!isSelfEdit && managerId          !== undefined && { managerId: managerId != null ? parseInt(managerId) : null }),
      // ── Self-editable fields (any authenticated user on own profile) ──────
      ...(mobile             != null && { mobile: mobile.trim() }),
      ...(location           != null && { location: location.trim() }),
      ...(about              != null && { about }),
      ...(jobPassion         != null && { jobPassion }),
      ...(interests          != null && { interests }),
      ...(dateOfBirth        != null && { dateOfBirth: new Date(dateOfBirth) }),
      ...(address            != null && { address }),
      ...(nationality        != null && { nationality }),
      ...(personalEmail      != null && { personalEmail }),
      ...(gender             != null && { gender }),
      ...(maritalStatus      != null && { maritalStatus }),
      ...(bankAccountNumber  != null && { bankAccountNumber }),
      ...(bankName           != null && { bankName }),
      ...(ifscCode           != null && { ifscCode }),
      ...(panNumber          != null && { panNumber }),
      ...(uanNumber          != null && { uanNumber }),
      ...(empCode            != null && { empCode }),
    },
    include: {
      company:        { select: COMPANY_SELECT },
      manager:        { select: { id: true, firstName: true, lastName: true, name: true } },
      skills:         { orderBy: { createdAt: "asc" } },
      certifications: { orderBy: { createdAt: "asc" } },
    },
  });

  return new apiResponse(200, "Employee updated successfully", { employee: formatUser(updated) });
};

export const updateEmployeeAvatar = async (companyId, employeeId, localFilePath) => {
  if (!localFilePath) throw new apiError(400, "No image file provided");

  const existing = await prisma.user.findFirst({ where: { id: employeeId, companyId } });
  if (!existing) throw new apiError(404, "Employee not found");

  // Delete old avatar from Cloudinary if present
  if (existing.avatarUrl) {
    await deleteFromCloudinary(existing.avatarUrl).catch(() => {});
  }

  const uploadResult = await uploadToCloudinary(localFilePath);
  const avatarUrl    = uploadResult.data; // secure_url returned in apiResponse.data

  const updated = await prisma.user.update({
    where:   { id: employeeId },
    data:    { avatarUrl },
    include: { company: { select: COMPANY_SELECT } },
  });

  return new apiResponse(200, "Avatar updated successfully", { employee: formatUser(updated) });
};

export const addSkill = async (companyId, employeeId, name) => {
  const employee = await prisma.user.findFirst({ where: { id: employeeId, companyId } });
  if (!employee) throw new apiError(404, "Employee not found");
  if (!name?.trim()) throw new apiError(400, "Skill name is required");

  const skill = await prisma.skill.create({ data: { userId: employeeId, name: name.trim() } });
  return new apiResponse(201, "Skill added", { skill });
};

export const deleteSkill = async (companyId, employeeId, skillId) => {
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, userId: employeeId, user: { companyId } },
  });
  if (!skill) throw new apiError(404, "Skill not found");

  await prisma.skill.delete({ where: { id: skillId } });
  return new apiResponse(200, "Skill removed", true);
};

export const addCertification = async (companyId, employeeId, { name, issuedBy, issuedDate }) => {
  const employee = await prisma.user.findFirst({ where: { id: employeeId, companyId } });
  if (!employee) throw new apiError(404, "Employee not found");
  if (!name?.trim()) throw new apiError(400, "Certification name is required");

  const cert = await prisma.certification.create({
    data: {
      userId:    employeeId,
      name:      name.trim(),
      issuedBy:  issuedBy?.trim()  ?? null,
      issuedDate: issuedDate ? new Date(issuedDate) : null,
    },
  });
  return new apiResponse(201, "Certification added", { certification: cert });
};

export const deleteCertification = async (companyId, employeeId, certId) => {
  const cert = await prisma.certification.findFirst({
    where: { id: certId, userId: employeeId, user: { companyId } },
  });
  if (!cert) throw new apiError(404, "Certification not found");

  await prisma.certification.delete({ where: { id: certId } });
  return new apiResponse(200, "Certification removed", true);
};

export const resetEmployeePassword = async (companyId, employeeId) => {
  const employee = await prisma.user.findFirst({
    where:   { id: employeeId, companyId },
    include: { company: { select: COMPANY_SELECT } },
  });
  if (!employee) throw new apiError(404, "Employee not found");

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id: employeeId },
    data:  { passwordHash, mustChangePassword: true, refreshToken: null },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?loginId=${encodeURIComponent(employee.loginId)}`;
  sendEmail({
    to:      employee.email,
    subject: `Your EmPay password has been reset`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#6366f1">Password Reset</h2>
        <p>Your password has been reset by an administrator. Use the credentials below to set a new password.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr>
            <td style="padding:10px 14px;background:#f3f4f6;font-weight:600;border-radius:6px 0 0 6px">Login ID</td>
            <td style="padding:10px 14px;background:#f9fafb;font-family:monospace;border-radius:0 6px 6px 0">${employee.loginId}</td>
          </tr>
          <tr><td colspan="2" style="height:8px"></td></tr>
          <tr>
            <td style="padding:10px 14px;background:#f3f4f6;font-weight:600;border-radius:6px 0 0 6px">Temp Password</td>
            <td style="padding:10px 14px;background:#f9fafb;font-family:monospace;border-radius:0 6px 6px 0">${tempPassword}</td>
          </tr>
        </table>
        <p style="margin:20px 0">
          <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Set New Password →</a>
        </p>
        <p style="color:#ef4444;font-size:13px">⚠️ You will be asked to change this password on first login.</p>
        <p style="font-size:12px;color:#9ca3af">If the button doesn't work, copy this link: ${resetLink}</p>
      </div>
    `,
  }).catch(() => {});

  return new apiResponse(200, "Password reset. New credentials sent to employee's email.", { email: employee.email });
};

export const deleteEmployee = async (companyId, employeeId, requesterId) => {
  if (employeeId === requesterId) throw new apiError(400, "You cannot delete your own account");

  const existing = await prisma.user.findFirst({ where: { id: employeeId, companyId } });
  if (!existing) throw new apiError(404, "Employee not found");

  await prisma.user.delete({ where: { id: employeeId } });

  return new apiResponse(200, "Employee deleted successfully", true);
};
