import { Router } from "express";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { getCompanySettingsController, updateCompanySettingsController } from "../controller/company.controller.js";

const router = Router();

router.use(verifyJWT, mustChangePasswordGuard);

router.get("/settings", getCompanySettingsController);
router.put("/settings", requireRole("ADMIN"), updateCompanySettingsController);

export default router;
