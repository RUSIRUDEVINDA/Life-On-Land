import express from "express";
import {
    createPatrol,
    getPatrols,
    getPatrolById,
    updatePatrol,
    deletePatrol,
    addCheckIn,
    getCheckIns
} from "../controllers/patrol.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

router
    .route("/")
    .post(authorize("ADMIN"), createPatrol)
    .get(getPatrols); // Both ADMIN and RANGER can list patrols (filtered)

router
    .route("/:id")
    .get(getPatrolById)
    .put(authorize("ADMIN"), updatePatrol)
    .delete(authorize("ADMIN"), deletePatrol);

router
    .route("/:id/check-ins")
    .get(getCheckIns)
    .post(authorize("RANGER"), addCheckIn);

export default router;