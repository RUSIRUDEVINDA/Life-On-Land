import * as repo from "../repositories/animal.repository.js";
import ProtectedArea from "../models/ProtectedArea.model.js";
import Zone from "../models/Zone.model.js";

export const createAnimal = async (data) => {
    const existing = await repo.findByTagId(data.tagId);
    if (existing) {
        const error = new Error("Animal tagId already exists");
        error.statusCode = 409;
        throw error;
    }

    // Fetch protected area and zone details
    const protectedArea = await ProtectedArea.findById(data.protectedAreaId);
    if (!protectedArea || protectedArea.status !== "ACTIVE") {
        const error = new Error("Protected Area not found or inactive");
        error.statusCode = 404;
        throw error;
    }

    const zone = await Zone.findById(data.zoneId);
    if (!zone || zone.status !== "ACTIVE") {
        const error = new Error("Zone not found or inactive");
        error.statusCode = 404;
        throw error;
    }

    // Verify that the zone belongs to the protected area
    if (zone.protectedAreaId.toString() !== data.protectedAreaId.toString()) {
        const error = new Error("Validation failed: The specified Zone does not belong to the selected Protected Area");
        error.statusCode = 400;
        throw error;
    }

    // Add names to animal data for storage
    const animalData = {
        ...data,
        protectedAreaName: protectedArea.name,
        zoneName: zone.name
    };

    const animal = await repo.create(animalData);

    return {
        animal,
        protectedAreaDetails: protectedArea,
        zoneDetails: zone
    };
};

export const updateAnimal = async (tagId, data) => {
    const currentAnimal = await repo.findByTagId(tagId);
    if (!currentAnimal) {
        const error = new Error("Animal not found");
        error.statusCode = 404;
        throw error;
    }

    if (data.tagId && data.tagId !== currentAnimal.tagId) {
        const existing = await repo.findByTagId(data.tagId);
        if (existing) {
            const error = new Error("Animal tagId already exists");
            error.statusCode = 409;
            throw error;
        }
    }

    // Cross-validate PA and Zone if either is being updated
    const targetPAId = data.protectedAreaId || currentAnimal.protectedAreaId.toString();
    const targetZoneId = data.zoneId || currentAnimal.zoneId.toString();

    if (data.protectedAreaId || data.zoneId) {
        const zone = await Zone.findById(targetZoneId);
        if (!zone) {
            const error = new Error("Zone not found");
            error.statusCode = 404;
            throw error;
        }
        if (zone.protectedAreaId.toString() !== targetPAId) {
            const error = new Error("Validation failed: The specified Zone does not belong to the target Protected Area");
            error.statusCode = 400;
            throw error;
        }

        // Update names if IDs are changed
        if (data.protectedAreaId) {
            const pa = await ProtectedArea.findById(data.protectedAreaId);
            if (!pa || pa.status !== "ACTIVE") {
                const error = new Error("Protected Area not found or inactive");
                error.statusCode = 404;
                throw error;
            }
            data.protectedAreaName = pa.name;
        }

        if (data.zoneId) {
            if (zone.status !== "ACTIVE") {
                const error = new Error("Zone is inactive");
                error.statusCode = 400;
                throw error;
            }
            data.zoneName = zone.name;
        } else if (data.protectedAreaId) {
            // If PA changed but zone stayed "same", we already validated they match,
            // but we might still want to refresh the zone name just in case, 
            // though it's likely already correct if the IDs match.
            data.zoneName = zone.name;
        }
    }

    const updatedAnimal = await repo.updateByTagId(tagId, { $set: data });
    if (!updatedAnimal) {
        const error = new Error("Animal not found");
        error.statusCode = 404;
        throw error;
    }

    return updatedAnimal;
};


export const deleteAnimal = async (tagId) => {
    console.log("Service: Deleting animal with tagId:", tagId);
    const animal = await repo.deleteByTagId(tagId);
    console.log("Service: Result from repo.deleteByTagId:", animal);

    if (!animal) {
        console.log("Service: Animal not found for deletion");
        const error = new Error("Animal not found");
        error.statusCode = 404;
        throw error;
    }
};