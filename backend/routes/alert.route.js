import express from "express";
import { getAlerts, updateAlertStatus } from "../controllers/alert.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// All alert routes are protected
router.use(protect);

router.get("/", authorizeRoles("ADMIN"), getAlerts);
router.patch("/:id/status", authorizeRoles("ADMIN"), updateAlertStatus);

export default router;
