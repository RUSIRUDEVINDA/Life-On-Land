import express from "express";
import * as movementController from "../controllers/movement.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateTagIdParam } from "../validators/animal.validator.js";

const router = express.Router();

// Ingest telemetry data from devices
router.post("/", protect, movementController.ingestMovement);

// Search all movements with filters
router.get("/", protect, movementController.searchMovements);

// Get aggregated activity per zone
router.get("/summary", protect, movementController.getMovementSummary);

// Get detailed history for a specific animal
router.get("/:tagId", protect, validateTagIdParam, movementController.getAnimalMovements);

export default router;

