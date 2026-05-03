import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Count Mon–Fri working days in a given month. */
export const countWorkingDays = (year, month) => {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
};

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Computes payable days breakdown for an employee in a month.
 * Returns { payableDays, presentCount, halfCount, paidLeaveDays, unpaidLeaveDays }
 */
export const computePayableDays = async (userId, companyId, month, year) => {
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`);
  const end   = new Date(month === 12
    ? `${year + 1}-01-01T00:00:00.000Z`
    : `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00.000Z`);

  const [attendance, approvedLeaves] = await Promise.all([
    prisma.attendance.findMany({ where: { userId, companyId, date: { gte: start, lt: end } } }),
    prisma.leaveRequest.findMany({
      where: { userId, companyId, status: "APPROVED", startDate: { lt: end }, endDate: { gte: start } },
    }),
  ]);

  // Build paid-leave date set (weekdays only)
  const paidLeaveDates  = new Set();
  const unpaidLeaveDates = new Set();
  for (const leave of approvedLeaves) {
    const cursor = new Date(leave.startDate);
    while (cursor <= leave.endDate) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        const key = cursor.toISOString().split("T")[0];
        leave.isPaid ? paidLeaveDates.add(key) : unpaidLeaveDates.add(key);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  let payableDays  = 0;
  let presentCount = 0;
  let halfCount    = 0;
  const attendanceDates = new Set();

  for (const rec of attendance) {
    const key = new Date(rec.date).toISOString().split("T")[0];
    attendanceDates.add(key);
    if (rec.status === "PRESENT")  { payableDays += 1;   presentCount++; }
    if (rec.status === "HALF_DAY") { payableDays += 0.5; halfCount++; }
    if (rec.status === "LEAVE" && paidLeaveDates.has(key)) payableDays += 1;
  }

  // Paid leave days with no attendance record still count
  for (const d of paidLeaveDates) {
    if (!attendanceDates.has(d)) payableDays += 1;
  }

  const paidLeaveDays   = paidLeaveDates.size;
  const unpaidLeaveDays = unpaidLeaveDates.size;

  return { payableDays: r2(payableDays), presentCount, halfCount, paidLeaveDays, unpaidLeaveDays };
};

/**
 * Computes all payslip fields for one employee given company config.
 * Does NOT save to DB — returns a plain object.
 */
export const computePayslipObject = (employee, company, totalWorkingDays, attendanceSummary) => {
  const { payableDays, presentCount, halfCount, paidLeaveDays, unpaidLeaveDays } = attendanceSummary;

  const factor        = totalWorkingDays > 0 ? payableDays / totalWorkingDays : 0;
  const basicProrated = r2(employee.basicSalary * factor);

  const hra              = r2(basicProrated * (company.hraPercent               / 100));
  const standardAllow    = r2(basicProrated * (company.standardAllowancePercent / 100));
  const performanceBonus = r2(basicProrated * (company.performanceBonusPercent  / 100));
  const lta              = r2(basicProrated * (company.ltaPercent               / 100));
  const fixedAllowance   = r2(basicProrated * (company.fixedAllowancePercent    / 100));

  const grossPay = r2(basicProrated + hra + standardAllow + performanceBonus + lta + fixedAllowance);

  const pfRate       = employee.pfRate ?? 12;
  const pfEmployee   = r2(basicProrated * (pfRate / 100));
  const pfEmployer   = pfEmployee;
  const professionalTax = r2(company.professionalTaxAmount);
  const tds          = 0;
  const totalDeductions = r2(pfEmployee + professionalTax + tds);

  const netPay      = r2(grossPay - totalDeductions);
  const employerCost = r2(grossPay + pfEmployer);

  return {
    basicSalary:       basicProrated,
    hra,
    standardAllowance: standardAllow,
    performanceBonus,
    lta,
    fixedAllowance,
    grossPay,
    pfEmployee,
    pfEmployer,
    professionalTax,
    tds,
    totalDeductions,
    netPay,
    employerCost,
    totalWorkingDays,
    payableDays,
    attendancePresent: presentCount,
    attendanceHalf:    halfCount,
    paidLeaveDays,
    unpaidLeaveDays,
  };
};

// ─── Service functions ────────────────────────────────────────────────────────

/** POST /payroll/run — process all employees for a given month/year */
export const runPayroll = async (companyId, month, year) => {
  const m = parseInt(month);
  const y = parseInt(year);

  const [company, employees] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.user.findMany({
      where: { companyId, role: { not: "SUPER_ADMIN" } },
      select: { id: true, firstName: true, lastName: true, loginId: true, basicSalary: true, pfRate: true },
    }),
  ]);

  if (!company) throw new apiError(404, "Company not found");

  const totalWorkingDays = countWorkingDays(y, m);
  const results = [];
  const errors  = [];

  for (const emp of employees) {
    if (!emp.basicSalary) {
      errors.push({ employee: `${emp.firstName} ${emp.lastName} (${emp.loginId})`, reason: "No basic salary set" });
      continue;
    }

    // Skip if payslip already exists for this month/year
    const existing = await prisma.payslip.findUnique({
      where: { userId_month_year: { userId: emp.id, month: m, year: y } },
    });
    if (existing) {
      errors.push({ employee: `${emp.firstName} ${emp.lastName} (${emp.loginId})`, reason: `Payslip for ${m}/${y} already exists` });
      continue;
    }

    const summary = await computePayableDays(emp.id, companyId, m, y);
    const data    = computePayslipObject(emp, company, totalWorkingDays, summary);

    const payslip = await prisma.payslip.create({
      data: { companyId, userId: emp.id, month: m, year: y, ...data },
    });

    results.push({
      employee: `${emp.firstName} ${emp.lastName} (${emp.loginId})`,
      payslipId: payslip.id,
      netPay:    payslip.netPay,
      payableDays: payslip.payableDays,
    });
  }

  const totalNet          = r2(results.reduce((s, r) => s + r.netPay, 0));
  const totalEmployerCost = 0; // fetched separately if needed

  return new apiResponse(201, "Payroll run complete", {
    month: m,
    year: y,
    employeesProcessed: results.length,
    totalNet,
    results,
    errors,
  });
};

export const listPayslips = async ({ companyId, userId, role, year, month }) => {
  const where = { companyId };
  if (role === "EMPLOYEE") where.userId = userId;
  if (year)  where.year  = parseInt(year);
  if (month) where.month = parseInt(month);

  const payslips = await prisma.payslip.findMany({
    where,
    include: { user: { select: { id: true, firstName: true, lastName: true, loginId: true, avatarUrl: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return new apiResponse(200, "Payslips fetched successfully", { payslips, total: payslips.length });
};

export const getPayslip = async (companyId, payslipId, userId, role) => {
  const payslip = await prisma.payslip.findFirst({
    where:   { id: payslipId, companyId },
    include: {
      user:    { select: { id: true, firstName: true, lastName: true, loginId: true, email: true, jobTitle: true, joiningDate: true, pfNumber: true, uanNumber: true, panNumber: true, bankAccountNumber: true, bankName: true, ifscCode: true } },
      company: { select: { name: true, code: true, logoUrl: true } },
    },
  });
  if (!payslip) throw new apiError(404, "Payslip not found");

  if (role === "EMPLOYEE" && payslip.userId !== userId) {
    throw new apiError(403, "You can only view your own payslips");
  }

  return new apiResponse(200, "Payslip fetched successfully", { payslip });
};

export const listPayruns = async (companyId) => {
  const rows = await prisma.payslip.groupBy({
    by:      ["year", "month"],
    where:   { companyId },
    _count:  { id: true },
    _sum:    { netPay: true, employerCost: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const payruns = rows.map((r) => ({
    year:          r.year,
    month:         r.month,
    label:         new Date(r.year, r.month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" }),
    payslipCount:  r._count.id,
    totalNet:      r2(r._sum.netPay     ?? 0),
    totalCost:     r2(r._sum.employerCost ?? 0),
  }));

  return new apiResponse(200, "Payruns fetched", { payruns });
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

export const getPayrollDashboard = async (companyId) => {
  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [totalEmployees, missingBank, missingManager, recentPayslips, monthlyCostRaw] = await Promise.all([
    // Only EMPLOYEE role — admins/HR don't need managers or bank warnings
    prisma.user.count({ where: { companyId, role: "EMPLOYEE" } }),

    prisma.user.count({ where: { companyId, role: "EMPLOYEE", bankAccountNumber: null } }),

    prisma.user.count({ where: { companyId, role: "EMPLOYEE", managerId: null } }),

    prisma.payslip.findMany({
      where:   { companyId },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      take:    10,
      include: { user: { select: { id: true, firstName: true, lastName: true, loginId: true, avatarUrl: true } } },
    }),

    prisma.payslip.groupBy({
      by:    ["year", "month"],
      where: { companyId, year: { gte: currentYear - 1 } },
      _sum:  { employerCost: true },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    }),
  ]);

  const headcountRaw = await prisma.user.findMany({
    where: {
      companyId,
      role:        { not: "SUPER_ADMIN" },
      joiningDate: { gte: new Date(`${currentYear - 1}-${String(currentMonth).padStart(2, "0")}-01`) },
    },
    select: { joiningDate: true },
  });

  const headcountMap = {};
  for (const u of headcountRaw) {
    const d   = new Date(u.joiningDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    headcountMap[key] = (headcountMap[key] ?? 0) + 1;
  }

  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }) });
  }

  const costByMonth = months.map(({ year, month, label }) => {
    const found = monthlyCostRaw.find((r) => r.year === year && r.month === month);
    return { label, amount: r2(found?._sum?.employerCost ?? 0) };
  });

  const joiningByMonth = months.map(({ year, month, label }) => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    return { label, count: headcountMap[key] ?? 0 };
  });

  return new apiResponse(200, "Dashboard data fetched", {
    summary: { totalEmployees, missingBank, missingManager },
    recentPayslips,
    costByMonth,
    joiningByMonth,
  });
};

// ─── Payslip PDF (HTML) ───────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/** Converts a number to Indian words (crore/lakh/thousand aware). */
function toWords(n) {
  if (n === 0) return "Zero";
  const units = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
                 "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
                 "Seventeen","Eighteen","Nineteen"];
  const tens  = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  function below100(n) {
    if (n < 20) return units[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
  }
  function below1000(n) {
    if (n < 100) return below100(n);
    return units[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + below100(n % 100) : "");
  }
  function convert(n) {
    if (n < 1000)   return below1000(n);
    if (n < 100000) return below1000(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + below1000(n % 1000) : "");
    if (n < 10000000) return below1000(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return below1000(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }
  return convert(Math.floor(n));
}

const fmt = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export const generatePayslipHtml = async (companyId, payslipId, userId, role) => {
  const ps = await prisma.payslip.findFirst({
    where:   { id: payslipId, companyId },
    include: {
      user:    true,
      company: true,
    },
  });
  if (!ps) throw new apiError(404, "Payslip not found");
  if (role === "EMPLOYEE" && ps.userId !== userId) throw new apiError(403, "Forbidden");

  const emp = ps.user;
  const co  = ps.company;
  const monthName = MONTHS[ps.month - 1];
  const netWords  = toWords(Math.round(ps.netPay));

  const earnings = [
    { label: "Basic Salary",         amount: ps.basicSalary },
    { label: "HRA",                   amount: ps.hra },
    { label: "Standard Allowance",    amount: ps.standardAllowance },
    { label: "Performance Bonus",     amount: ps.performanceBonus },
    { label: "Leave Travel Allowance",amount: ps.lta },
    { label: "Fixed Allowance",       amount: ps.fixedAllowance },
  ];
  const deductions = [
    { label: "PF (Employee)",   amount: ps.pfEmployee },
    { label: "PF (Employer)",   amount: ps.pfEmployer },
    { label: "Professional Tax",amount: ps.professionalTax },
    ...(ps.tds ? [{ label: "TDS", amount: ps.tds }] : []),
  ];

  const earningRows  = earnings.map((e)  => `<tr><td>${e.label}</td><td class="amt">${fmt(e.amount)}</td></tr>`).join("");
  const deductRows   = deductions.map((d) => `<tr><td>${d.label}</td><td class="amt">${fmt(d.amount)}</td></tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Payslip – ${monthName} ${ps.year}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; }
  .company-name { font-size: 20px; font-weight: 700; color: #6366f1; }
  .payslip-title { font-size: 15px; font-weight: 600; text-align: right; color: #333; }
  .payslip-period { font-size: 12px; color: #666; margin-top: 4px; }

  /* Employee info grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .info-item { display: flex; flex-direction: column; }
  .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .info-value { font-weight: 600; color: #0f172a; }

  /* Attendance summary */
  .attendance-row { display: flex; gap: 12px; margin-bottom: 20px; }
  .att-box { flex: 1; background: #f1f5f9; border-radius: 8px; padding: 10px 14px; text-align: center; }
  .att-num { font-size: 18px; font-weight: 700; color: #6366f1; }
  .att-lbl { font-size: 10px; color: #64748b; margin-top: 2px; }

  /* Earnings / Deductions tables */
  .tables { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6366f1; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #6366f1; color: #fff; text-align: left; padding: 6px 10px; font-size: 11px; }
  td { padding: 5px 10px; border-bottom: 1px solid #e2e8f0; }
  td.amt { text-align: right; }
  tr:last-child td { border-bottom: none; }

  /* Totals */
  .totals { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .total-box { background: #6366f1; color: #fff; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
  .total-box.deduct { background: #ef4444; }
  .total-label { font-size: 11px; opacity: .85; }
  .total-amt { font-size: 16px; font-weight: 700; }

  /* Net pay banner */
  .net-banner { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #fff; border-radius: 10px; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .net-label { font-size: 13px; opacity: .85; }
  .net-amt { font-size: 24px; font-weight: 700; }
  .net-words { font-size: 11px; opacity: .75; margin-top: 4px; }

  /* Bank / employer cost */
  .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .footer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
  .footer-box .section-title { margin-bottom: 6px; }

  @media print { body { background: #fff; } .page { padding: 16px; } }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">${co.name}</div>
      <div style="color:#64748b;margin-top:4px;">Code: ${co.code}</div>
    </div>
    <div>
      <div class="payslip-title">PAYSLIP</div>
      <div class="payslip-period">${monthName} ${ps.year}</div>
    </div>
  </div>

  <!-- Employee Info -->
  <div class="info-grid">
    <div class="info-item"><span class="info-label">Employee Name</span><span class="info-value">${emp.firstName ?? ""} ${emp.lastName ?? ""}</span></div>
    <div class="info-item"><span class="info-label">Login ID</span><span class="info-value">${emp.loginId}</span></div>
    <div class="info-item"><span class="info-label">Designation</span><span class="info-value">${emp.jobTitle ?? emp.role}</span></div>
    <div class="info-item"><span class="info-label">Date of Joining</span><span class="info-value">${emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN") : "—"}</span></div>
    <div class="info-item"><span class="info-label">PAN</span><span class="info-value">${emp.panNumber ?? "—"}</span></div>
    <div class="info-item"><span class="info-label">UAN</span><span class="info-value">${emp.uanNumber ?? "—"}</span></div>
    <div class="info-item"><span class="info-label">PF Number</span><span class="info-value">${emp.pfNumber ?? "—"}</span></div>
    <div class="info-item"><span class="info-label">Bank Account</span><span class="info-value">${emp.bankAccountNumber ?? "—"}</span></div>
  </div>

  <!-- Attendance -->
  <div class="attendance-row">
    <div class="att-box"><div class="att-num">${ps.totalWorkingDays}</div><div class="att-lbl">Working Days</div></div>
    <div class="att-box"><div class="att-num">${ps.payableDays}</div><div class="att-lbl">Payable Days</div></div>
    <div class="att-box"><div class="att-num">${ps.attendancePresent ?? 0}</div><div class="att-lbl">Present</div></div>
    <div class="att-box"><div class="att-num">${ps.attendanceHalf ?? 0}</div><div class="att-lbl">Half Days</div></div>
    <div class="att-box"><div class="att-num">${ps.paidLeaveDays ?? 0}</div><div class="att-lbl">Paid Leave</div></div>
    <div class="att-box"><div class="att-num">${ps.unpaidLeaveDays ?? 0}</div><div class="att-lbl">Unpaid Leave</div></div>
  </div>

  <!-- Earnings & Deductions -->
  <div class="tables">
    <div>
      <div class="section-title">Earnings</div>
      <table><thead><tr><th>Component</th><th>Amount</th></tr></thead>
      <tbody>${earningRows}</tbody></table>
    </div>
    <div>
      <div class="section-title">Deductions</div>
      <table><thead><tr><th>Component</th><th>Amount</th></tr></thead>
      <tbody>${deductRows}</tbody></table>
    </div>
  </div>

  <!-- Totals -->
  <div class="totals">
    <div class="total-box"><div><div class="total-label">Gross Pay</div></div><div class="total-amt">${fmt(ps.grossPay)}</div></div>
    <div class="total-box deduct"><div><div class="total-label">Total Deductions</div></div><div class="total-amt">${fmt(ps.totalDeductions)}</div></div>
  </div>

  <!-- Net Pay -->
  <div class="net-banner">
    <div>
      <div class="net-label">Net Pay (Take Home)</div>
      <div class="net-words">${netWords} Rupees Only</div>
    </div>
    <div class="net-amt">${fmt(ps.netPay)}</div>
  </div>

  <!-- Bank & Employer Cost -->
  <div class="footer-grid">
    <div class="footer-box">
      <div class="section-title">Bank Details</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <span>${emp.bankName ?? "—"}</span>
        <span>A/C: ${emp.bankAccountNumber ?? "—"}</span>
        <span>IFSC: ${emp.ifscCode ?? "—"}</span>
      </div>
    </div>
    <div class="footer-box">
      <div class="section-title">Employer Cost</div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        <span>Gross Pay</span><span>${fmt(ps.grossPay)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        <span>Employer PF</span><span>${fmt(ps.pfEmployer)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-weight:700;border-top:1px solid #e2e8f0;padding-top:8px;">
        <span>Total Cost</span><span>${fmt(ps.employerCost)}</span>
      </div>
    </div>
  </div>

  <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:10px;">
    This is a system-generated payslip and does not require a signature. · Generated by EmPay HRMS
  </div>
</div>
</body>
</html>`;

  return html;
};
