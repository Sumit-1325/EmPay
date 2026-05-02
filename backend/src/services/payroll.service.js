import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Count Mon–Fri working days in a given month (excludes weekends). */
const countWorkingDays = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++; // 0=Sun, 6=Sat
  }
  return count;
};

/**
 * Computes payable days for an employee for a given month by reading:
 * - Attendance records (PRESENT = 1, HALF_DAY = 0.5, ABSENT/no-record = 0)
 * - Approved PAID leave requests (each approved paid leave day = 1 payable day)
 * - Unpaid leave days are already excluded (no attendance record = 0)
 */
const computePayableDays = async (userId, companyId, month, year) => {
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`);
  const end   = new Date(month === 12
    ? `${year + 1}-01-01T00:00:00.000Z`
    : `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00.000Z`);

  // Fetch all attendance records for this employee this month
  const attendance = await prisma.attendance.findMany({
    where: { userId, companyId, date: { gte: start, lt: end } },
  });

  // Fetch approved PAID leave requests that overlap this month
  const paidLeaves = await prisma.leaveRequest.findMany({
    where: {
      userId,
      companyId,
      status: "APPROVED",
      isPaid: true,
      startDate: { lt: end },
      endDate:   { gte: start },
    },
  });

  // Build a set of paid-leave dates so we can count payable leave days
  const paidLeaveDates = new Set();
  for (const leave of paidLeaves) {
    const cursor = new Date(leave.startDate);
    while (cursor <= leave.endDate) {
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) {                       // weekdays only
        const key = cursor.toISOString().split("T")[0];
        paidLeaveDates.add(key);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // Sum attendance contribution
  let payableDays = 0;
  const attendanceDates = new Set();

  for (const record of attendance) {
    const key = new Date(record.date).toISOString().split("T")[0];
    attendanceDates.add(key);

    if (record.status === "PRESENT")  payableDays += 1;
    if (record.status === "HALF_DAY") payableDays += 0.5;
    if (record.status === "LEAVE") {
      // LEAVE status: check if there's a paid leave for this date
      if (paidLeaveDates.has(key)) payableDays += 1;
    }
    // ABSENT = 0, no contribution
  }

  // Add paid leave days that have no attendance record (leave approved but no check-in)
  for (const leaveDate of paidLeaveDates) {
    if (!attendanceDates.has(leaveDate)) {
      payableDays += 1;
    }
  }

  return Math.round(payableDays * 100) / 100;
};

// ─── Service functions ────────────────────────────────────────────────────────

export const listPayslips = async ({ companyId, userId, role, year, month }) => {
  const where = { companyId };
  if (role === "EMPLOYEE") where.userId = userId;
  if (year)  where.year  = parseInt(year);
  if (month) where.month = parseInt(month);

  const payslips = await prisma.payslip.findMany({
    where,
    include: { user: { select: { id: true, firstName: true, lastName: true, loginId: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return new apiResponse(200, "Payslips fetched successfully", { payslips, total: payslips.length });
};

export const getPayslip = async (companyId, payslipId, userId, role) => {
  const payslip = await prisma.payslip.findFirst({ where: { id: payslipId, companyId } });
  if (!payslip) throw new apiError(404, "Payslip not found");

  if (role === "EMPLOYEE" && payslip.userId !== userId) {
    throw new apiError(403, "You can only view your own payslips");
  }

  return new apiResponse(200, "Payslip fetched successfully", { payslip });
};

export const createPayslip = async (companyId, data) => {
  const { userId, month, year, deductions = 0 } = data;
  const m = parseInt(month);
  const y = parseInt(year);

  // Validate employee belongs to company
  const employee = await prisma.user.findFirst({ where: { id: userId, companyId } });
  if (!employee) throw new apiError(404, "Employee not found in this company");
  if (!employee.basicSalary) {
    throw new apiError(400, "Employee has no basic salary set. Update the employee profile first.");
  }

  // Prevent duplicate payslip
  const existing = await prisma.payslip.findUnique({
    where: { userId_month_year: { userId, month: m, year: y } },
  });
  if (existing) throw new apiError(409, `Payslip for ${m}/${y} already exists for this employee`);

  // Auto-compute payable days from attendance + approved paid leaves
  const totalWorkingDays = countWorkingDays(y, m);
  const payableDays      = await computePayableDays(userId, companyId, m, y);

  // Per-day salary calculation
  const perDaySalary = employee.basicSalary / totalWorkingDays;
  const grossPay     = Math.round(perDaySalary * payableDays * 100) / 100;
  const netPay       = Math.round((grossPay - parseFloat(deductions)) * 100) / 100;

  const payslip = await prisma.payslip.create({
    data: {
      companyId,
      userId,
      month:            m,
      year:             y,
      basicSalary:      employee.basicSalary,
      totalWorkingDays,
      payableDays,
      deductions:       parseFloat(deductions),
      netPay,
    },
  });

  return new apiResponse(201, "Payslip created successfully", {
    payslip,
    breakdown: {
      basicSalary:      employee.basicSalary,
      totalWorkingDays,
      payableDays,
      perDaySalary:     Math.round(perDaySalary * 100) / 100,
      grossPay,
      deductions:       parseFloat(deductions),
      netPay,
    },
  });
};

export const markPayslipPaid = async (companyId, payslipId) => {
  const payslip = await prisma.payslip.findFirst({ where: { id: payslipId, companyId } });
  if (!payslip)       throw new apiError(404, "Payslip not found");
  if (payslip.paidAt) throw new apiError(400, "Payslip already marked as paid");

  const updated = await prisma.payslip.update({
    where: { id: payslipId },
    data:  { paidAt: new Date() },
  });

  return new apiResponse(200, "Payslip marked as paid", { payslip: updated });
};
