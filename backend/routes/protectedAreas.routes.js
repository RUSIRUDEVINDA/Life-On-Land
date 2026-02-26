import express from "express";
import * as protectedAreaController from "../controllers/protectedArea.Controller.js";
import * as zoneController from "../controllers/zone.Controller.js";
import { allowRoles } from "../middleware/authorize.middleware.js";

const router = express.Router();

/* ================================
   PROTECTED AREA ROUTES
================================ */

// 1️⃣ Get all protected areas
router.get("/", protectedAreaController.list);

// 2️⃣ Create protected area (ADMIN only)
router.post(
  "/",
  allowRoles(["ADMIN"]),
  protectedAreaController.create
);

/* ================================
   ZONE ROUTES (Must come BEFORE /:id)
================================ */

// 3️⃣ Get zones by protected area
router.get(
  "/:id/zones",
  zoneController.listByProtectedArea
);

// 4️⃣ Create zone for protected area (ADMIN only)
router.post(
  "/:id/zones",
  allowRoles(["ADMIN"]),
  zoneController.createForProtectedArea
);

/* ================================
   SINGLE PROTECTED AREA ROUTES
================================ */

// 5️⃣ Get protected area by ID
router.get(
  "/:id",
  protectedAreaController.getById
);

// 6️⃣ Update protected area (ADMIN only)
router.put(
  "/:id",
  allowRoles(["ADMIN"]),
  protectedAreaController.update
);

// 7️⃣ Delete protected area (ADMIN only)
router.delete(
  "/:id",
  allowRoles(["ADMIN"]),
  protectedAreaController.remove
);

export default router;
