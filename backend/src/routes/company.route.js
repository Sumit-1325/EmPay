import { Router } from "express";
import { verifyJWT, mustChangePasswordGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { getCompanySettingsController, updateCompanySettingsController, updateCompanyLogoController } from "../controller/company.controller.js";

const router = Router();

router.use(verifyJWT, mustChangePasswordGuard);

router.get("/settings",  getCompanySettingsController);
router.put("/settings",  requireRole("ADMIN"), updateCompanySettingsController);
router.patch("/logo",    requireRole("ADMIN"), upload.single("logo"), updateCompanyLogoController);

export default router;
