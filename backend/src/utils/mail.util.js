// src/utils/mail.util.js
import { apiError } from "./api-error.js";
import { apiResponse } from "./api-response.js";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendEmail = async ({ to, subject, text, html }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "EcoFlow Support";

  if (!brevoApiKey || !senderEmail) {
    throw new apiError(500, "Brevo is not configured", [
      { field: "BREVO_API_KEY/BREVO_SENDER_EMAIL", issue: "Missing required Brevo env vars" },
    ]);
  }

  const payload = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to: [{ email: to }],
    subject,
    ...(text ? { textContent: text } : {}),
    ...(html ? { htmlContent: html } : {}),
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new apiError(response.status, "Email could not be sent", [
        { issue: body?.message || "Brevo API request failed" },
      ]);
    }

    return new apiResponse(200, "Email sent successfully", {
      messageId: body?.messageId || null,
    });
  } catch (error) {
    if (error instanceof apiError) {
      throw error;
    }
    throw new apiError(500, "Email could not be sent", [{ issue: error.message }]);
  }
};