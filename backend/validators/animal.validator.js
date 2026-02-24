import mongoose from "mongoose";

const VALID_SEX = ["MALE", "FEMALE", "UNKNOWN"];
const VALID_AGE_CLASSES = ["INFANT", "JUVENILE", "SUBADULT", "ADULT", "UNKNOWN"];
const VALID_STATUS = ["ACTIVE", "INACTIVE", "RETIRED", "DECEASED"];

const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

const normalizeUpper = (value) =>
    typeof value === "string" ? value.trim().toUpperCase() : value;

const normalizeTrim = (value) =>
    typeof value === "string" ? value.trim() : value;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const validateCreateAnimal = (req, res, next) => {
    const errors = [];
    const { tagId, species, sex, ageClass, protectedAreaId, zoneId, status } = req.body || {};

    if (!isNonEmptyString(tagId)) errors.push("tagId is required");
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

    req.body = {
        tagId: normalizeUpper(tagId),
        species: normalizeTrim(species),
        sex: normalizedSex,
        ageClass: normalizedAgeClass,
        protectedAreaId: normalizeTrim(protectedAreaId),
        zoneId: normalizeTrim(zoneId),
        status: normalizedStatus
    };

    next();
};

export const validateUpdateAnimal = (req, res, next) => {
    const errors = [];
    const { tagId, species, sex, ageClass, protectedAreaId, zoneId, status } = req.body || {};

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
    }

    const updates = {};

    if (tagId !== undefined) {
        if (!isNonEmptyString(tagId)) errors.push("tagId must be a non-empty string");
        else updates.tagId = normalizeUpper(tagId);
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
            errors.push("status must be ACTIVE, INACTIVE, RETIRED, or DECEASED");
        } else {
            updates.status = normalizedStatus;
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
            errors.push("status must be ACTIVE, INACTIVE, RETIRED, or DECEASED");
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
