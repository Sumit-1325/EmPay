import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";

// ─── Get allocations for the current (logged-in) employee ────────────────────
export const getMyAllocations = async (companyId, userId) => {
  const today = new Date();
  const allocations = await prisma.leaveAllocation.findMany({
    where: {
      companyId,
      userId,
      startDate: { lte: today },      // allocation has started
      OR: [
        { endDate: null },             // no expiry
        { endDate: { gte: today } },   // not yet expired
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return new apiResponse(200, "My allocations fetched successfully", { allocations });
};

// ─── List all allocations for the company ────────────────────────────────────
export const listAllocations = async (companyId) => {
  const allocations = await prisma.leaveAllocation.findMany({
    where: { companyId },
    include: {
      user:    { select: { id: true, firstName: true, lastName: true, loginId: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return new apiResponse(200, "Leave allocations fetched successfully", { allocations, total: allocations.length });
};

// ─── Create a new allocation ─────────────────────────────────────────────────
export const createAllocation = async (companyId, createdBy, data) => {
  const { targetUserId, leaveType, startDate, endDate, days, note } = data;

  // Verify target employee belongs to same company
  const emp = await prisma.user.findFirst({ where: { id: parseInt(targetUserId), companyId } });
  if (!emp) throw new apiError(404, "Employee not found in this company");

  if (new Date(startDate) > new Date(endDate || "9999-12-31")) {
    throw new apiError(400, "Start date must be before or equal to end date");
  }

  if (Number(days) < 0) throw new apiError(400, "Allocated days cannot be negative");

  const allocation = await prisma.leaveAllocation.create({
    data: {
      companyId,
      userId:    parseInt(targetUserId),
      leaveType,
      startDate: new Date(startDate),
      endDate:   endDate ? new Date(endDate) : null,
      days:      parseInt(days),
      note:      note || null,
      createdBy,
    },
    include: {
      user:    { select: { id: true, firstName: true, lastName: true, loginId: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return new apiResponse(201, "Leave allocation created successfully", { allocation });
};

// ─── Delete an allocation ────────────────────────────────────────────────────
export const deleteAllocation = async (companyId, allocationId) => {
  const alloc = await prisma.leaveAllocation.findFirst({ where: { id: allocationId, companyId } });
  if (!alloc) throw new apiError(404, "Leave allocation not found");

  await prisma.leaveAllocation.delete({ where: { id: allocationId } });
  return new apiResponse(200, "Leave allocation deleted successfully", true);
};
