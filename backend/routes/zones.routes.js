import express from "express";
import * as zoneController from "../controllers/zone.Controller.js";
import { allowRoles } from "../middleware/authorize.middleware.js";

const router = express.Router();

router.put(
  "/:zoneId",
  allowRoles(["ADMIN"]),
  zoneController.update
);
router.delete(
  "/:zoneId",
  allowRoles(["ADMIN"]),
  zoneController.remove
);

export default router;
