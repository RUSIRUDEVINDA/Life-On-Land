import * as movementRepo from "../repositories/movement.repository.js";
import * as zoneRepo from "../repositories/zone.repository.js";
import * as animalRepo from "../repositories/animal.repository.js";

export const ingestMovement = async (data) => {
    const tagId = data.tagId
    const { lat, lng } = data;

    if (!tagId) {
        throw new Error("Missing tagId or animalId in movement data");
    }

    // Ensure tagId is in the data object for mongoose validation
    data.tagId = tagId;

    // Find the zone for these coordinates
    const zone = await zoneRepo.findZoneByCoordinates(lng, lat);

    // Enrich data with zoneId and protectedAreaId from the zone or animal
    if (zone) {
        data.zoneId = zone._id;
        data.protectedAreaId = zone.protectedAreaId;
    } else {
        // If no zone, try to get protectedAreaId from the animal record
        const animal = await animalRepo.findByTagId(tagId);
        if (animal) {
            data.protectedAreaId = animal.protectedAreaId;
        }
    }

    const movement = await movementRepo.create(data);

    // Trigger alert if in a high-risk zone
    if (zone && (zone.zoneType === "CORE" || zone.name.toLowerCase().includes("risk"))) {
        console.log(`ALERT: Animal ${tagId} entered high risk zone ${zone.name}`);
    }

    return movement;
};

export const getMovementHistory = async (tagId, query) => {
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
