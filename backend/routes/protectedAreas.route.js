import express from "express";
import * as protectedAreaController from "../controllers/protectedArea.Controller.js";
import * as zoneController from "../controllers/zone.Controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectedAreaController.list);
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  protectedAreaController.create
);
router.get("/:id", protectedAreaController.getById);
router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  protectedAreaController.update
);
router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  protectedAreaController.remove
);

router.get("/:id/zones", zoneController.listByProtectedArea);
router.post(
  "/:id/zones",
  protect,
  authorize("ADMIN"),
  zoneController.createForProtectedArea
);

export default router;
