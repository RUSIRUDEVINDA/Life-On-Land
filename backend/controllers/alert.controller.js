import * as alertService from "../services/alert.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// Get all alerts with pagination and filters
export const getAlerts = asyncHandler(async (req, res) => {
    const result = await alertService.getAlerts(req.query);
    res.json(result);
});

// Update alert status (ACKNOWLEDGED/RESOLVED)
export const updateAlertStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid alert id");
        error.statusCode = 400;
        throw error;
    }

    const alert = await alertService.updateAlertStatus(id, status);
    if (!alert) {
        const error = new Error("Alert not found");
        error.statusCode = 404;
        throw error;
    }

    res.json({ message: `Alert status updated to ${status}`, alert });
});
