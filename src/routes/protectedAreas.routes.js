const express = require("express");
const protectedAreaController = require("../controllers/protectedAreaController");
const zoneController = require("../controllers/zoneController");
const { allowRoles } = require("../middleware/authorize");

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

module.exports = router;
