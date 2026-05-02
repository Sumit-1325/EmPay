import asyncHandler from "../utils/async-handler.js";
import { listPayslips, getPayslip, createPayslip, markPayslipPaid } from "../services/payroll.service.js";

export const listPayslipsController = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const result = await listPayslips({ companyId: req.user.companyId, userId: req.user.id, role: req.user.role, year, month });
  return res.status(result.statusCode).json(result);
});

export const getPayslipController = asyncHandler(async (req, res) => {
  const result = await getPayslip(req.user.companyId, parseInt(req.params.id), req.user.id, req.user.role);
  return res.status(result.statusCode).json(result);
});

export const createPayslipController = asyncHandler(async (req, res) => {
  const result = await createPayslip(req.user.companyId, req.body);
  return res.status(result.statusCode).json(result);
});

export const markPayslipPaidController = asyncHandler(async (req, res) => {
  const result = await markPayslipPaid(req.user.companyId, parseInt(req.params.id));
  return res.status(result.statusCode).json(result);
});
