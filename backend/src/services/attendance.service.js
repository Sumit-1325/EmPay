import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns hours between two Date objects, rounded to 2 decimal places. */
const diffHours = (from, to) => Math.round(((to - from) / 36e5) * 100) / 100;

/**
 * Computes workHours and extraHours given checkIn, checkOut and the
 * company's configured standard hours per day.
 */
const computeHours = (checkIn, checkOut, standardHours) => {
  const workHours  = diffHours(checkIn, checkOut);
  const extraHours = Math.max(0, Math.round((workHours - standardHours) * 100) / 100);
  return { workHours, extraHours };
};

/** Returns start and end Date for a given month+year (UTC midnight). */
const monthRange = (year, month) => ({
  gte: new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`),
  lt:  new Date(month === 12
    ? `${year + 1}-01-01T00:00:00.000Z`
    : `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00.000Z`),
});

// ─── List ─────────────────────────────────────────────────────────────────────

export const listAttendance = async ({ companyId, userId, role, date, month, year }) => {
  const where = { companyId };

  // EMPLOYEE sees only own records
  if (role === "EMPLOYEE") where.userId = userId;

  // Filter: single date
  if (date) where.date = new Date(date);

  // Filter: full month (default = current month)
  if (!date) {
    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year  ? parseInt(year)  : now.getFullYear();
    where.date = monthRange(y, m);
  }

  const records = await prisma.attendance.findMany({
    where,
    include: { user: { select: { id: true, firstName: true, lastName: true, loginId: true } } },
    orderBy: { date: "desc" },
  });

  return new apiResponse(200, "Attendance fetched successfully", {
    attendance: records,
    total: records.length,
  });
};

// ─── Employee summary (for the employee's own month view) ─────────────────────

export const getAttendanceSummary = async ({ companyId, userId, month, year }) => {
  const now = new Date();
  const m   = month ? parseInt(month) : now.getMonth() + 1;
  const y   = year  ? parseInt(year)  : now.getFullYear();

  const records = await prisma.attendance.findMany({
    where: { companyId, userId, date: monthRange(y, m) },
  });

  const daysPresent  = records.filter(r => r.status === "PRESENT").length;
  const halfDays     = records.filter(r => r.status === "HALF_DAY").length;
  const leaveDays    = records.filter(r => r.status === "LEAVE").length;
  const absentDays   = records.filter(r => r.status === "ABSENT").length;
  const totalWorked  = records.reduce((sum, r) => sum + (r.workHours  ?? 0), 0);
  const totalExtra   = records.reduce((sum, r) => sum + (r.extraHours ?? 0), 0);

  return new apiResponse(200, "Attendance summary fetched", {
    month: m, year: y,
    daysPresent,
    halfDays,
    leaveDays,
    absentDays,
    totalWorkHours:  Math.round(totalWorked * 100) / 100,
    totalExtraHours: Math.round(totalExtra  * 100) / 100,
  });
};

// ─── Check In ─────────────────────────────────────────────────────────────────

export const checkIn = async ({ companyId, userId }) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (existing?.checkIn) throw new apiError(400, "Already checked in today");

  const now    = new Date();
  const record = existing
    ? await prisma.attendance.update({
        where: { id: existing.id },
        data:  { checkIn: now, status: "PRESENT" },
      })
    : await prisma.attendance.create({
        data: { companyId, userId, date: today, checkIn: now, status: "PRESENT" },
      });

  return new apiResponse(200, "Check-in recorded", {
    attendance: record,
    checkedInAt: now,
  });
};

// ─── Check Out ────────────────────────────────────────────────────────────────

export const checkOut = async ({ companyId, userId }) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const record = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
    include: { company: { select: { standardHours: true } } },
  });

  if (!record?.checkIn) throw new apiError(400, "No check-in found for today");
  if (record.checkOut)  throw new apiError(400, "Already checked out today");

  const now = new Date();
  const { workHours, extraHours } = computeHours(
    record.checkIn,
    now,
    record.company.standardHours,
  );

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data:  { checkOut: now, workHours, extraHours },
  });

  return new apiResponse(200, "Check-out recorded", {
    attendance:   updated,
    checkedOutAt: now,
    workHours,
    extraHours,
  });
};

// ─── Admin override ───────────────────────────────────────────────────────────

export const updateAttendance = async (companyId, attendanceId, data) => {
  const record = await prisma.attendance.findFirst({
    where:   { id: attendanceId, companyId },
    include: { company: { select: { standardHours: true } } },
  });
  if (!record) throw new apiError(404, "Attendance record not found");

  const newCheckIn  = data.checkIn  ? new Date(data.checkIn)  : record.checkIn;
  const newCheckOut = data.checkOut ? new Date(data.checkOut) : record.checkOut;

  // Recompute hours if both timestamps are now available
  let hours = {};
  if (newCheckIn && newCheckOut) {
    hours = computeHours(newCheckIn, newCheckOut, record.company.standardHours);
  }

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      ...(data.status   != null && { status:   data.status   }),
      ...(data.checkIn  != null && { checkIn:  newCheckIn    }),
      ...(data.checkOut != null && { checkOut: newCheckOut   }),
      ...hours,
    },
  });

  return new apiResponse(200, "Attendance updated successfully", { attendance: updated });
};
