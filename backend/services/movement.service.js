import mongoose from "mongoose";
import movementRepo from "../repositories/movement.repository.js";
import zoneRepo from "../repositories/zone.repository.js";
import animalRepo from "../repositories/animal.repository.js";
import * as alertService from "./alert.service.js";

/*
 * @desc    Service to record a new animal movement
 * @param   {Object} data - Movement coordinates and tag metadata
 * @returns {Object} Saved movement document
 */
export const createMovement = async (data) => {
    return movementRepo.create(data);
};

/*
 * @desc    Service to ingest a movement with zone validation
 * @param   {Object} data - Movement coordinates and tag metadata
 * @returns {Object} Saved movement document
 */
export const ingestMovement = async (data) => {
    const tagId = data.tagId;
    const { lat, lng } = data;

    // Field validation: Ensure identity and coordinates are present
    if (!tagId) {
        throw new Error("Missing tagId in movement data");
    }

    if (lat === undefined || lat === null || lng === undefined || lng === null) {
        throw new Error("Missing lat/lng in movement data");
    }

    // Strict boundary check: coordinates MUST map to an active zone
    const zone = await zoneRepo.findZoneByCoordinates(lng, lat);

    if (!zone) {
        throw new Error(
            `Movement rejected: coordinates (${lat}, ${lng}) are not inside any active zone. ` +
            `Animals must remain within zone boundaries.`
        );
    }

    data.tagId = tagId;
    data.zoneId = zone._id;
    data.protectedAreaId = zone.protectedAreaId;

    const movement = await movementRepo.create(data);

    if (zone.zoneType === "CORE" || zone.name.toLowerCase().includes("risk")) {
        console.log(`ALERT: Animal ${tagId} entered high risk zone ${zone.name}`);
        await alertService.triggerMovementAlert(movement, zone);
    }

    return movement;
};

/*
 * @desc    Service to fetch movement history for a specific animal
 * @param   {string} tagId - Animal tag identifier
 * @param   {Object} query - Time range and pagination parameters
 * @returns {Object} List of movements with metadata
 */
export const getMovementHistory = async (tagId, query) => {
    const animal = await animalRepo.findByTagId(tagId);
    if (!animal) {
        const error = new Error(`Animal with tagId ${tagId} not found`);
        error.statusCode = 404;
        throw error;
    }

    const { from, to, page = 1, limit = 50 } = query;
    const filter = {};
    if (from || to) {
        filter.timestamp = {};
        if (from) filter.timestamp.$gte = new Date(from);
        if (to) filter.timestamp.$lte = new Date(to);
    }
    const skip = (page - 1) * limit;
    const sort = { timestamp: -1 };

    const [total, movements] = await Promise.all([
        movementRepo.count({ tagId, ...filter }),
        movementRepo.findByAnimalIdWithPagination(tagId, filter, sort, skip, limit)
    ]);

    return { movements, total, page, limit, pages: Math.ceil(total / limit) };
};

export const searchMovements = async (query) => {
    const { protectedAreaId, from, to, page = 1, limit = 50 } = query;
    const filter = {};
    if (protectedAreaId) filter.protectedAreaId = protectedAreaId;
    if (from || to) {
        filter.timestamp = {};
        if (from) filter.timestamp.$gte = new Date(from);
        if (to) filter.timestamp.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const sort = { timestamp: -1 };

    const [total, movements] = await Promise.all([
        movementRepo.count(filter),
        movementRepo.findWithPagination(filter, sort, skip, limit)
    ]);

    return { movements, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getMovementSummary = async (query) => {
    const { protectedAreaId, from, to } = query;
    const match = {};
    if (protectedAreaId) match.protectedAreaId = new mongoose.Types.ObjectId(protectedAreaId);
    if (from || to) {
        match.timestamp = {};
        if (from) match.timestamp.$gte = new Date(from);
        if (to) match.timestamp.$lte = new Date(to);
    }

    return await movementRepo.aggregateSummary(match);
};

export const getLatestMovements = async (query = {}) => {
    const { protectedAreaId } = query;
    const match = {};
    if (protectedAreaId) match.protectedAreaId = new mongoose.Types.ObjectId(protectedAreaId);

    return await movementRepo.findLatestForAllAnimals(match);
};