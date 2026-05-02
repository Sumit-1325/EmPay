import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { apiError } from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json(new apiError(401, "Unauthorized request", [{ issue: "No token provided" }]));
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken.id || !decodedToken.companyId || !decodedToken.role || !decodedToken.loginId) {
      return res.status(401).json(new apiError(401, "Invalid token structure", [{ issue: "Missing required token fields" }]));
    }

    req.user = {
      id:        decodedToken.id,
      companyId: decodedToken.companyId,
      loginId:   decodedToken.loginId,
      role:      decodedToken.role,
      email:     decodedToken.email,
    };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json(new apiError(401, "Token has expired", [{ issue: "Please refresh your token" }]));
    }
    return res.status(401).json(new apiError(401, error?.message || "Invalid access token", [{ issue: error.message }]));
  }
};

/**
 * Blocks all protected routes when mustChangePassword is true.
 * Apply after verifyJWT on every route EXCEPT PUT /auth/change-password and GET /auth/me.
 */
export const mustChangePasswordGuard = asyncHandler(async (req, _res, next) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user.id },
    select: { mustChangePassword: true },
  });

  if (user?.mustChangePassword) {
    throw new apiError(403, "Password change required", [
      { path: "mustChangePassword", msg: "Please change your password before continuing." },
    ]);
  }
  next();
});
