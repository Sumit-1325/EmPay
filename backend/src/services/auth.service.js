import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../utils/mail.util.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { generateTemporaryToken } from "../utils/token.util.js";
import { normalizeEmail, normalizeLoginId } from "../helpers/normalizers.js";
import { formatUser } from "../helpers/formatters.js";
import { generateLoginId } from "./loginIdService.js";
import { issueTokensForUser } from "../helpers/token-helpers.js";
import { isPasswordCorrect } from "../helpers/password-helpers.js";

const COMPANY_SELECT = { id: true, name: true, code: true };

/**
 * Public self-registration: creates a new Company + first ADMIN user in one transaction.
 * Each call creates a completely separate tenant. No limit on how many companies can register.
 */
export const registerCompany = async ({ companyName, companyCode, firstName, lastName, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const code            = companyCode.trim().toUpperCase();

  // Check company code is not already taken (it's globally unique)
  const existingCompany = await prisma.company.findUnique({ where: { code } });
  if (existingCompany) {
    throw new apiError(409, "Company code already taken. Choose a different code.", [
      { field: "companyCode", issue: "Already registered" },
    ]);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const joiningDate  = new Date();

  const { company, user, loginId } = await prisma.$transaction(async (tx) => {
    const createdCompany = await tx.company.create({
      data: { name: companyName.trim(), code },
    });

    const generatedLoginId = await generateLoginId(tx, {
      companyId:   createdCompany.id,
      companyCode: createdCompany.code,
      firstName,
      lastName,
      joiningDate,
    });

    const createdUser = await tx.user.create({
      data: {
        companyId:          createdCompany.id,
        firstName:          firstName.trim(),
        lastName:           lastName.trim(),
        name:               `${firstName.trim()} ${lastName.trim()}`,
        loginId:            generatedLoginId,
        email:              normalizedEmail,
        passwordHash,
        role:               "ADMIN",
        joiningDate,
        mustChangePassword: false,   // owner chose their own password at signup
      },
    });

    return { company: createdCompany, user: createdUser, loginId: generatedLoginId };
  });

  const { accessToken, refreshToken } = await issueTokensForUser({ ...user, company });

  return new apiResponse(201, "Company registered successfully", {
    user:        formatUser({ ...user, company }),
    loginId,
    accessToken,
    refreshToken,
  });
};

export const loginUser = async (loginIdOrEmail, password) => {
  const normalizedLoginId = normalizeLoginId(loginIdOrEmail);
  const normalizedEmail   = normalizeEmail(loginIdOrEmail);

  if ((!normalizedLoginId && !normalizedEmail) || !password) {
    throw new apiError(400, "Login ID or email and password are required", [
      { field: "loginIdOrEmail/password", issue: "Missing required login fields" },
    ]);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { loginId: normalizedLoginId },
        { email:   normalizedEmail   },
      ],
    },
    include: { company: { select: COMPANY_SELECT } },
  });

  if (!user) {
    throw new apiError(401, "Invalid credentials", [
      { field: "loginIdOrEmail/password", issue: "Incorrect login ID, email or password" },
    ]);
  }

  const isMatch = await isPasswordCorrect(password, user.passwordHash);
  if (!isMatch) {
    throw new apiError(401, "Invalid credentials", [
      { field: "loginIdOrEmail/password", issue: "Incorrect login ID, email or password" },
    ]);
  }

  const { accessToken, refreshToken } = await issueTokensForUser(user);

  return new apiResponse(200, "Login successful", {
    user: formatUser(user),
    accessToken,
    refreshToken,
  });
};

export const logoutUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new apiError(404, "User not found", [{ field: "user", issue: "User account could not be found" }]);
  }

  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });

  return new apiResponse(200, "Logout successful", true);
};

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where:   { id: userId },
    include: { company: { select: COMPANY_SELECT } },
  });

  if (!user) {
    throw new apiError(404, "User not found", [{ field: "user", issue: "User account could not be found" }]);
  }

  return new apiResponse(200, "Current user fetched successfully", { user: formatUser(user) });
};

export const forgotPassword = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new apiError(400, "Email is required", [{ field: "email", issue: "Missing email address" }]);
  }

  const user = await prisma.user.findFirst({
    where:   { email: normalizedEmail },
    include: { company: { select: COMPANY_SELECT } },
  });

  if (!user) {
    throw new apiError(404, "No user found with this email address", [{ field: "email", issue: "Email not registered" }]);
  }

  const { unHashedToken, hashedToken, expiryTime } = generateTemporaryToken();

  await prisma.user.update({
    where: { id: user.id },
    data:  { forgotPasswordToken: hashedToken, forgotPasswordTokenExpiry: expiryTime },
  });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${unHashedToken}`;

  if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
    await sendEmail({
      to:      user.email,
      subject: "Reset your password",
      text:    `Use this token to reset your password: ${unHashedToken}\nReset link: ${resetUrl}`,
      html:    `<p>Use this token to reset your password:</p><p><strong>${unHashedToken}</strong></p><p><a href="${resetUrl}">Reset password</a></p>`,
    });
  }

  return new apiResponse(200, "Password reset token generated successfully", { resetToken: unHashedToken, resetUrl });
};

export const resetPassword = async (token, newPassword) => {
  if (!token || !newPassword) {
    throw new apiError(400, "Token and new password are required", [
      { field: "token/newPassword", issue: "Missing required reset fields" },
    ]);
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: { forgotPasswordToken: hashedToken, forgotPasswordTokenExpiry: { gt: new Date() } },
  });

  if (!user) {
    throw new apiError(400, "Token is invalid or has expired", [{ field: "token", issue: "Reset token expired or invalid" }]);
  }

  const isSameAsOld = await isPasswordCorrect(newPassword, user.passwordHash);
  if (isSameAsOld) {
    throw new apiError(400, "New password cannot be same as current password", [
      { field: "newPassword", issue: "Choose a different password" },
    ]);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data:  { passwordHash, refreshToken: null, forgotPasswordToken: null, forgotPasswordTokenExpiry: null },
  });

  return new apiResponse(200, "Password reset successfully", true);
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  if (!oldPassword || !newPassword) {
    throw new apiError(400, "Old password and new password are required", [
      { field: "oldPassword/newPassword", issue: "Missing required password fields" },
    ]);
  }

  const user = await prisma.user.findUnique({
    where:   { id: userId },
    include: { company: { select: COMPANY_SELECT } },
  });

  if (!user) {
    throw new apiError(404, "User not found", [{ field: "user", issue: "User account could not be found" }]);
  }

  const isOldValid = await isPasswordCorrect(oldPassword, user.passwordHash);
  if (!isOldValid) {
    throw new apiError(401, "Invalid credentials", [{ field: "oldPassword", issue: "Old password does not match" }]);
  }

  const isSameAsOld = await isPasswordCorrect(newPassword, user.passwordHash);
  if (isSameAsOld) {
    throw new apiError(400, "New password cannot be same as current password", [
      { field: "newPassword", issue: "Choose a different password" },
    ]);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data:  { passwordHash, refreshToken: null, mustChangePassword: false },
  });

  const { accessToken, refreshToken } = await issueTokensForUser({ ...user, passwordHash });

  // Confirmation email — fire and forget
  sendEmail({
    to: user.email,
    subject: "Your EmPay password has been changed",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#6366f1">Password changed successfully</h2>
        <p>Hi ${user.firstName ?? user.name},</p>
        <p>Your EmPay HRMS password was just changed. You can now log in with your new password.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr>
            <td style="padding:10px 14px;background:#f3f4f6;font-weight:600;border-radius:6px 0 0 6px">Login ID</td>
            <td style="padding:10px 14px;background:#f9fafb;font-family:monospace;border-radius:0 6px 6px 0">${user.loginId}</td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:13px">If you did not make this change, contact your administrator immediately.</p>
      </div>
    `,
  }).catch(() => {});

  return new apiResponse(200, "Password changed successfully", {
    user: formatUser({ ...user, mustChangePassword: false }),
    accessToken,
    refreshToken,
  });
};

export const refreshAuthToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request", [{ field: "refreshToken", issue: "No refresh token provided" }]);
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new apiError(401, "Invalid refresh token", [{ field: "refreshToken", issue: error.message }]);
  }

  const user = await prisma.user.findUnique({
    where:   { id: decodedToken.id },
    include: { company: { select: COMPANY_SELECT } },
  });

  if (!user || user.refreshToken !== incomingRefreshToken || user.companyId !== decodedToken.companyId) {
    throw new apiError(401, "Invalid refresh token", [{ field: "refreshToken", issue: "Refresh token mismatch" }]);
  }

  const { accessToken, refreshToken } = await issueTokensForUser(user);

  return new apiResponse(200, "Token refreshed successfully", {
    user: formatUser(user),
    accessToken,
    refreshToken,
  });
};
