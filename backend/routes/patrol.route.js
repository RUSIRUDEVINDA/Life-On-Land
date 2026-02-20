import express from "express";
import { createPatrol, getPatrols, getPatrolById, updatePatrol, deletePatrol, addCheckIn, getCheckIns, updateCheckIn, deleteCheckIn } from "../controllers/patrol.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {validateCreatePatrol,validateUpdatePatrol,validatePatrolQuery,validateCheckIn} from "../validators/patrol.validator.js";

const router = express.Router();

// Apply protection to all routes
router.use(protect);

router.post("/", authorizeRoles("ADMIN"), validateCreatePatrol, createPatrol);
router.get("/", authorizeRoles("ADMIN", "RANGER"), validatePatrolQuery, getPatrols);

router.get("/:id", authorizeRoles("ADMIN", "RANGER"), getPatrolById);
router.put("/:id", authorizeRoles("ADMIN"), validateUpdatePatrol, updatePatrol);
router.delete("/:id", authorizeRoles("ADMIN"), deletePatrol);

router.post("/:id/check-ins", authorizeRoles("RANGER"), validateCheckIn, addCheckIn);
router.get("/:id/check-ins", authorizeRoles("ADMIN", "RANGER"), getCheckIns);
router.put("/:id/check-ins/:checkInId", authorizeRoles("RANGER"), validateCheckIn, updateCheckIn);
router.delete("/:id/check-ins/:checkInId", authorizeRoles("RANGER"), deleteCheckIn);

export default router;