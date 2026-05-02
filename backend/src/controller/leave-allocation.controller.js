import asyncHandler from "../utils/async-handler.js";
import { listAllocations, getMyAllocations, createAllocation, deleteAllocation } from "../services/leave-allocation.service.js";

export const getMyAllocationsController = asyncHandler(async (req, res) => {
  const result = await getMyAllocations(req.user.companyId, req.user.id);
  return res.status(result.statusCode).json(result);
});

export const listAllocationsController = asyncHandler(async (req, res) => {
  const result = await listAllocations(req.user.companyId);
  return res.status(result.statusCode).json(result);
});

export const createAllocationController = asyncHandler(async (req, res) => {
  const result = await createAllocation(req.user.companyId, req.user.id, req.body);
  return res.status(result.statusCode).json(result);
});

export const deleteAllocationController = asyncHandler(async (req, res) => {
  const result = await deleteAllocation(req.user.companyId, parseInt(req.params.id));
  return res.status(result.statusCode).json(result);
});
