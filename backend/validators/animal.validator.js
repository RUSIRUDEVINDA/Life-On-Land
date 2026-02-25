import mongoose from "mongoose";

const VALID_SEX = ["MALE", "FEMALE", "UNKNOWN"];
const VALID_AGE_CLASSES = ["INFANT", "JUVENILE", "SUBADULT", "ADULT", "UNKNOWN"];
const VALID_STATUS = ["ACTIVE", "INACTIVE", "DECEASED"];

const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

const normalizeUpper = (value) =>
    typeof value === "string" ? value.trim().toUpperCase() : value;

const normalizeTrim = (value) =>
    typeof value === "string" ? value.trim() : value;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parseBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
    }
    return undefined;
};

/**
 * Validates tagId format
 * Rules:
 * - Must start with 'T' (case-insensitive, converted to uppercase)
 * - Total length: 3-20 characters (T + 2-19 alphanumeric)
 * - Alphanumeric only
 * - Numeric part cannot be all zeros (e.g., T00 is invalid)
 */
const isValidTagId = (value) => {
    if (!isNonEmptyString(value)) return false;

    const normalized = normalizeUpper(value);

    // Pattern: T followed by 2-19 alphanumeric characters, not all zeros
    // ^T matches T at start
    // (?!0+$) negative lookahead to exclude all zeros
    // [A-Z0-9]{2,19} matches 2-19 alphanumeric chars (making total length 3-20)
    const pattern = /^T(?!0+$)[A-Z0-9]{2,19}$/;

    return pattern.test(normalized);
};

/**
 * Middleware to validate tagId in route parameters
 * Rules:
 * - Must start with 'T' (case-insensitive, converted to uppercase)
 * - Total length: 3-20 characters
 * - Alphanumeric only
 * - Numeric part cannot be all zeros (e.g., T00 is invalid)
 */
export const validateTagIdParam = (req, res, next) => {
    const { tagId } = req.params;

    if (!tagId) {
        return res.status(400).json({
            error: "Validation failed",
            details: ["tagId is required in URL parameter"]
        });
    }

    if (!isValidTagId(tagId)) {
        return res.status(400).json({
            error: "Validation failed",
            details: [
                "tagId must start with 'T' followed by 2-19 alphanumeric characters",
                "Total length must be 3-20 characters",
                "Cannot be all zeros (e.g., T00 is invalid)",
                "Example of valid tagId: T001, T002, T123"
            ]
        });
    }

    // Normalize the tagId to uppercase
    req.params.tagId = normalizeUpper(tagId);

    next();
};

export const validateCreateAnimal = (req, res, next) => {
    const errors = [];
    const { tagId, species, sex, ageClass, protectedAreaId, zoneId, status, description, endemicToSriLanka } = req.body || {};

    if (!isNonEmptyString(tagId)) {
        errors.push("tagId is required");
    } else if (!isValidTagId(tagId)) {
        errors.push("tagId must start with 'T' followed by 2-19 alphanumeric characters (3-20 total length, cannot be all zeros, e.g., T00 is invalid)");
    }
    if (!isNonEmptyString(species)) errors.push("species is required");
    if (!isNonEmptyString(sex)) errors.push("sex is required");
    if (!isNonEmptyString(ageClass)) errors.push("ageClass is required");
    if (!isNonEmptyString(protectedAreaId)) errors.push("protectedAreaId is required");
    if (!isNonEmptyString(zoneId)) errors.push("zoneId is required");
    if (!isNonEmptyString(status)) errors.push("status is required");

    const normalizedSex = normalizeUpper(sex);
    const normalizedAgeClass = normalizeUpper(ageClass);
    const normalizedStatus = normalizeUpper(status);

    if (sex && !VALID_SEX.includes(normalizedSex)) {
        errors.push("sex must be MALE, FEMALE, or UNKNOWN");
    }
    if (ageClass && !VALID_AGE_CLASSES.includes(normalizedAgeClass)) {
        errors.push("ageClass must be INFANT, JUVENILE, SUBADULT, ADULT, or UNKNOWN");
    }
    if (status && !VALID_STATUS.includes(normalizedStatus)) {
        errors.push("status must be ACTIVE, INACTIVE, or DECEASED");
    }
    if (protectedAreaId && !isValidObjectId(protectedAreaId)) {
        errors.push("protectedAreaId must be a valid ObjectId");
    }
    if (zoneId && !isValidObjectId(zoneId)) {
        errors.push("zoneId must be a valid ObjectId");
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    // Validate optional description field
    if (description !== undefined && description !== null) {
        if (typeof description !== "string") {
            errors.push("description must be a string");
        }
    }

    // Validate optional endemicToSriLanka field
    let finalEndemic = false;
    if (endemicToSriLanka !== undefined && endemicToSriLanka !== null) {
        const parsed = parseBoolean(endemicToSriLanka);
        if (parsed === undefined) {
            errors.push("endemicToSriLanka must be a boolean string (true/false)");
        } else {
            finalEndemic = parsed;
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    req.body = {
        tagId: isNonEmptyString(tagId) ? normalizeUpper(tagId) : tagId,
        species: normalizeTrim(species),
        sex: normalizedSex,
        ageClass: normalizedAgeClass,
        protectedAreaId: normalizeTrim(protectedAreaId),
        zoneId: normalizeTrim(zoneId),
        status: normalizedStatus,
        description: description !== undefined && description !== null ? normalizeTrim(description) : null,
        endemicToSriLanka: finalEndemic
    };

    next();
};

export const validatePutAnimal = (req, res, next) => {
    const errors = [];
    const { species, sex, ageClass, protectedAreaId, zoneId, status, description, endemicToSriLanka } = req.body || {};

    // For PUT, we require all main fields
    if (!isNonEmptyString(species)) errors.push("species is required");
    if (!isNonEmptyString(sex)) errors.push("sex is required");
    if (!isNonEmptyString(ageClass)) errors.push("ageClass is required");
    if (!isNonEmptyString(protectedAreaId)) errors.push("protectedAreaId is required");
    if (!isNonEmptyString(zoneId)) errors.push("zoneId is required");
    if (!isNonEmptyString(status)) errors.push("status is required");

    const normalizedSex = normalizeUpper(sex);
    const normalizedAgeClass = normalizeUpper(ageClass);
    const normalizedStatus = normalizeUpper(status);

    if (sex && !VALID_SEX.includes(normalizedSex)) {
        errors.push("sex must be MALE, FEMALE, or UNKNOWN");
    }
    if (ageClass && !VALID_AGE_CLASSES.includes(normalizedAgeClass)) {
        errors.push("ageClass must be INFANT, JUVENILE, SUBADULT, ADULT, or UNKNOWN");
    }
    if (status && !VALID_STATUS.includes(normalizedStatus)) {
        errors.push("status must be ACTIVE, INACTIVE, or DECEASED");
    }
    if (protectedAreaId && !isValidObjectId(protectedAreaId)) {
        errors.push("protectedAreaId must be a valid ObjectId");
    }
    if (zoneId && !isValidObjectId(zoneId)) {
        errors.push("zoneId must be a valid ObjectId");
    }

    if (description !== undefined && description !== null && typeof description !== "string") {
        errors.push("description must be a string");
    }

    let finalEndemic = false;
    if (endemicToSriLanka !== undefined && endemicToSriLanka !== null) {
        const parsed = parseBoolean(endemicToSriLanka);
        if (parsed === undefined) {
            errors.push("endemicToSriLanka must be a boolean string (true/false)");
        } else {
            finalEndemic = parsed;
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    req.body = {
        species: normalizeTrim(species),
        sex: normalizedSex,
        ageClass: normalizedAgeClass,
        protectedAreaId: normalizeTrim(protectedAreaId),
        zoneId: normalizeTrim(zoneId),
        status: normalizedStatus,
        description: description !== undefined && description !== null ? normalizeTrim(description) : null,
        endemicToSriLanka: finalEndemic
    };

    next();
};

export const validatePatchAnimal = (req, res, next) => {
    const errors = [];
    const { tagId, species, sex, ageClass, protectedAreaId, zoneId, status, description, endemicToSriLanka } = req.body || {};

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
    }

    const updates = {};

    if (tagId !== undefined) {
        if (!isNonEmptyString(tagId)) {
            errors.push("tagId must be a non-empty string");
        } else if (!isValidTagId(tagId)) {
            errors.push("tagId must start with 'T' followed by 2-19 alphanumeric characters (3-20 total length, cannot be all zeros, e.g., T00 is invalid)");
        } else {
            updates.tagId = normalizeUpper(tagId);
        }
    }

    if (species !== undefined) {
        if (!isNonEmptyString(species)) errors.push("species must be a non-empty string");
        else updates.species = normalizeTrim(species);
    }

    if (sex !== undefined) {
        const normalizedSex = normalizeUpper(sex);
        if (!VALID_SEX.includes(normalizedSex)) {
            errors.push("sex must be MALE, FEMALE, or UNKNOWN");
        } else {
            updates.sex = normalizedSex;
        }
    }

    if (ageClass !== undefined) {
        const normalizedAgeClass = normalizeUpper(ageClass);
        if (!VALID_AGE_CLASSES.includes(normalizedAgeClass)) {
            errors.push("ageClass must be INFANT, JUVENILE, SUBADULT, ADULT, or UNKNOWN");
        } else {
            updates.ageClass = normalizedAgeClass;
        }
    }

    if (protectedAreaId !== undefined) {
        if (!isNonEmptyString(protectedAreaId) || !isValidObjectId(protectedAreaId)) {
            errors.push("protectedAreaId must be a valid ObjectId");
        } else {
            updates.protectedAreaId = normalizeTrim(protectedAreaId);
        }
    }

    if (zoneId !== undefined) {
        if (!isNonEmptyString(zoneId) || !isValidObjectId(zoneId)) {
            errors.push("zoneId must be a valid ObjectId");
        } else {
            updates.zoneId = normalizeTrim(zoneId);
        }
    }

    if (status !== undefined) {
        const normalizedStatus = normalizeUpper(status);
        if (!VALID_STATUS.includes(normalizedStatus)) {
            errors.push("status must be ACTIVE, INACTIVE, or DECEASED");
        } else {
            updates.status = normalizedStatus;
        }
    }

    if (description !== undefined) {
        if (description === null) {
            updates.description = null;
        } else if (typeof description !== "string") {
            errors.push("description must be a string");
        } else {
            updates.description = normalizeTrim(description);
        }
    }

    if (endemicToSriLanka !== undefined) {
        const parsed = parseBoolean(endemicToSriLanka);
        if (parsed === undefined) {
            errors.push("endemicToSriLanka must be a boolean or a boolean string (true/false)");
        } else {
            updates.endemicToSriLanka = parsed;
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    req.body = updates;
    next();
};

export const validateAnimalQuery = (req, res, next) => {
    const errors = [];
    const { species, status, protectedAreaId, page, limit, sort } = req.query || {};

    if (status) {
        const normalizedStatus = normalizeUpper(status);
        if (!VALID_STATUS.includes(normalizedStatus)) {
            errors.push("status must be ACTIVE, INACTIVE, or DECEASED");
        } else {
            req.query.status = normalizedStatus;
        }
    }

    if (species) {
        if (!isNonEmptyString(species)) {
            errors.push("species must be a non-empty string");
        } else {
            req.query.species = normalizeTrim(species);
        }
    }

    if (protectedAreaId) {
        if (!isValidObjectId(protectedAreaId)) {
            errors.push("protectedAreaId must be a valid ObjectId");
        } else {
            req.query.protectedAreaId = normalizeTrim(protectedAreaId);
        }
    }


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

    if (sort !== undefined) {
        if (!isNonEmptyString(sort)) {
            errors.push("sort must be a non-empty string");
        } else {
            req.query.sort = sort.trim();
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    next();
};
