import mongoose from "mongoose";
import * as service from "../services/animal.service.js";
import * as repo from "../repositories/animal.repository.js";
import { buildAnimalQuery } from "../utils/queryBuilder.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createAnimal = asyncHandler(async (req, res) => {
    const result = await service.createAnimal(req.body);
    res.status(201).json({
        message: "Animal created successfully",
        animal: result.animal,
    });
});

export const getAnimals = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = { createdAt: -1 };

    const query = buildAnimalQuery(req.query);
    const skip = (page - 1) * limit;

    const [total, animals] = await Promise.all([
        repo.count(query),
        repo.findWithPagination(query, sort, skip, limit)
    ]);

    // Map animals to include protected area and zone names
    const animalsWithDetails = animals.map(animal => ({
        ...animal.toObject(),
        protectedAreaName: animal.protectedAreaName,
        zoneName: animal.zoneName
    }));

    res.json({
        message: "Animals retrieved successfully",
        data: animalsWithDetails,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 }
    });
});

export const getAnimalById = asyncHandler(async (req, res) => {
    const { tagId } = req.params;

    const animal = await repo.findByTagId(tagId);
    if (!animal) {
        const error = new Error("Animal not found");
        error.statusCode = 404;
        throw error;
    }

    res.json({
        message: "Animal retrieved successfully",
        animal
    });
});

export const updateAnimal = asyncHandler(async (req, res) => {
    const { tagId } = req.params;

    const animal = await service.updateAnimal(tagId, req.body);
    res.json({ message: "Animal updated successfully", animal });
});

export const deleteAnimal = asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    console.log("Controller: Received delete request for tagId:", tagId);

    const animal = await service.deleteAnimal(tagId);
    console.log("Controller: Service returned deleted animal:", animal);

    res.json({
        message: "Animal deleted successfully",
        animal
    });
});