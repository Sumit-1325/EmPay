import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { apiError } from "./api-error.js";
import { apiResponse } from "./api-response.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "user-avatars"
    });

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return new apiResponse(200, "File uploaded successfully", response.secure_url);
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw new apiError(500, "Cloudinary upload failed", [{ issue: error.message }]);
  }
};

export const deleteFromCloudinary = async (url) => {
  try {
    if (!url) return null;

    const urlParts = url.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = `user-avatars/${publicIdWithExtension.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
    return new apiResponse(200, "File deleted successfully", true);
  } catch (error) {
    throw new apiError(500, "Cloudinary delete failed", [{ issue: error.message }]);
  }
};