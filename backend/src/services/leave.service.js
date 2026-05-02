import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";

export const listLeaveRequests = async ({ companyId, userId, role }) => {
  const where = { companyId };
  if (role === "EMPLOYEE") where.userId = userId;

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: { user: { select: { id: true, firstName: true, lastName: true, loginId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return new apiResponse(200, "Leave requests fetched successfully", { requests, total: requests.length });
};

export const createLeaveRequest = async ({ companyId, userId }, data) => {
  const { leaveType, startDate, endDate, reason, isPaid = true } = data;

  if (new Date(startDate) > new Date(endDate)) {
    throw new apiError(400, "Start date must be before or equal to end date");
  }

  const request = await prisma.leaveRequest.create({
    data: {
      companyId,
      userId,
      leaveType,
      startDate: new Date(startDate),
      endDate:   new Date(endDate),
      reason:    reason ?? null,
      isPaid:    Boolean(isPaid),
      status:    "PENDING",
    },
  });

  return new apiResponse(201, "Leave request submitted successfully", { request });
};

export const approveLeaveRequest = async (companyId, requestId, approverId, action) => {
  const request = await prisma.leaveRequest.findFirst({ where: { id: requestId, companyId } });
  if (!request)                      throw new apiError(404, "Leave request not found");
  if (request.status !== "PENDING")  throw new apiError(400, "Only pending requests can be actioned");

  const updated = await prisma.leaveRequest.update({
    where: { id: requestId },
    data:  { status: action === "approve" ? "APPROVED" : "REJECTED", approvedBy: approverId },
  });

  return new apiResponse(200, `Leave request ${updated.status.toLowerCase()} successfully`, { request: updated });
};

export const deleteLeaveRequest = async (companyId, requestId, userId, role) => {
  const request = await prisma.leaveRequest.findFirst({ where: { id: requestId, companyId } });
  if (!request) throw new apiError(404, "Leave request not found");

  // Employees can only delete their own pending requests
  if (role === "EMPLOYEE" && (request.userId !== userId || request.status !== "PENDING")) {
    throw new apiError(403, "You can only cancel your own pending leave requests");
  }

  await prisma.leaveRequest.delete({ where: { id: requestId } });

  return new apiResponse(200, "Leave request deleted successfully", true);
};
