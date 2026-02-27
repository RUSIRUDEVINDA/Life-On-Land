import mongoose from "mongoose";
import Incident from "../models/Incident.model.js";

const VALID_TYPES = ["POACHING", "ILLEGAL_LOGGING", "WILDLIFE_TRADE", "HABITAT_DESTRUCTION", "OTHER"];
const VALID_STATUS = ["REPORTED", "VERIFIED", "INVESTIGATING", "RESOLVED", "UNVERIFIED"];
const VALID_SEVERITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const VALID_SORT_BY = ["incidentDate", "createdAt", "severity"];
const VALID_SORT_ORDER = ["asc", "desc"];

const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

const normalizeTrim = (value) =>
    typeof value === "string" ? value.trim() : value;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const isValidURL = (value) => {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
};

const isValidDate = (value) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
};

const isValidCoordinates = (coords, type) => {
    if (type === "Point") {
        return Array.isArray(coords) && coords.length === 2 && 
               typeof coords[0] === "number" && typeof coords[1] === "number";
    }
    if (type === "Polygon") {
        return Array.isArray(coords) && coords.length > 0 &&
               Array.isArray(coords[0]) && Array.isArray(coords[0][0]) &&
               coords[0][0].length === 2;
    }
    return false;
};

export const validateCreateIncident = (req, res, next) => {
    const errors = [];
    const { type, description, location, zoneId, protectedAreaId, severity, incidentDate, evidence, notes } = req.body || {};

    // Type validation
    if (!type || !isNonEmptyString(type)) {
        errors.push("Type is required");
    } else if (!VALID_TYPES.includes(type.toUpperCase())) {
        errors.push(`Type must be one of: ${VALID_TYPES.join(", ")}`);
    }

    // Description validation
    if (!description || !isNonEmptyString(description)) {
        errors.push("Description is required");
    } else {
        const trimmedDesc = normalizeTrim(description);
        if (trimmedDesc.length < 10) {
            errors.push("Description must be at least 10 characters");
        } else if (trimmedDesc.length > 5000) {
            errors.push("Description must not exceed 5000 characters");
        }
    }

    // Location validation (optional)
    if (location !== undefined) {
        if (typeof location !== "object" || location === null) {
            errors.push("Location must be an object if provided");
        } else {
            if (location.type && location.type !== "Point") {
                errors.push('Location type must be "Point"');
            }
            if (location.coordinates && !isValidCoordinates(location.coordinates, location.type || "Point")) {
                errors.push("Coordinates must be [longitude, latitude] for Point type");
            }
        }
    }

    // Zone ID validation
    if (!zoneId || !isNonEmptyString(zoneId)) {
        errors.push("Zone ID is required");
    } else if (!isValidObjectId(zoneId)) {
        errors.push("Zone ID must be a valid MongoDB ObjectId");
    } else if (zoneId.length !== 24) {
        errors.push("Zone ID must be 24 characters");
    }

    // Protected Area ID validation
    if (!protectedAreaId || !isNonEmptyString(protectedAreaId)) {
        errors.push("Protected Area ID is required");
    } else if (!isValidObjectId(protectedAreaId)) {
        errors.push("Protected Area ID must be a valid MongoDB ObjectId");
    } else if (protectedAreaId.length !== 24) {
        errors.push("Protected Area ID must be 24 characters");
    }

    // Severity validation (optional, defaults to MEDIUM)
    if (severity !== undefined) {
        if (!isNonEmptyString(severity) || !VALID_SEVERITY.includes(severity.toUpperCase())) {
            errors.push(`Severity must be one of: ${VALID_SEVERITY.join(", ")}`);
        }
    }

    // Incident Date validation
    if (!incidentDate) {
        errors.push("Incident date is required");
    } else if (!isValidDate(incidentDate)) {
        errors.push("Incident date must be a valid date");
    } else {
        const date = new Date(incidentDate);
        const now = new Date();
        
        // Compare dates only (ignore time) - allow today's date, reject future dates
        const incidentDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (incidentDateOnly > todayOnly) {
            errors.push("Incident date cannot be in the future");
        }
    }

    // Evidence validation (optional)
    if (evidence !== undefined) {
        if (!Array.isArray(evidence)) {
            errors.push("Evidence must be an array");
        } else {
            evidence.forEach((url, index) => {
                if (!isNonEmptyString(url) || !isValidURL(url)) {
                    errors.push(`Evidence item at index ${index} must be a valid URL`);
                }
            });
        }
    }

    // Notes validation (optional)
    if (notes !== undefined && notes !== null) {
        if (typeof notes !== "string") {
            errors.push("Notes must be a string");
        } else {
            const trimmedNotes = normalizeTrim(notes);
            if (trimmedNotes.length > 1000) {
                errors.push("Notes must not exceed 1000 characters");
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: errors
        });
    }

    // Normalize and sanitize data
    req.body = {
        type: type.toUpperCase(),
        description: normalizeTrim(description),
        ...(location && {
            location: {
                type: location.type,
                coordinates: location.coordinates
            }
        }),
        zoneId: normalizeTrim(zoneId),
        protectedAreaId: normalizeTrim(protectedAreaId),
        severity: severity ? severity.toUpperCase() : "MEDIUM",
        incidentDate: new Date(incidentDate),
        evidence: evidence || [],
        notes: notes ? normalizeTrim(notes) : undefined
    };

    next();
};

export const validateUpdateIncident = async (req, res, next) => {
    const errors = [];
    const { type, incidentDate, status, severity, zoneId, protectedAreaId, description, evidence, notes } = req.body || {};

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: ["At least one field must be provided for update"]
        });
    }

    // Protected Area ID cannot be updated - check if it's being changed
    if (protectedAreaId !== undefined && req.params.id) {
        try {
            const existingIncident = await Incident.findById(req.params.id);
            if (existingIncident) {
                const existingProtectedAreaId = existingIncident.protectedAreaId?.toString();
                const newProtectedAreaId = protectedAreaId.toString();
                if (existingProtectedAreaId !== newProtectedAreaId) {
                    errors.push("Protected area id cannot be updated");
                }
            }
        } catch (error) {
            // If incident not found, let the service handle it
        }
    }

    const updates = {};

    // Type validation
    if (type !== undefined) {
        if (!isNonEmptyString(type) || !VALID_TYPES.includes(type.toUpperCase())) {
            errors.push(`Type must be one of: ${VALID_TYPES.join(", ")}`);
        } else {
            updates.type = type.toUpperCase();
        }
    }

    // Incident Date validation
    if (incidentDate !== undefined) {
        if (!isValidDate(incidentDate)) {
            errors.push("Incident date must be a valid date");
        } else {
            const date = new Date(incidentDate);
            const now = new Date();
            
            // Compare dates only (ignore time) - allow today's date, reject future dates
            const incidentDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (incidentDateOnly > todayOnly) {
                errors.push("Incident date cannot be in the future");
            } else {
                updates.incidentDate = date;
            }
        }
    }

    // Status validation
    if (status !== undefined) {
        if (!isNonEmptyString(status) || !VALID_STATUS.includes(status.toUpperCase())) {
            errors.push(`Status must be one of: ${VALID_STATUS.join(", ")}`);
        } else {
            updates.status = status.toUpperCase();
        }
    }

    // Severity validation
    if (severity !== undefined) {
        if (!isNonEmptyString(severity) || !VALID_SEVERITY.includes(severity.toUpperCase())) {
            errors.push(`Severity must be one of: ${VALID_SEVERITY.join(", ")}`);
        } else {
            updates.severity = severity.toUpperCase();
        }
    }

    // Zone ID validation
    if (zoneId !== undefined) {
        if (!isNonEmptyString(zoneId) || !isValidObjectId(zoneId)) {
            errors.push("Zone ID must be a valid MongoDB ObjectId");
        } else if (zoneId.length !== 24) {
            errors.push("Zone ID must be 24 characters");
        } else {
            updates.zoneId = normalizeTrim(zoneId);
        }
    }

    // Description validation
    if (description !== undefined) {
        if (!isNonEmptyString(description)) {
            errors.push("Description must be a non-empty string");
        } else {
            const trimmedDesc = normalizeTrim(description);
            if (trimmedDesc.length < 10) {
                errors.push("Description must be at least 10 characters");
            } else if (trimmedDesc.length > 5000) {
                errors.push("Description must not exceed 5000 characters");
            } else {
                updates.description = trimmedDesc;
            }
        }
    }

    // Evidence validation
    if (evidence !== undefined) {
        if (!Array.isArray(evidence)) {
            errors.push("Evidence must be an array");
        } else {
            const validEvidence = [];
            evidence.forEach((url, index) => {
                if (!isNonEmptyString(url) || !isValidURL(url)) {
                    errors.push(`Evidence item at index ${index} must be a valid URL`);
                } else {
                    validEvidence.push(url);
                }
            });
            if (validEvidence.length === evidence.length) {
                updates.evidence = validEvidence;
            }
        }
    }

    // Notes validation
    if (notes !== undefined && notes !== null) {
        if (typeof notes !== "string") {
            errors.push("Notes must be a string");
        } else {
            const trimmedNotes = normalizeTrim(notes);
            if (trimmedNotes.length > 1000) {
                errors.push("Notes must not exceed 1000 characters");
            } else {
                updates.notes = trimmedNotes;
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: errors
        });
    }

    req.body = updates;
    next();
};

export const validateGetIncidentsQuery = (req, res, next) => {
    const errors = [];
    const { protectedAreaId, zoneId, type, status, from, to, page, limit, sortBy, sortOrder } = req.query || {};

    // Protected Area ID validation
    if (protectedAreaId !== undefined) {
        if (!isNonEmptyString(protectedAreaId) || !isValidObjectId(protectedAreaId)) {
            errors.push("Protected Area ID must be a valid MongoDB ObjectId");
        } else {
            req.query.protectedAreaId = normalizeTrim(protectedAreaId);
        }
    }

    // Zone ID validation
    if (zoneId !== undefined) {
        if (!isNonEmptyString(zoneId) || !isValidObjectId(zoneId)) {
            errors.push("Zone ID must be a valid MongoDB ObjectId");
        } else {
            req.query.zoneId = normalizeTrim(zoneId);
        }
    }

    // Type validation
    if (type !== undefined) {
        if (!isNonEmptyString(type) || !VALID_TYPES.includes(type.toUpperCase())) {
            errors.push(`Type must be one of: ${VALID_TYPES.join(", ")}`);
        } else {
            req.query.type = type.toUpperCase();
        }
    }

    // Status validation
    if (status !== undefined) {
        if (!isNonEmptyString(status) || !VALID_STATUS.includes(status.toUpperCase())) {
            errors.push(`Status must be one of: ${VALID_STATUS.join(", ")}`);
        } else {
            req.query.status = status.toUpperCase();
        }
    }

    // Date range validation
    if (from !== undefined) {
        if (!isValidDate(from)) {
            errors.push("From date must be a valid date");
        } else {
            req.query.from = new Date(from);
        }
    }

    if (to !== undefined) {
        if (!isValidDate(to)) {
            errors.push("To date must be a valid date");
        } else {
            req.query.to = new Date(to);
        }
    }

    // Date range logic validation
    if (req.query.from && req.query.to && req.query.from > req.query.to) {
        errors.push("From date must be before or equal to To date");
    }

    // Pagination validation
    if (page !== undefined) {
        const parsedPage = Number(page);
        if (!Number.isInteger(parsedPage) || parsedPage < 1) {
            errors.push("Page must be an integer >= 1");
        } else {
            req.query.page = parsedPage;
        }
    } else {
        req.query.page = 1;
    }

    if (limit !== undefined) {
        const parsedLimit = Number(limit);
        if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            errors.push("Limit must be an integer between 1 and 100");
        } else {
            req.query.limit = parsedLimit;
        }
    } else {
        req.query.limit = 10;
    }

    // Sort validation
    if (sortBy !== undefined) {
        if (!isNonEmptyString(sortBy) || !VALID_SORT_BY.includes(sortBy)) {
            errors.push(`SortBy must be one of: ${VALID_SORT_BY.join(", ")}`);
        } else {
            req.query.sortBy = sortBy;
        }
    } else {
        req.query.sortBy = "incidentDate";
    }

    if (sortOrder !== undefined) {
        if (!isNonEmptyString(sortOrder) || !VALID_SORT_ORDER.includes(sortOrder.toLowerCase())) {
            errors.push(`SortOrder must be one of: ${VALID_SORT_ORDER.join(", ")}`);
        } else {
            req.query.sortOrder = sortOrder.toLowerCase();
        }
    } else {
        req.query.sortOrder = "desc";
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: errors
        });
    }

    next();
};

export const validateRiskMapQuery = (req, res, next) => {
    const errors = [];
    const { protectedAreaId, from, to } = req.query || {};

    // Protected Area ID validation (required)
    if (!protectedAreaId || !isNonEmptyString(protectedAreaId)) {
        errors.push("Protected Area ID is required");
    } else if (!isValidObjectId(protectedAreaId)) {
        errors.push("Protected Area ID must be a valid MongoDB ObjectId");
    } else {
        req.query.protectedAreaId = normalizeTrim(protectedAreaId);
    }

    // Date range validation
    if (from !== undefined) {
        if (!isValidDate(from)) {
            errors.push("From date must be a valid date");
        } else {
            req.query.from = new Date(from);
        }
    }

    if (to !== undefined) {
        if (!isValidDate(to)) {
            errors.push("To date must be a valid date");
        } else {
            req.query.to = new Date(to);
        }
    }

    // Date range logic validation
    if (req.query.from && req.query.to && req.query.from > req.query.to) {
        errors.push("From date must be before or equal to To date");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: errors
        });
    }

    next();
};
