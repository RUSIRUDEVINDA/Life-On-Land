import * as movementService from "../services/movement.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const ingestMovement = asyncHandler(async (req, res) => {
    const movement = await movementService.ingestMovement(req.body);
    res.status(201).json({ message: "Movement recorded", movement });
});

export const getAnimalMovements = asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    const history = await movementService.getMovementHistory(tagId, req.query);
    res.json(history);
});

export const searchMovements = asyncHandler(async (req, res) => {
    const results = await movementService.searchMovements(req.query);
    res.json(results);
});

export const getMovementSummary = asyncHandler(async (req, res) => {
    const summary = await movementService.getMovementSummary(req.query);
    res.json(summary);
});
