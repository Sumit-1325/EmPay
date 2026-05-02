// ── Auth validators ───────────────────────────────────────────
export const validateEmail = (email) => {
  if (!email?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address";
  return null;
};

export const validateLoginId = (loginId) => {
  if (!loginId?.trim()) return "Login ID is required";
  const v = loginId.trim();
  if (v.length < 6 || v.length > 12) return "Login ID must be 6–12 characters";
  if (v !== v.toLowerCase()) return "Login ID must be lowercase";
  if (!/^[a-z0-9_]+$/.test(v)) return "Login ID can only contain lowercase letters, numbers, and underscores";
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must include at least one number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character";
  return null;
};

export const validateCompanyName = (name) => {
  if (!name?.trim()) return "Company name is required";
  if (name.trim().length < 2) return "Company name must be at least 2 characters";
  if (name.trim().length > 255) return "Company name must be under 255 characters";
  return null;
};

export const validateName = (name) => {
  if (!name?.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  if (name.trim().length > 255) return "Name must be under 255 characters";
  return null;
};

// ── Password hint checker ─────────────────────────────────────
export const getPasswordHints = (password = "") => [
  { label: "8+ chars",  valid: password.length >= 8 },
  { label: "Uppercase", valid: /[A-Z]/.test(password) },
  { label: "Number",    valid: /[0-9]/.test(password) },
  { label: "Symbol",    valid: /[^A-Za-z0-9]/.test(password) },
];

// ── Generic required field ────────────────────────────────────
export const validateRequired = (value, label = "This field") => {
  if (!value?.toString().trim()) return `${label} is required`;
  return null;
};

// ── Run multiple validators, return first error ───────────────
export const runValidators = (...validators) => {
  for (const v of validators) {
    if (v) return v;
  }
  return null;
};
