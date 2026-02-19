import mongoose from "mongoose";

const VALID_STATUS = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

const normalizeUpper = (value) =>
    typeof value === "string" ? value.trim().toUpperCase() : value;

const normalizeTrim = (value) =>
    typeof value === "string" ? value.trim() : value;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const isValidDate = (value) => !isNaN(Date.parse(value));

export const validateCreatePatrol = (req, res, next) => {
    const errors = [];
    const { protectedAreaId, exactLocation, zoneIds, plannedStart, plannedEnd, assignedRangerIds, status, notes } = req.body || {};

    if (!isValidObjectId(protectedAreaId)) errors.push("protectedAreaId must be a valid ObjectId");

    if (!exactLocation || typeof exactLocation.lat !== "number" || typeof exactLocation.lng !== "number") {
        errors.push("exactLocation with lat and lng (numbers) is required");
    }

    if (!plannedStart || !isValidDate(plannedStart)) errors.push("plannedStart must be a valid date");
    if (!plannedEnd || !isValidDate(plannedEnd)) errors.push("plannedEnd must be a valid date");

    if (!Array.isArray(assignedRangerIds) || assignedRangerIds.length === 0) {
        errors.push("assignedRangerIds must be a non-empty array");
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

export const validateUpdatePatrol = (req, res, next) => {
    const errors = [];
    const { protectedAreaId, exactLocation, zoneIds, plannedStart, plannedEnd, assignedRangerIds, status, notes } = req.body || {};

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
    }

    const updates = {};

    if (protectedAreaId !== undefined) {
        if (!isValidObjectId(protectedAreaId)) errors.push("protectedAreaId must be a valid ObjectId");
        else updates.protectedAreaId = protectedAreaId;
    }

    if (exactLocation !== undefined) {
        if (!exactLocation || typeof exactLocation.lat !== "number" || typeof exactLocation.lng !== "number") {
            errors.push("exactLocation with lat and lng (numbers) is required");
        } else {
            updates.exactLocation = exactLocation;
        }
    }

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
                if (!isValidObjectId(id)) errors.push(`assignedRangerIds[${index}] must be a valid ObjectId`);
            });
            updates.assignedRangerIds = assignedRangerIds;
        }
    }

    if (zoneIds !== undefined) {
        if (!Array.isArray(zoneIds)) {
            errors.push("zoneIds must be an array");
        } else {
            zoneIds.forEach((id, index) => {
                if (!isValidObjectId(id)) errors.push(`zoneIds[${index}] must be a valid ObjectId`);
            });
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

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    req.body = updates;
    next();
};

export const validatePatrolQuery = (req, res, next) => {
    const errors = [];
    const { protectedAreaId, from, to, rangerId, status, page, limit, sort } = req.query || {};

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

export const validateCheckIn = (req, res, next) => {
    const errors = [];
    const { location, note, zoneId } = req.body || {};

    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
        errors.push("location with lat and lng (numbers) is required");
    }

    if (zoneId && !isValidObjectId(zoneId)) {
        errors.push("zoneId must be a valid ObjectId");
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
