import asyncHandler from "../utils/async-handler.js";
import { getCompanySettings, updateCompanySettings, updateCompanyLogo } from "../services/company.service.js";

export const getCompanySettingsController = asyncHandler(async (req, res) => {
  const result = await getCompanySettings(req.user.companyId);
  return res.status(result.statusCode).json(result);
});

export const updateCompanySettingsController = asyncHandler(async (req, res) => {
  const result = await updateCompanySettings(req.user.companyId, req.body);
  return res.status(result.statusCode).json(result);
});

export const updateCompanyLogoController = asyncHandler(async (req, res) => {
  const result = await updateCompanyLogo(req.user.companyId, req.file?.path);
  return res.status(result.statusCode).json(result);
});
