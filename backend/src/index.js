import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRouter       from "./routes/auth.route.js";
import employeeRouter   from "./routes/employee.route.js";
import attendanceRouter from "./routes/attendance.route.js";
import leaveRouter      from "./routes/leave.route.js";
import payrollRouter    from "./routes/payroll.route.js";

const app          = express();
const PORT         = parseInt(process.env.PORT) || 5000;
const NODE_ENV     = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const ALLOWED_ORIGINS = FRONTEND_URL
  .split(/\|\||,/)
  .map((o) => o.trim())
  .filter(Boolean);

// ─── Security & Parsing ──────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({
  success: true, message: "Server is running",
  timestamp: new Date().toISOString(), environment: NODE_ENV,
}));

app.use("/api/auth",       authRouter);
app.use("/api/employees",  employeeRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leave",      leaveRouter);
app.use("/api/payroll",    payrollRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found", path: req.path }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Error:", err);
  res.status(err.statusCode || err.status || 500).json({
    success:  false,
    message:  err.message || "Internal server error",
    errors:   err.errors  || [],
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  EmPay HRMS Backend Started             ║`);
  console.log(`╠════════════════════════════════════════╣`);
  console.log(`║  Env:  ${NODE_ENV.padEnd(33)} ║`);
  console.log(`║  Port: ${String(PORT).padEnd(33)} ║`);
  console.log(`║  URL:  http://localhost:${String(PORT).padEnd(25)} ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});

export default app;
