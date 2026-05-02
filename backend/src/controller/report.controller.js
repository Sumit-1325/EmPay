import asyncHandler from "../utils/async-handler.js";
import { generateSalaryStatementReport } from "../services/report.service.js";

export const getSalaryStatementController = asyncHandler(async (req, res) => {
  const { employeeId, year } = req.query;

  if (!employeeId || !year) {
    return res.status(400).send("<h2>Missing required query parameters: employeeId, year</h2>");
  }

  const html = await generateSalaryStatementReport(
    req.user.companyId,
    parseInt(employeeId),
    parseInt(year)
  );

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
});
