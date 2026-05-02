// ── Date formatters ──────────────────────────────────────────
export const formatDate = (date, options = {}) => {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    ...options,
  });
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export const formatRelativeTime = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24)  return `${diffHr}h ago`;
  if (diffDay < 7)  return `${diffDay}d ago`;
  return formatDate(date);
};

// ── Currency formatters ───────────────────────────────────────
export const formatCurrency = (amount, currency = "USD") => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCompactCurrency = (amount, currency = "USD") => {
  if (amount == null) return "—";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`;
  return formatCurrency(amount, currency);
};

// ── Name / string formatters ──────────────────────────────────
export const formatName = (firstName, lastName) => {
  if (!firstName && !lastName) return "—";
  return [firstName, lastName].filter(Boolean).join(" ");
};

export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
};

export const truncate = (str, maxLength = 50) => {
  if (!str) return "";
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
};

// ── Number formatters ─────────────────────────────────────────
export const formatPercent = (value) => {
  if (value == null) return "—";
  return `${Math.round(value)}%`;
};

export const formatNumber = (value) => {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
};

// ── Phone formatter ───────────────────────────────────────────
export const formatPhone = (phone) => {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};
