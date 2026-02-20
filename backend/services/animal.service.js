import * as repo from "../repositories/animal.repository.js";

export const createAnimal = async (data) => {
    const existing = await repo.findByTagId(data.tagId);
    if (existing) {
        const error = new Error("Animal tagId already exists");
        error.statusCode = 409;
        throw error;
    }

    return repo.create(data);
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

    const updatedAnimal = await repo.updateByTagId(tagId, { $set: data });
    if (!updatedAnimal) {
        const error = new Error("Animal not found");
        error.statusCode = 404;
        throw error;
    }

    return updatedAnimal;
};


export const deleteAnimal = async (tagId) => {
    const animal = await repo.deleteByTagId(tagId);

    if (!animal) {
        const error = new Error("Animal not found");
        error.statusCode = 404;
        throw error;
    }

    return animal;
};
