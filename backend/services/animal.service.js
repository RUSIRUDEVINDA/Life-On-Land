import * as repo from "../repositories/animal.repository.js";
import ProtectedArea from "../models/ProtectedArea.model.js";
import Zone from "../models/Zone.model.js";

/*
 * @desc    Service to create a new animal record
 * @param   {Object} data - Animal data from request body
 * @returns {Object} Created animal and related area/zone details
 */
export const createAnimal = async (data) => {
    // Check if tagId is unique
    const existing = await repo.findByTagId(data.tagId);
    if (existing) {
        const error = new Error("Animal tagId already exists");
        error.statusCode = 409;
        throw error;
    }

    // Validate if the protected area exists and is active
    const protectedArea = await ProtectedArea.findById(data.protectedAreaId);
    if (!protectedArea || protectedArea.status !== "ACTIVE") {
        const error = new Error("Protected Area not found or inactive");
        error.statusCode = 404;
        throw error;
    }

    // Validate if the zone exists and is active
    const zone = await Zone.findById(data.zoneId);
    if (!zone || zone.status !== "ACTIVE") {
        const error = new Error("Zone not found or inactive");
        error.statusCode = 404;
        throw error;
    }

    // Verify geographical consistency: zone must belong to the protected area
    if (zone.protectedAreaId.toString() !== data.protectedAreaId.toString()) {
        const error = new Error("Validation failed: The specified Zone does not belong to the selected Protected Area");
        error.statusCode = 400;
        throw error;
    }

    // Prepare data with denormalized names for faster querying
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

/*
 * @desc    Service to update an existing animal record
 * @param   {string} tagId - Current tag ID of the animal
 * @param   {Object} data - Fields to update
 * @returns {Object} Updated animal document
 */
export const updateAnimal = async (tagId, data) => {
    const currentAnimal = await repo.findByTagId(tagId);
    if (!currentAnimal) {
        const error = new Error("Animal not found");
        error.statusCode = 404;
        throw error;
    }

    // If tagId is being updated, ensure new one isn't taken
    if (data.tagId && data.tagId !== currentAnimal.tagId) {
        const existing = await repo.findByTagId(data.tagId);
        if (existing) {
            const error = new Error("Animal tagId already exists");
            error.statusCode = 409;
            throw error;
        }
    }

    // Protected Area ID is immutable
    if (data.protectedAreaId && data.protectedAreaId.toString() !== currentAnimal.protectedAreaId.toString()) {
        const error = new Error("protectedAreaId is immutable and cannot be updated");
        error.statusCode = 400;
        throw error;
    }

    // Ensure protectedAreaId is NOT in the final update object to be extra safe
    delete data.protectedAreaId;
    delete data.protectedAreaName;

    // Cross-validate Zone if it is modified
    if (data.zoneId) {
        const zone = await Zone.findById(data.zoneId);
        if (!zone) {
            const error = new Error("Zone not found");
            error.statusCode = 404;
            throw error;
        }

        if (zone.status !== "ACTIVE") {
            const error = new Error("Zone is inactive");
            error.statusCode = 400;
            throw error;
        }

        // Zone must belong to the CURRENT Protected Area (since PA can't change)
        if (zone.protectedAreaId.toString() !== currentAnimal.protectedAreaId.toString()) {
            const error = new Error("Validation failed: The specified Zone does not belong to the animal's Protected Area");
            error.statusCode = 400;
            throw error;
        }

        // Sync redundant names
        data.zoneName = zone.name;
    }

    const updatedAnimal = await repo.updateByTagId(tagId, { $set: data });
    if (!updatedAnimal) {
        const error = new Error("Animal not found");
        error.statusCode = 404;
        throw error;
    }

    return updatedAnimal;
};


/*
 * @desc    Service to delete an animal record
 * @param   {string} tagId - Tag ID of the animal to delete
 */
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