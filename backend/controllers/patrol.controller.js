import mongoose from "mongoose";
import * as service from "../services/patrol.service.js";
import * as repo from "../repositories/patrol.repository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Build Mongol Query for Patrols
const buildPatrolQuery = (queryParams) => {
    const { protectedAreaId, from, to, rangerId, status } = queryParams;
    const query = {};

    if (protectedAreaId) {
        query.protectedAreaId = new mongoose.Types.ObjectId(protectedAreaId);
    }

    if (rangerId) {
        query.assignedRangerIds = new mongoose.Types.ObjectId(rangerId);
    }

    if (status) query.status = status;

    if (from || to) {
        query.plannedStart = {};
        if (from) query.plannedStart.$gte = new Date(from);
        if (to) query.plannedStart.$lte = new Date(to);
    }

    return query;
};

// Create a new patrol
export const createPatrol = asyncHandler(async (req, res) => {
    const { alertId, ...patrolData } = req.body;

    // If alertId is provided, inherit data
    if (alertId && mongoose.Types.ObjectId.isValid(alertId)) {
        try {
            const Alert = (await import("../models/Alert.js")).default;
            const alert = await Alert.findById(alertId).lean();

            if (alert) {
                // Inherit basic details from Alert
                patrolData.title = alert.description;
                patrolData.protectedAreaId = alert.protectedAreaId;
                if (alert.zoneId && !patrolData.zoneIds?.includes(alert.zoneId)) {
                    patrolData.zoneIds = [...(patrolData.zoneIds || []), alert.zoneId];
                }

                // Inherit location from related Incident or Movement
                let location = null;
                if (alert.type === "INCIDENT") {
                    const Incident = (await import("../models/Incident.model.js")).default;
                    const incident = await Incident.findById(alert.relatedId).lean();
                    if (incident && incident.location?.coordinates) {
                        location = {
                            lat: incident.location.coordinates[1],
                            lng: incident.location.coordinates[0]
                        };
                    }
                } else if (alert.type === "MOVEMENT") {
                    const Movement = (await import("../models/Movement.js")).default;
                    const movement = await Movement.findById(alert.relatedId).lean();
                    if (movement) {
                        location = { lat: movement.lat, lng: movement.lng };
                    }
                }

                if (location) {
                    patrolData.exactLocation = location;
                }
            }
        } catch (error) {
            console.error("Failed to automate patrol data inheritance:", error);
        }
    }

    const patrol = await service.createPatrol(patrolData);

    // If created from an alert, link them (existing logic)
    if (alertId && mongoose.Types.ObjectId.isValid(alertId)) {
        try {
            const { linkPatrolToAlert } = await import("../services/alert.service.js");
            await linkPatrolToAlert(alertId, patrol._id);
        } catch (error) {
            console.error("Failed to link alert to patrol:", error);
        }
    }

    res.status(201).json({ message: "Patrol created successfully", patrol });
});

// Get all patrols
export const getPatrols = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = { plannedStart: -1 };

    const query = buildPatrolQuery(req.query);
    const skip = (page - 1) * limit;

    const [total, patrols] = await Promise.all([
        repo.count(query),
        repo.findWithPagination(query, sort, skip, limit)
    ]);

    res.json({
        data: patrols,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit) || 1
        }
    });
});

// Get single patrol details
export const getPatrolById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await repo.findById(id);
    if (!patrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }

    res.json({ patrol });
});

// Update patrol
export const updatePatrol = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.updatePatrol(id, req.body);
    res.json({ message: "Patrol updated successfully", patrol });
});

// Delete patrol
export const deletePatrol = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.deletePatrol(id);
    res.json({
        message: "Patrol deleted successfully",
        patrol
    });
});

// Add check-in to patrol
export const addCheckIn = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.addCheckIn(id, req.body);
    res.status(201).json({ message: "Check-in added successfully", patrol });
});

// Get check-ins for a patrol
export const getCheckIns = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const checkIns = await repo.getCheckIns(id);
    if (!checkIns) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }

    res.json({ checkIns });
});

// Update a check-in
export const updateCheckIn = asyncHandler(async (req, res) => {
    const { id, checkInId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(checkInId)) {
        const error = new Error("Invalid patrol or check-in id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.updateCheckIn(id, checkInId, req.body);
    res.json({ message: "Check-in updated successfully", patrol });
});

// Delete a check-in
export const deleteCheckIn = asyncHandler(async (req, res) => {
    const { id, checkInId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(checkInId)) {
        const error = new Error("Invalid patrol or check-in id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.deleteCheckIn(id, checkInId);
    res.json({ message: "Check-in deleted successfully", patrol });
});
