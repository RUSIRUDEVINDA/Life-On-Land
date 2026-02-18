import express from "express";
import * as protectedAreaController from "../controllers/protectedArea.Controller.js";
import * as zoneController from "../controllers/zone.Controller.js";
import { allowRoles } from "../middleware/authorize.middleware.js";

const router = express.Router();

router.get("/", protectedAreaController.list);
router.post(
  "/",
  allowRoles(["ADMIN"]),
  protectedAreaController.create
);
router.get("/:id", protectedAreaController.getById);
router.put(
  "/:id",
  allowRoles(["ADMIN"]),
  protectedAreaController.update
);
router.delete(
  "/:id",
  allowRoles(["ADMIN"]),
  protectedAreaController.remove
);

router.get("/:id/zones", zoneController.listByProtectedArea);
router.post(
  "/:id/zones",
  allowRoles(["ADMIN"]),
  zoneController.createForProtectedArea
);

export default router;
