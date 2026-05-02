import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { formatUser } from "../helpers/formatters.js";
import { generateTempPassword } from "../helpers/password-helpers.js";
import { generateLoginId } from "./loginIdService.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

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
    include: { company: { select: COMPANY_SELECT } },
  });

  if (!user) throw new apiError(404, "Employee not found");

  return new apiResponse(200, "Employee fetched successfully", { employee: formatUser(user) });
};

export const createEmployee = async (companyId, data) => {
  const { firstName, lastName, email, role, joiningDate, basicSalary, pfNumber } = data;

  const joining   = joiningDate ? new Date(joiningDate) : new Date();
  const company   = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new apiError(404, "Company not found");

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

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
        basicSalary:        basicSalary ?? null,
        pfNumber:           pfNumber    ?? null,
        mustChangePassword: true,
      },
      include: { company: { select: COMPANY_SELECT } },
    });
  });

  return new apiResponse(201, "Employee created successfully", {
    employee:    formatUser(employee),
    tempPassword,
    note: "Share the temp password securely — it will not be shown again.",
  });
};

export const updateEmployee = async (companyId, employeeId, data) => {
  const existing = await prisma.user.findFirst({ where: { id: employeeId, companyId } });
  if (!existing) throw new apiError(404, "Employee not found");

  const { firstName, lastName, role, basicSalary, pfNumber, joiningDate } = data;

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: {
      ...(firstName    != null && { firstName: firstName.trim() }),
      ...(lastName     != null && { lastName:  lastName.trim()  }),
      ...(firstName != null || lastName != null) && {
        name: `${(firstName ?? existing.firstName ?? "").trim()} ${(lastName ?? existing.lastName ?? "").trim()}`.trim(),
      },
      ...(role        != null && { role }),
      ...(basicSalary != null && { basicSalary }),
      ...(pfNumber    != null && { pfNumber }),
      ...(joiningDate != null && { joiningDate: new Date(joiningDate) }),
    },
    include: { company: { select: COMPANY_SELECT } },
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

export const deleteEmployee = async (companyId, employeeId, requesterId) => {
  if (employeeId === requesterId) throw new apiError(400, "You cannot delete your own account");

  const existing = await prisma.user.findFirst({ where: { id: employeeId, companyId } });
  if (!existing) throw new apiError(404, "Employee not found");

  await prisma.user.delete({ where: { id: employeeId } });

  return new apiResponse(200, "Employee deleted successfully", true);
};
