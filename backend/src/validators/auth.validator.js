import { body } from "express-validator";

const registerValidators = () => [
  body("companyName").trim().notEmpty().withMessage("Company name is required.")
    .isLength({ min: 2, max: 255 }).withMessage("Company name must be 2-255 characters."),

  body("companyCode").trim().notEmpty().withMessage("Company code is required.")
    .isLength({ min: 2, max: 10 }).withMessage("Company code must be 2-10 characters.")
    .isAlphanumeric().withMessage("Company code must contain only letters and numbers (e.g. OI, ACME)."),

  body("firstName").trim().notEmpty().withMessage("First name is required."),
  body("lastName").trim().notEmpty().withMessage("Last name is required."),

  body("email").trim().notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email address."),

  body("password")
    .trim().notEmpty().withMessage("Password is required.")
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minSymbols: 1 })
    .withMessage("Password must be at least 8 characters and include uppercase, lowercase, and a special character."),
];

const loginValidators = () => [
  body("loginIdOrEmail")
    .trim()
    .notEmpty()
    .withMessage("Login ID or email cannot be empty.")
    .custom((value) => {
      const isValidEmail   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isValidLoginId = value.length >= 6 && value.length <= 20 && value === value.toUpperCase();
      if (!isValidEmail && !isValidLoginId) {
        throw new Error("Must provide a valid email or a valid login ID.");
      }
      return true;
    }),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password cannot be empty."),
];

const forgotPasswordValidators = () => [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty.")
    .isEmail()
    .withMessage("Please provide a valid email address."),
];

const resetPasswordValidators = () => [
  body("token")
    .custom((value, { req }) => {
      const token = req.params?.token || req.query?.token || value;
      if (!token || !String(token).trim()) throw new Error("Reset token cannot be empty.");
      return true;
    }),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password cannot be empty.")
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minSymbols: 1 })
    .withMessage("Password must be at least 8 characters and include uppercase, lowercase, and a special character."),
];

const changePasswordValidators = () => [
  body("oldPassword")
    .trim()
    .notEmpty()
    .withMessage("Old password cannot be empty."),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password cannot be empty.")
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minSymbols: 1 })
    .withMessage("Password must be at least 8 characters and include uppercase, lowercase, and a special character."),
];

export { registerValidators, loginValidators, forgotPasswordValidators, resetPasswordValidators, changePasswordValidators };
