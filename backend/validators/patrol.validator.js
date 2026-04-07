import mongoose from "mongoose";
import Zone from "../models/Zone.model.js";
import Patrol from "../models/Patrol.js";

const VALID_STATUS = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

const normalizeUpper = (value) =>
    typeof value === "string" ? value.trim().toUpperCase() : value;

const normalizeTrim = (value) =>
    typeof value === "string" ? value.trim() : value;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidDate = (value) => !isNaN(Date.parse(value));

export const validateCreatePatrol = (req, res, next) => {
    const errors = [];
    const { alertId, protectedAreaId, exactLocation, zoneIds, plannedStart, plannedEnd, assignedRangerIds, status, notes, title } = req.body || {};

    if (alertId) {
        if (!isValidObjectId(alertId)) errors.push("alertId must be a valid ObjectId");
    } else {
        if (!isValidObjectId(protectedAreaId)) errors.push("protectedAreaId must be a valid ObjectId");

        if (!exactLocation || typeof exactLocation.lat !== "number" || typeof exactLocation.lng !== "number") {
            errors.push("exactLocation with lat and lng (numbers) is required");
        }
    }

    if (!plannedStart || !isValidDate(plannedStart)) errors.push("plannedStart must be a valid date");
    if (!plannedEnd || !isValidDate(plannedEnd)) errors.push("plannedEnd must be a valid date");

    if (!Array.isArray(assignedRangerIds)) {
        errors.push("assignedRangerIds must be an array");
    } else {
        assignedRangerIds.forEach((id, index) => {
            if (!isValidObjectId(id)) errors.push(`assignedRangerIds[${index}] must be a valid ObjectId`);
        });
    }

    if (zoneIds && !Array.isArray(zoneIds)) {
        errors.push("zoneIds must be an array");
    } else if (zoneIds) {
        zoneIds.forEach((id, index) => {
            if (!isValidObjectId(id)) errors.push(`zoneIds[${index}] must be a valid ObjectId`);
        });
    }

    const normalizedStatus = status ? normalizeUpper(status) : "PLANNED";
    if (status && !VALID_STATUS.includes(normalizedStatus)) {
        errors.push("status must be PLANNED, IN_PROGRESS, COMPLETED, or CANCELLED");
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    req.body = {
        alertId,
        title: title ? normalizeTrim(title) : "",
        protectedAreaId,
        exactLocation,
        zoneIds: zoneIds || [],
        plannedStart: new Date(plannedStart),
        plannedEnd: new Date(plannedEnd),
        assignedRangerIds,
        status: normalizedStatus,
        notes: notes ? normalizeTrim(notes) : ""
    };

    next();
};

export const validateUpdatePatrol = async (req, res, next) => {
    const errors = [];
    const { protectedAreaId, exactLocation, zoneIds, plannedStart, plannedEnd, assignedRangerIds, status, notes, checkIns, title } = req.body || {};

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
    }

    // IMMUTABLE FIELDS CHECK (cannot be changed after creation)
    const immutableFields = ["protectedAreaId", "exactLocation", "zoneIds", "title"];
    const attemptedImmutableUpdates = immutableFields.filter(field => req.body[field] !== undefined);

    if (attemptedImmutableUpdates.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: [`Fields [${attemptedImmutableUpdates.join(", ")}] cannot be changed after patrol creation.`]
        });
    }

    const updates = {};


    if (plannedStart !== undefined) {
        if (!isValidDate(plannedStart)) errors.push("plannedStart must be a valid date");
        else updates.plannedStart = new Date(plannedStart);
    }

    if (plannedEnd !== undefined) {
        if (!isValidDate(plannedEnd)) errors.push("plannedEnd must be a valid date");
        else updates.plannedEnd = new Date(plannedEnd);
    }

    if (assignedRangerIds !== undefined) {
        if (!Array.isArray(assignedRangerIds)) {
            errors.push("assignedRangerIds must be an array");
        } else {
            assignedRangerIds.forEach((id, index) => {
                if (!isValidObjectId(id)) errors.push(`assignedRangerIds\[${index}] must be a valid ObjectId`);
            });
            updates.assignedRangerIds = assignedRangerIds;
        }
    }

    if (zoneIds !== undefined) {
        if (!Array.isArray(zoneIds)) {
            errors.push("zoneIds must be an array");
        } else {
            zoneIds.forEach((id, index) => {
                if (!isValidObjectId(id)) errors.push(`zoneIds\[${index}] must be a valid ObjectId`);
            });

            if (errors.length === 0) {
                try {
                    const existingPatrol = await Patrol.findById(req.params.id).select("protectedAreaId");
                    if (!existingPatrol) return res.status(404).json({ error: "Patrol not found" });
                    const targetPAId = existingPatrol.protectedAreaId;

                    const invalidZones = await Zone.find({
                        _id: { $in: zoneIds },
                        protectedAreaId: { $ne: targetPAId }
                    }).select("_id");

                    if (invalidZones.length > 0) {
                        errors.push(`The following zones do not belong to the protected area [${targetPAId}]: ${invalidZones.map(z => z._id).join(", ")}`);
                    }
                } catch (err) {
                    return res.status(500).json({ error: "Zone verification failed" });
                }
            }
            updates.zoneIds = zoneIds;
        }
    }

    if (status !== undefined) {
        const normalizedStatus = normalizeUpper(status);
        if (!VALID_STATUS.includes(normalizedStatus)) {
            errors.push("status must be PLANNED, IN_PROGRESS, COMPLETED, or CANCELLED");
        } else {
            updates.status = normalizedStatus;
        }
    }

    if (notes !== undefined) {
        updates.notes = normalizeTrim(notes);
    }

    if (checkIns !== undefined) {
        if (!Array.isArray(checkIns)) errors.push("checkIns must be an array");
        else updates.checkIns = checkIns;
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    req.body = updates;
    next();
};

export const validatePatrolQuery = (req, res, next) => {
    const errors = [];
    const { protectedAreaId, zoneIds, from, to, rangerId, status, page, limit, sort } = req.query || {};

    if (status) {
        const normalizedStatus = normalizeUpper(status);
        if (!VALID_STATUS.includes(normalizedStatus)) {
            errors.push("status must be PLANNED, IN_PROGRESS, COMPLETED, or CANCELLED");
        } else {
            req.query.status = normalizedStatus;
        }
    }

    if (protectedAreaId) {
        if (!isValidObjectId(protectedAreaId)) {
            errors.push("protectedAreaId must be a valid ObjectId");
        }
    }

    if (zoneIds) {
        const ids = Array.isArray(zoneIds) ? zoneIds : zoneIds.split(",");
        ids.forEach((id, index) => {
            if (!isValidObjectId(id.trim())) {
                errors.push(`zoneIds[${index}] must be a valid ObjectId`);
            }
        });
        req.query.zoneIds = ids.map(id => id.trim());
    }

    if (rangerId) {
        if (!isValidObjectId(rangerId)) {
            errors.push("rangerId must be a valid ObjectId");
        }
    }

    if (from && !isValidDate(from)) errors.push("from must be a valid date");
    if (to && !isValidDate(to)) errors.push("to must be a valid date");

    if (page !== undefined) {
        const parsedPage = Number(page);
        if (!Number.isInteger(parsedPage) || parsedPage < 1) {
            errors.push("page must be an integer >= 1");
        } else {
            req.query.page = parsedPage;
        }
    }

    if (limit !== undefined) {
        const parsedLimit = Number(limit);
        if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
            errors.push("limit must be an integer between 1 and 50");
        } else {
            req.query.limit = parsedLimit;
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    next();
};

export const validateCheckIn = async (req, res, next) => {
    const errors = [];
    const { location, note, zoneId } = req.body || {};

    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
        errors.push("location with lat and lng (numbers) is required");
    }

    if (zoneId && !isValidObjectId(zoneId)) {
        errors.push("zoneId must be a valid ObjectId");
    } else if (zoneId) {
        // Verify Zone belongs to Patrol's Protected Area
        try {
            const patrol = await Patrol.findById(req.params.id).select("protectedAreaId");
            if (!patrol) {
                return res.status(404).json({ error: "Patrol not found" });
            }
            const zone = await Zone.findOne({ _id: zoneId, protectedAreaId: patrol.protectedAreaId });
            if (!zone) {
                errors.push(`Zone [${zoneId}] does not belong to the patrol's protected area [${patrol.protectedAreaId}]`);
            }
        } catch (err) {
            return res.status(500).json({ error: "Validation error" });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    req.body = {
        location,
        note: note ? normalizeTrim(note) : "",
        zoneId,
        timestamp: new Date()
    };

    next();
};

export const validateFullUpdatePatrol = async (req, res, next) => {
    const errors = [];
    const { protectedAreaId, exactLocation, zoneIds, plannedStart, plannedEnd, assignedRangerIds, status, notes, checkIns, title } = req.body || {};

    // For PUT, we require all mandatory fields to be present in the body
    if (!isValidObjectId(protectedAreaId)) errors.push("protectedAreaId is required and must be a valid ObjectId");

    if (!exactLocation || typeof exactLocation.lat !== "number" || typeof exactLocation.lng !== "number") {
        errors.push("exactLocation with lat and lng (numbers) is required");
    }

    if (!plannedStart || !isValidDate(plannedStart)) errors.push("plannedStart is required and must be a valid date");
    if (!plannedEnd || !isValidDate(plannedEnd)) errors.push("plannedEnd is required and must be a valid date");

    if (!Array.isArray(assignedRangerIds) || assignedRangerIds.length === 0) {
        errors.push("assignedRangerIds is required and must be a non-empty array");
    } else {
        assignedRangerIds.forEach((id, index) => {
            if (!isValidObjectId(id)) errors.push(`assignedRangerIds[${index}] must be a valid ObjectId`);
        });
    }

    if (zoneIds && !Array.isArray(zoneIds)) {
        errors.push("zoneIds must be an array");
    } else if (zoneIds) {
        zoneIds.forEach((id, index) => {
            if (!isValidObjectId(id)) errors.push(`zoneIds[${index}] must be a valid ObjectId`);
        });
    }

    if (errors.length === 0) {
        try {
            const existingPatrol = await Patrol.findById(req.params.id);
            if (!existingPatrol) return res.status(404).json({ error: "Patrol not found" });

            // ENFORCE IMMUTABILITY for PUT (must match existing values)
            if (protectedAreaId && protectedAreaId.toString() !== existingPatrol.protectedAreaId.toString()) {
                errors.push("protectedAreaId cannot be changed after creation");
            }

            if (exactLocation && (exactLocation.lat !== existingPatrol.exactLocation.lat || exactLocation.lng !== existingPatrol.exactLocation.lng)) {
                errors.push("exactLocation cannot be changed after creation");
            }

            if (zoneIds) {
                const existingZoneIds = existingPatrol.zoneIds.map(id => id.toString()).sort();
                const newZoneIds = zoneIds.map(id => id.toString()).sort();
                if (JSON.stringify(existingZoneIds) !== JSON.stringify(newZoneIds)) {
                    errors.push("zoneIds cannot be changed after creation");
                }
            }

            if (title !== undefined && title !== existingPatrol.title) {
                errors.push("title cannot be changed after creation");
            }

        } catch (err) {
            return res.status(500).json({ error: "Database error during validation" });
        }
    }

    const normalizedStatus = status ? normalizeUpper(status) : "PLANNED";
    if (status && !VALID_STATUS.includes(normalizedStatus)) {
        errors.push("status must be PLANNED, IN_PROGRESS, COMPLETED, or CANCELLED");
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed (PUT requires full replacement matching original territory)", details: errors });
    }

    req.body = {
        plannedStart: new Date(plannedStart),
        plannedEnd: new Date(plannedEnd),
        assignedRangerIds,
        status: normalizedStatus,
        notes: notes ? normalizeTrim(notes) : "",
        checkIns: checkIns || []
    };

    next();
};

export const validateFullUpdateCheckIn = async (req, res, next) => {
    const errors = [];
    const { location, note, zoneId } = req.body || {};

    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
        errors.push("location with lat and lng (numbers) is required for PUT");
    }

    if (zoneId && !isValidObjectId(zoneId)) {
        errors.push("zoneId must be a valid ObjectId");
    } else if (zoneId) {
        try {
            const patrol = await Patrol.findById(req.params.id).select("protectedAreaId");
            if (!patrol) return res.status(404).json({ error: "Patrol not found" });

            const zone = await Zone.findOne({ _id: zoneId, protectedAreaId: patrol.protectedAreaId });
            if (!zone) {
                errors.push(`Zone [${zoneId}] does not belong to the patrol's protected area [${patrol.protectedAreaId}]`);
            }
        } catch (err) {
            return res.status(500).json({ error: "Validation error" });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed (PUT requires full replacement)", details: errors });
    }

    req.body = {
        location,
        note: note ? normalizeTrim(note) : "",
        zoneId,
        timestamp: new Date()
    };

    next();
};

export const validateUpdateCheckIn = async (req, res, next) => {
    const errors = [];
    const { location, note, zoneId } = req.body || {};

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
    }

    const updates = {};
    if (location !== undefined) {
        if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
            errors.push("location with lat and lng (numbers) is required when provided");
        } else updates.location = location;
    }

    if (zoneId !== undefined) {
        if (!isValidObjectId(zoneId)) errors.push("zoneId must be a valid ObjectId");
        else {
            try {
                const patrol = await Patrol.findById(req.params.id).select("protectedAreaId");
                if (!patrol) return res.status(404).json({ error: "Patrol not found" });

                const zone = await Zone.findOne({ _id: zoneId, protectedAreaId: patrol.protectedAreaId });
                if (!zone) {
                    errors.push(`Zone [${zoneId}] does not belong to the patrol's protected area [${patrol.protectedAreaId}]`);
                } else updates.zoneId = zoneId;
            } catch (err) {
                return res.status(500).json({ error: "Validation error" });
            }
        }
    }

    if (note !== undefined) {
        updates.note = (typeof note === "string") ? note.trim() : note;
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    req.body = updates;
    next();
};

export const validateCheckInQuery = (req, res, next) => {
    const { page, limit } = req.query || {};
    const errors = [];

    if (page !== undefined) {
        const p = Number(page);
        if (isNaN(p) || p < 1) errors.push("page must be a number >= 1");
    }

    if (limit !== undefined) {
        const l = Number(limit);
        if (isNaN(l) || l < 1 || l > 100) errors.push("limit must be a number between 1 and 100");
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    next();
};