import express from "express";
import * as movementController from "../controllers/movement.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", movementController.ingestMovement); // Ingest movement
router.get("/", protect, movementController.searchMovements); // Search movements
router.get("/summary", protect, movementController.getMovementSummary); // Summary
router.get("/:tagId", protect, movementController.getAnimalMovements);

export default router;

