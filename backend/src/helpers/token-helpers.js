// src/helpers/token-helpers.js

import { prisma } from "../lib/prisma.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.util.js";

export const issueTokensForUser = async (user) => {
  const accessToken = generateAccessToken({
    id: user.id,
    companyId: user.companyId,
    role: user.role,
    loginId: user.loginId,
    email: user.email,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    companyId: user.companyId,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { accessToken, refreshToken };
};
