import express from "express";
import * as zoneController from "../controllers/zone.Controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.put(
  "/:zoneId",
  protect,
  authorizeRoles("ADMIN"),
  zoneController.update
);
router.delete(
  "/:zoneId",
  protect,
  authorizeRoles("ADMIN"),
  zoneController.remove
);

export default router;
