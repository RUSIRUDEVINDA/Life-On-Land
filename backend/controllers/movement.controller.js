import * as movementService from "../services/movement.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @desc    Ingest telemetry data from devices
// @route   POST /api/movements
// @access  Private
export const ingestMovement = asyncHandler(async (req, res) => {
    // Validate and store movement via service
    const movement = await movementService.ingestMovement(req.body);
    res.status(201).json({ message: "Movement recorded", movement });
});

// @desc    Get all movements
// @route   GET /api/movements
// @access  Private
export const searchMovements = asyncHandler(async (req, res) => {
    const results = await movementService.searchMovements(req.query);
    res.json(results);
});

// @desc    Get animal movements
// @route   GET /api/movements/:tagId
// @access  Private
export const getAnimalMovements = asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    const history = await movementService.getMovementHistory(tagId, req.query);
    res.json(history);
});

// @desc    Get movement summary
// @route   GET /api/movements/summary
// @access  Private
export const getMovementSummary = asyncHandler(async (req, res) => {
    const summary = await movementService.getMovementSummary(req.query);
    res.json(summary);
});
