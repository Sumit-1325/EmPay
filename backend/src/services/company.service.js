import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";

const COMPANY_SELECT = {
  id: true, name: true, code: true, logoUrl: true,
  standardHours: true, workStartTime: true, workEndTime: true,
  breakTimeHours: true,
  createdAt: true,
  hraPercent: true, standardAllowancePercent: true, performanceBonusPercent: true,
  ltaPercent: true, fixedAllowancePercent: true, professionalTaxAmount: true,
};

/** Parses "HH:MM" → decimal hours (e.g. "09:30" → 9.5). */
const parseTime = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
};

/** Validates "HH:MM" string format. */
const isValidTime = (t) => /^\d{2}:\d{2}$/.test(t);

export const getCompanySettings = async (companyId) => {
  const company = await prisma.company.findUnique({
    where:  { id: companyId },
    select: COMPANY_SELECT,
  });
  if (!company) throw new apiError(404, "Company not found");
  return new apiResponse(200, "Company settings fetched", { company });
};

export const updateCompanyLogo = async (companyId, localFilePath) => {
  if (!localFilePath) throw new apiError(400, "No file uploaded");

  const { uploadToCloudinary, deleteFromCloudinary } = await import("../utils/cloudinary.js");

  const existing = await prisma.company.findUnique({ where: { id: companyId }, select: { logoUrl: true } });
  if (!existing) throw new apiError(404, "Company not found");

  if (existing.logoUrl) await deleteFromCloudinary(existing.logoUrl).catch(() => {});

  const uploadResult = await uploadToCloudinary(localFilePath);
  const logoUrl = uploadResult.data;

  const company = await prisma.company.update({
    where:  { id: companyId },
    data:   { logoUrl },
    select: COMPANY_SELECT,
  });

  return new apiResponse(200, "Company logo updated", { company });
};

export const updateCompanySettings = async (companyId, data) => {
  const {
    workStartTime, workEndTime, breakTimeHours,
    hraPercent, standardAllowancePercent, performanceBonusPercent,
    ltaPercent, fixedAllowancePercent, professionalTaxAmount,
  } = data;

  if (workStartTime && !isValidTime(workStartTime))
    throw new apiError(400, "workStartTime must be in HH:MM format");
  if (workEndTime && !isValidTime(workEndTime))
    throw new apiError(400, "workEndTime must be in HH:MM format");

  // Fetch existing values so we can compute standardHours with whichever side changed
  const existing = await prisma.company.findUnique({
    where:  { id: companyId },
    select: { workStartTime: true, workEndTime: true },
  });
  if (!existing) throw new apiError(404, "Company not found");

  const start = workStartTime ?? existing.workStartTime;
  const end   = workEndTime   ?? existing.workEndTime;

  const computed = parseTime(end) - parseTime(start);
  if (computed <= 0) throw new apiError(400, "Work end time must be after start time");

  const standardHours = Math.round(computed * 100) / 100;

  const company = await prisma.company.update({
    where: { id: companyId },
    data: {
      ...(workStartTime && { workStartTime }),
      ...(workEndTime   && { workEndTime }),
      standardHours,
      ...(breakTimeHours           != null && { breakTimeHours:           parseFloat(breakTimeHours) }),
      ...(hraPercent               != null && { hraPercent:               parseFloat(hraPercent) }),
      ...(standardAllowancePercent != null && { standardAllowancePercent: parseFloat(standardAllowancePercent) }),
      ...(performanceBonusPercent  != null && { performanceBonusPercent:  parseFloat(performanceBonusPercent) }),
      ...(ltaPercent               != null && { ltaPercent:               parseFloat(ltaPercent) }),
      ...(fixedAllowancePercent    != null && { fixedAllowancePercent:    parseFloat(fixedAllowancePercent) }),
      ...(professionalTaxAmount    != null && { professionalTaxAmount:    parseFloat(professionalTaxAmount) }),
    },
    select: COMPANY_SELECT,
  });

  return new apiResponse(200, "Company settings updated", { company });
};
