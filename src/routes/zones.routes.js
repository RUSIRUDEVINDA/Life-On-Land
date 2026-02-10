const express = require("express");
const zoneController = require("../controllers/zoneController");
const { allowRoles } = require("../middleware/authorize");

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

module.exports = router;
