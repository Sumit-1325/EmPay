import jwt from "jsonwebtoken";
import crypto from "crypto";
import { apiError } from "./api-error.js";

export const generateAccessToken = (user) => {
  try {
    if (!user || !user.id || !user.companyId || !user.role || !user.loginId) {
      throw new apiError(400, "Invalid user data for token generation", [{ field: "user", issue: "Missing required fields: id, companyId, role, loginId" }]);
    }

    const accessTokenExpireMinutes = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "15", 10);

    return jwt.sign(
      { 
        id: user.id, 
        companyId: user.companyId,
        role: user.role,
        loginId: user.loginId,
        email: user.email 
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: `${accessTokenExpireMinutes}m` }
    );
  } catch (error) {
    throw new apiError(500, "Failed to generate access token", [{ issue: error.message }]);
  }
};

export const generateRefreshToken = (user) => {
  try {
    if (!user || !user.id || !user.companyId) {
      throw new apiError(400, "Invalid user data for token generation", [{ field: "user", issue: "Missing required fields: id, companyId" }]);
    }

    const refreshTokenExpireMinutes = parseInt(process.env.REFRESH_TOKEN_EXPIRE_MINUTES || "10080", 10);

    return jwt.sign(
      { 
        id: user.id,
        companyId: user.companyId
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: `${refreshTokenExpireMinutes}m` }
    );
  } catch (error) {
    throw new apiError(500, "Failed to generate refresh token", [{ issue: error.message }]);
  }
};

export const generateTemporaryToken = () => {
  const unHashedToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000); 

  return { unHashedToken, hashedToken, expiryTime };
};