import mongoose from "mongoose";
import * as service from "../services/animal.service.js";
import * as repo from "../repositories/animal.repository.js";
import { buildAnimalQuery } from "../utils/queryBuilder.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const handleAnimalServiceError = (res, error) => {
    if (error.message === "TAG_EXISTS") {
        return res.status(409).json({ error: "Animal tagId already exists" });
    }

    if (error.message === "NOT_FOUND") {
        return res.status(404).json({ error: "Animal not found" });
    }

    throw error;
};

export const createAnimal = asyncHandler(async (req, res) => {
    let animal;

    try {
        animal = await service.createAnimal(req.body);
    } catch (error) {
        return handleAnimalServiceError(res, error);
    }

    res.status(201).json({
        message: "Animal registered",
        animal
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

    res.json({ data: animals, pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 } });
});

export const getAnimalById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid animal id" });

    const animal = await repo.findById(id);
    if (!animal)
        return res.status(404).json({ error: "Animal not found" });

    res.json({ animal });
});

export const updateAnimal = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid animal id" });

    let animal;

    try {
        animal = await service.updateAnimal(id, req.body);
    } catch (error) {
        return handleAnimalServiceError(res, error);
    }

    res.json({ message: "Animal updated", animal });
});

export const deleteAnimal = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid animal id" });

    let animal;

    try {
        animal = await service.deleteAnimal(id);
    } catch (error) {
        return handleAnimalServiceError(res, error);
    }

    res.json({
        message: "Animal deleted permanently",
        animal
    });
});
