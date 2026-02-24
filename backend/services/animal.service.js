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
    if (!protectedArea) {
        const error = new Error("Protected Area not found");
        error.statusCode = 404;
        throw error;
    }

    const zone = await Zone.findById(data.zoneId);
    if (!zone) {
        const error = new Error("Zone not found");
        error.statusCode = 404;
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

    // Update names if IDs are changed
    if (data.protectedAreaId) {
        const pa = await ProtectedArea.findById(data.protectedAreaId);
        if (!pa) {
            const error = new Error("Protected Area not found");
            error.statusCode = 404;
            throw error;
        }
        data.protectedAreaName = pa.name;
    }

    if (data.zoneId) {
        const zone = await Zone.findById(data.zoneId);
        if (!zone) {
            const error = new Error("Zone not found");
            error.statusCode = 404;
            throw error;
        }
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
