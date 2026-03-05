import express from "express";
import * as zoneController from "../controllers/zone.Controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.put(
  "/:zoneId",
  protect,
  authorize("ADMIN"),
  zoneController.update
);

router.delete(
  "/:zoneId",
  protect,
  authorize("ADMIN"),
  zoneController.remove
);

export default router;
