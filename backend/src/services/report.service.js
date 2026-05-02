import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function inr(n) {
  if (n == null || n === 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;
}

// Build a 12-value array + total from payslip map
function monthRow(slipMap, field) {
  let total = 0;
  const cells = Array.from({ length: 12 }, (_, i) => {
    const slip = slipMap[i + 1];
    const v = slip ? (slip[field] ?? 0) : null;
    if (v) total += v;
    return v == null ? null : v;
  });
  return { cells, total };
}

function renderRow(label, { cells, total }, bold = false) {
  const style = bold ? 'font-weight:700;background:#f8f8f8;' : '';
  const cols = cells.map(v =>
    `<td style="text-align:right;padding:5px 10px;border:1px solid #ddd;${style}">${v == null ? '<span style="color:#bbb">—</span>' : inr(v)}</td>`
  ).join("");
  return `
    <tr>
      <td style="padding:5px 10px;border:1px solid #ddd;white-space:nowrap;${style}">${label}</td>
      ${cols}
      <td style="text-align:right;padding:5px 10px;border:1px solid #ddd;font-weight:700;${style}">${total ? inr(total) : '—'}</td>
    </tr>`;
}

function sectionHeader(label, colspan) {
  return `
    <tr>
      <td colspan="${colspan}" style="padding:6px 10px;background:#4f46e5;color:#fff;font-weight:700;font-size:13px;letter-spacing:.5px;border:1px solid #4f46e5;">
        ${label}
      </td>
    </tr>`;
}

// ─── Main service ─────────────────────────────────────────────────────────────

export const generateSalaryStatementReport = async (companyId, employeeId, year) => {
  // 1. Fetch employee (must belong to same company)
  const employee = await prisma.user.findFirst({
    where: { id: parseInt(employeeId), companyId },
    include: { company: true },
  });
  if (!employee) throw new apiError(404, "Employee not found in this company");

  // 2. Fetch all payslips for the year
  const payslips = await prisma.payslip.findMany({
    where: { userId: parseInt(employeeId), companyId, year: parseInt(year) },
    orderBy: { month: "asc" },
  });

  // Build month → slip map (1-indexed)
  const slipMap = {};
  for (const s of payslips) slipMap[s.month] = s;

  // 3. Effective-from date: first payslip month in DB or joiningDate
  let effectiveFrom = employee.joiningDate;
  const firstPayslip = await prisma.payslip.findFirst({
    where: { userId: parseInt(employeeId), companyId },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
  if (firstPayslip) {
    effectiveFrom = new Date(firstPayslip.year, firstPayslip.month - 1, 1);
  }

  // 4. Build component rows (14 columns: label + 12 months + total)
  const colspan = 14;

  const earnRows = [
    ["Basic Salary",          monthRow(slipMap, "basicSalary")],
    ["House Rent Allowance",  monthRow(slipMap, "hra")],
    ["Standard Allowance",    monthRow(slipMap, "standardAllowance")],
    ["Performance Bonus",     monthRow(slipMap, "performanceBonus")],
    ["LTA",                   monthRow(slipMap, "lta")],
    ["Fixed Allowance",       monthRow(slipMap, "fixedAllowance")],
    ["Gross Pay",             monthRow(slipMap, "grossPay")],
  ];

  const dedRows = [
    ["PF (Employee)",         monthRow(slipMap, "pfEmployee")],
    ["PF (Employer)",         monthRow(slipMap, "pfEmployer")],
    ["Professional Tax",      monthRow(slipMap, "professionalTax")],
    ["TDS",                   monthRow(slipMap, "tds")],
    ["Total Deductions",      monthRow(slipMap, "totalDeductions")],
  ];

  const netRow = monthRow(slipMap, "netPay");
  const yearlyNet = netRow.total;
  const yearlyGross = monthRow(slipMap, "grossPay").total;
  const yearlyDed   = monthRow(slipMap, "totalDeductions").total;

  const companyName = employee.company?.name ?? "—";
  const logoUrl     = employee.company?.logoUrl ?? null;
  const empName     = [employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.loginId;
  const ROLE_LABEL = { ADMIN: "Admin", HR_OFFICER: "HR Officer", PAYROLL_OFFICER: "Payroll Officer", EMPLOYEE: "Employee" };
  const designation = ROLE_LABEL[employee.role] ?? employee.role ?? "—";

  const noData = payslips.length === 0;

  // 5. Build HTML
  const thStyle = "padding:7px 10px;background:#4f46e5;color:#fff;text-align:right;border:1px solid #4f46e5;white-space:nowrap;font-size:12px;";
  const thFirst  = "padding:7px 10px;background:#4f46e5;color:#fff;text-align:left;border:1px solid #4f46e5;font-size:12px;";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Salary Statement — ${empName} (${year})</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #222;
      background: #f4f4f7;
      padding: 24px;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 16px rgba(0,0,0,.10);
      overflow: hidden;
    }
    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #fff;
      padding: 28px 36px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .header img { height: 56px; width: 56px; object-fit: contain; border-radius: 8px; background: #fff; padding: 4px; }
    .header-text h1 { font-size: 22px; font-weight: 700; letter-spacing: .3px; }
    .header-text p  { font-size: 13px; opacity: .82; margin-top: 2px; }
    /* ── Employee Info ── */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      border-bottom: 1px solid #e8e8e8;
    }
    .info-cell {
      padding: 16px 24px;
      border-right: 1px solid #e8e8e8;
    }
    .info-cell:last-child { border-right: none; }
    .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #888; font-weight: 600; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    /* ── Table ── */
    .table-wrap { padding: 24px 24px 0; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    /* ── Net Summary ── */
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 24px;
      margin-top: 8px;
    }
    .sum-card {
      border-radius: 8px;
      padding: 16px 20px;
      text-align: center;
    }
    .sum-card.gross { background: #eef2ff; border: 1px solid #c7d2fe; }
    .sum-card.ded   { background: #fef2f2; border: 1px solid #fecaca; }
    .sum-card.net   { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .sum-card .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: #666; }
    .sum-card .amount { font-size: 22px; font-weight: 800; margin-top: 6px; }
    .sum-card.gross .amount { color: #4f46e5; }
    .sum-card.ded   .amount { color: #ef4444; }
    .sum-card.net   .amount { color: #16a34a; }
    /* ── Footer ── */
    .footer {
      border-top: 1px solid #eee;
      padding: 14px 24px;
      text-align: right;
      font-size: 11px;
      color: #aaa;
    }
    .no-data {
      text-align: center;
      padding: 60px 24px;
      color: #888;
      font-size: 15px;
    }
    /* ── Print ── */
    @media print {
      body { background: #fff; padding: 0; }
      .container { box-shadow: none; border-radius: 0; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm; size: A3 landscape; }
    }
  </style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="${companyName} logo"/>` : ""}
    <div class="header-text">
      <h1>${companyName}</h1>
      <p>Salary Statement Report &mdash; Financial Year ${year}</p>
    </div>
    <div style="margin-left:auto;" class="no-print">
      <button onclick="window.print()" style="background:#fff;color:#4f46e5;border:none;padding:8px 18px;border-radius:6px;font-weight:700;cursor:pointer;font-size:13px;">
        🖨 Print
      </button>
    </div>
  </div>

  <!-- Employee Info -->
  <div class="info-grid">
    <div class="info-cell">
      <div class="info-label">Employee Name</div>
      <div class="info-value">${empName}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Designation</div>
      <div class="info-value">${designation}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Date of Joining</div>
      <div class="info-value">${fmtDate(employee.joiningDate)}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Salary Effective From</div>
      <div class="info-value">${fmtDate(effectiveFrom)}</div>
    </div>
  </div>

  ${noData ? `
  <div class="no-data">
    <p style="font-size:40px;margin-bottom:12px;">📭</p>
    <p>No payslips found for <strong>${empName}</strong> in <strong>${year}</strong>.</p>
  </div>
  ` : `
  <!-- Salary Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="${thFirst}">Component</th>
          ${MONTHS.map(m => `<th style="${thStyle}">${m}</th>`).join("")}
          <th style="${thStyle.replace("text-align:right","text-align:right;background:#312e81")}">Yearly Total</th>
        </tr>
      </thead>
      <tbody>
        ${sectionHeader("Earnings", colspan)}
        ${earnRows.map(([label, row], i) => renderRow(label, row, i === earnRows.length - 1)).join("")}
        ${sectionHeader("Deductions", colspan)}
        ${dedRows.map(([label, row], i) => renderRow(label, row, i === dedRows.length - 1)).join("")}
        ${sectionHeader("Net Pay", colspan)}
        ${renderRow("Net Pay", netRow, true)}
      </tbody>
    </table>
  </div>

  <!-- Summary Cards -->
  <div class="summary">
    <div class="sum-card gross">
      <div class="label">Total Gross Pay</div>
      <div class="amount">${inr(yearlyGross)}</div>
    </div>
    <div class="sum-card ded">
      <div class="label">Total Deductions</div>
      <div class="amount">${inr(yearlyDed)}</div>
    </div>
    <div class="sum-card net">
      <div class="label">Net Salary (Yearly)</div>
      <div class="amount">${inr(yearlyNet)}</div>
    </div>
  </div>
  `}

  <div class="footer">
    Generated on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} &nbsp;|&nbsp; EmPay HRMS
  </div>
</div>
</body>
</html>`;

  return html;
};
