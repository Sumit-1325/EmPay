import asyncHandler from "../utils/async-handler.js";
import { apiResponse } from "../utils/api-response.js";
import {
  registerCompany,
  changePassword,
  forgotPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAuthToken,
  resetPassword,
} from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const result = await registerCompany(req.body);
  return res.status(result.statusCode).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const { loginIdOrEmail, password } = req.body;
  const result = await loginUser(loginIdOrEmail, password);
  return res.status(result.statusCode).json(result);
});

export const logout = asyncHandler(async (req, res) => {
  const result = await logoutUser(req.user.id);
  return res.status(result.statusCode).json(result);
});

export const getCurrentUserController = asyncHandler(async (req, res) => {
  const result = await getCurrentUser(req.user.id);
  return res.status(result.statusCode).json(result);
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body.email);
  return res.status(result.statusCode).json(result);
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const token = req.params?.token || req.query?.token || req.body?.token;
  const result = await resetPassword(token, req.body.newPassword);
  return res.status(result.statusCode).json(result);
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const result = await changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
  return res.status(result.statusCode).json(result);
});

export const refreshTokenController = asyncHandler(async (req, res) => {
  const result = await refreshAuthToken(req.body?.refreshToken);
  return res.status(result.statusCode).json(result);
});

export const healthAuthController = asyncHandler(async (req, res) => {
  return res.status(200).json(new apiResponse(200, "Auth service is healthy", true));
});
