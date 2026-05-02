export const normalizeEmail = (email) => email?.trim().toLowerCase();

// LoginIds are stored UPPERCASE — normalise to uppercase for lookup
export const normalizeLoginId = (loginId) => loginId?.trim().toUpperCase();
