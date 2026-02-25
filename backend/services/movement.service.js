import * as movementRepo from "../repositories/movement.repository.js";
import * as zoneRepo from "../repositories/zone.repository.js";
import * as animalRepo from "../repositories/animal.repository.js";
import * as alertService from "./alert.service.js";

export const ingestMovement = async (data) => {
    const tagId = data.tagId;
    const { lat, lng } = data;

    if (!tagId) {
        throw new Error("Missing tagId in movement data");
    }

    if (lat === undefined || lat === null || lng === undefined || lng === null) {
        throw new Error("Missing lat/lng in movement data");
    }

    // Strict zone check — coordinates MUST be inside an active zone
    const zone = await zoneRepo.findZoneByCoordinates(lng, lat);

    if (!zone) {
        // Coordinates are outside every known zone — reject the movement
        throw new Error(
            `Movement rejected: coordinates (${lat}, ${lng}) are not inside any active zone. ` +
            `Animals must remain within zone boundaries.`
        );
    }

    // Enrich data with resolved zone and protected area
    data.tagId = tagId;
    data.zoneId = zone._id;
    data.protectedAreaId = zone.protectedAreaId;

    const movement = await movementRepo.create(data);

    // Trigger alert if in a high-risk zone
    if (zone.zoneType === "CORE" || zone.name.toLowerCase().includes("risk")) {
        console.log(`ALERT: Animal ${tagId} entered high risk zone ${zone.name}`);
        await alertService.triggerMovementAlert(movement, zone);
    }

    return movement;
};

export const getMovementHistory = async (tagId, query) => {
    // Check if animal exists first
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
    const { protectedAreaId, species, from, to, page = 1, limit = 50 } = query;
    const filter = {};
    if (protectedAreaId) filter.protectedAreaId = protectedAreaId;
    if (from || to) {
        filter.timestamp = {};
        if (from) filter.timestamp.$gte = new Date(from);
        if (to) filter.timestamp.$lte = new Date(to);
    }

    // species filter requires lookup or denormalization
    // For now, let's just search by what we have in Movement

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
    if (protectedAreaId) match.protectedAreaId = protectedAreaId;
    if (from || to) {
        match.timestamp = {};
        if (from) match.timestamp.$gte = new Date(from);
        if (to) match.timestamp.$lte = new Date(to);
    }

    return await movementRepo.aggregateSummary(match);
};