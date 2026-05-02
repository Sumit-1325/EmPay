import asyncHandler from "../utils/async-handler.js";
import {
  listPayslips,
  getPayslip,
  runPayroll,
  listPayruns,
  markPayslipPaid,
  getPayrollDashboard,
  generatePayslipHtml,
} from "../services/payroll.service.js";

export const listPayslipsController = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const result = await listPayslips({ companyId: req.user.companyId, userId: req.user.id, role: req.user.role, year, month });
  return res.status(result.statusCode).json(result);
});

export const getPayslipController = asyncHandler(async (req, res) => {
  const result = await getPayslip(req.user.companyId, parseInt(req.params.id), req.user.id, req.user.role);
  return res.status(result.statusCode).json(result);
});

export const runPayrollController = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  const result = await runPayroll(req.user.companyId, month, year);
  return res.status(result.statusCode).json(result);
});

export const listPayrunsController = asyncHandler(async (req, res) => {
  const result = await listPayruns(req.user.companyId);
  return res.status(result.statusCode).json(result);
});

export const getDashboardController = asyncHandler(async (req, res) => {
  const result = await getPayrollDashboard(req.user.companyId);
  return res.status(result.statusCode).json(result);
});

export const markPayslipPaidController = asyncHandler(async (req, res) => {
  const result = await markPayslipPaid(req.user.companyId, parseInt(req.params.id));
  return res.status(result.statusCode).json(result);
});

export const getPayslipPdfController = asyncHandler(async (req, res) => {
  const html = await generatePayslipHtml(
    req.user.companyId,
    parseInt(req.params.id),
    req.user.id,
    req.user.role,
  );
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});
