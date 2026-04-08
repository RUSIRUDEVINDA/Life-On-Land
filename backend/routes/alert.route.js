import express from "express";
import { getAlerts, updateAlertStatus } from "../controllers/alert.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateUpdateAlert } from "../validators/alert.validator.js";

const router = express.Router();

// All alert routes are protected
router.use(protect);

router.get("/", authorizeRoles("ADMIN"), getAlerts);
router.patch("/:id", authorizeRoles("ADMIN"), validateUpdateAlert, updateAlertStatus);

export default router;
