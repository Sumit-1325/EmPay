import asyncHandler from "../utils/async-handler.js";
import { listLeaveRequests, createLeaveRequest, approveLeaveRequest, deleteLeaveRequest } from "../services/leave.service.js";

export const listLeaveController = asyncHandler(async (req, res) => {
  const result = await listLeaveRequests({ companyId: req.user.companyId, userId: req.user.id, role: req.user.role });
  return res.status(result.statusCode).json(result);
});

export const createLeaveController = asyncHandler(async (req, res) => {
  const result = await createLeaveRequest({ companyId: req.user.companyId, userId: req.user.id }, req.body);
  return res.status(result.statusCode).json(result);
});

export const approveLeaveController = asyncHandler(async (req, res) => {
  const action = req.params.action; // "approve" or "reject"
  const result = await approveLeaveRequest(req.user.companyId, parseInt(req.params.id), req.user.id, action);
  return res.status(result.statusCode).json(result);
});

export const deleteLeaveController = asyncHandler(async (req, res) => {
  const result = await deleteLeaveRequest(req.user.companyId, parseInt(req.params.id), req.user.id, req.user.role);
  return res.status(result.statusCode).json(result);
});
