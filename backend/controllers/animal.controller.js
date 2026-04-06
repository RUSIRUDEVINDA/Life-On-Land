import mongoose from "mongoose";
import * as service from "../services/animal.service.js";
import * as repo from "../repositories/animal.repository.js";
import { buildAnimalQuery } from "../utils/queryBuilder.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cloudinary } from "../config/cloudinary.js";

// @desc    Register a new animal
// @route   POST /api/animals
// @access  Private (Admin)
export const createAnimal = asyncHandler(async (req, res) => {
    const animalData = { ...req.body };
    if (req.file) {
        animalData.photo = req.file.path;
        animalData.photoPublicId = req.file.filename;
    }
    const result = await service.createAnimal(animalData);
    res.status(201).json({
        message: "Animal created successfully",
        animal: result.animal,
    });
});

// @desc    Get all animals with pagination and filters
// @route   GET /api/animals
// @access  Private (Admin, Ranger)
export const getAnimals = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = { createdAt: -1 };

    const query = buildAnimalQuery(req.query);
    const skip = (page - 1) * limit;

    const [total, animals] = await Promise.all([ // pararelly fetch total count and paginated data
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

// @desc    Get animal by tag ID
// @route   GET /api/animals/:tagId
// @access  Private (Admin, Ranger)
export const getAnimalById = asyncHandler(async (req, res) => {
    const { tagId } = req.params;

    const animal = await repo.findByTagId(tagId);

    if (!animal) {
        const error = new Error("Animal not found");
        error.statusCode = 404;
        throw error;
    }

    res.json({ animal });
});


// @desc    Update animal record
// @route   PUT /api/animals/:tagId
// @access  Private (Admin)
export const updateAnimal = asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
        // Fetch existing animal to get old photo ID
        const existingAnimal = await repo.findByTagId(tagId);
        if (existingAnimal && existingAnimal.photoPublicId) {
            try {
                await cloudinary.uploader.destroy(existingAnimal.photoPublicId);
            } catch (err) {
                console.error("Failed to delete old animal photo from Cloudinary:", err);
            }
        }
        updateData.photo = req.file.path;
        updateData.photoPublicId = req.file.filename;
    }

    const animal = await service.updateAnimal(tagId, updateData);
    res.json({ message: "Animal updated successfully", animal });
});

// @desc    Delete animal record
// @route   DELETE /api/animals/:tagId
// @access  Private (Admin)
export const deleteAnimal = asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    const animal = await service.deleteAnimal(tagId);

    res.json({
        message: "Animal deleted successfully",
        animal
    });
});
