// src/middlewares/multer.middleware.js
import multer from "multer";
import path from "path";
import { apiError } from "../utils/api-error.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Images only — used for avatar uploads
const imageFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new apiError(400, "Only image files (JPEG, PNG, GIF, WEBP) are allowed", [{ field: "file", issue: "Invalid file type" }]), false);
  }
};

// Images + document images — used for leave certificate attachments
const docFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new apiError(400, "Only image files are allowed for attachments", [{ field: "file", issue: "Invalid file type" }]), false);
  }
};

export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadDoc = multer({
  storage,
  fileFilter: docFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});