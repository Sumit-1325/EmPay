import asyncHandler from "../utils/async-handler.js";
import {
  listAttendance,
  getAttendanceSummary,
  checkIn,
  checkOut,
  updateAttendance,
} from "../services/attendance.service.js";

export const listAttendanceController = asyncHandler(async (req, res) => {
  const { date, month, year } = req.query;
  const result = await listAttendance({
    companyId: req.user.companyId,
    userId:    req.user.id,
    role:      req.user.role,
    date,
    month,
    year,
  });
  return res.status(result.statusCode).json(result);
});

export const attendanceSummaryController = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const result = await getAttendanceSummary({
    companyId: req.user.companyId,
    userId:    req.user.id,
    month,
    year,
  });
  return res.status(result.statusCode).json(result);
});

export const checkInController = asyncHandler(async (req, res) => {
  const result = await checkIn({ companyId: req.user.companyId, userId: req.user.id });
  return res.status(result.statusCode).json(result);
});

export const checkOutController = asyncHandler(async (req, res) => {
  const result = await checkOut({ companyId: req.user.companyId, userId: req.user.id });
  return res.status(result.statusCode).json(result);
});

export const updateAttendanceController = asyncHandler(async (req, res) => {
  const result = await updateAttendance(req.user.companyId, parseInt(req.params.id), req.body);
  return res.status(result.statusCode).json(result);
});
