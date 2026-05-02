import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  changePasswordController,
  forgotPasswordController,
  getCurrentUserController,
  login,
  logout,
  refreshTokenController,
  resetPasswordController,
} from "../controller/auth.controller.js";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { validatorMiddleware } from "../middleware/validator.middleware.js";
import {
  registerValidators,
  changePasswordValidators,
  forgotPasswordValidators,
  loginValidators,
  resetPasswordValidators,
} from "../validators/auth.validator.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many password reset requests. Try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post("/register",       registerValidators(),  validatorMiddleware, register);
router.post("/login",          loginLimiter,          loginValidators(),          validatorMiddleware, login);
router.post("/forgot-password",forgotPasswordLimiter, forgotPasswordValidators(), validatorMiddleware, forgotPasswordController);
router.post("/reset-password",                        resetPasswordValidators(),  validatorMiddleware, resetPasswordController);
router.post("/reset-password/:token",                 resetPasswordValidators(),  validatorMiddleware, resetPasswordController);
router.post("/refresh-token",                                                                          refreshTokenController);

// Protected — exempt from mustChangePasswordGuard
router.post("/logout",           verifyJWT, logout);
router.get( "/me",               verifyJWT, getCurrentUserController);
router.put( "/change-password",  verifyJWT, changePasswordValidators(), validatorMiddleware, changePasswordController);

export default router;
