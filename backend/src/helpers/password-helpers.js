import bcrypt from "bcryptjs";
import crypto from "crypto";

export const isPasswordCorrect = async (inputPassword, hashedPassword) => {
  return await bcrypt.compare(inputPassword, hashedPassword);
};

/** Generates a 10-character URL-safe alphanumeric temporary password. */
export const generateTempPassword = () => {
  return crypto.randomBytes(8).toString("base64url").slice(0, 10);
};
