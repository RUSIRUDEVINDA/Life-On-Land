import Animal from "../models/Animal.js";

// Create a new animal document
const create = (data) => Animal.create(data);

// Find animal by tag ID
const findByTagId = (tagId) =>
    Animal.findOne({ tagId });

// Find animal by tag ID excluding a specific record (used in updates)
const findByTagIdExceptId = (tagId, id) =>
    Animal.findOne({ tagId, _id: { $ne: id } });

// Find animal by Mongo ID
const findById = (id) =>
    Animal.findById(id);

// Find animals with pagination and sorting
const findWithPagination = (query, sort, skip, limit) =>
    Animal.find(query).sort(sort).skip(skip).limit(limit);

// Count animals matching a query
const count = (query) =>
    Animal.countDocuments(query);

// Update animal by tag ID
const updateByTagId = (tagId, update) =>
    Animal.findOneAndUpdate(
        { tagId },
        update,
        { new: true, runValidators: true }
    );

// Delete animal by tag ID
const deleteByTagId = (tagId) => {
    console.log("Repo: Calling findOneAndDelete for tagId:", tagId);
    return Animal.findOneAndDelete({ tagId });
};

// Delete animal by Mongo ID
const deleteById = (id) =>
    Animal.findByIdAndDelete(id);

// Default export — sinon can stub properties on this object
const animalRepo = {
    create,
    findByTagId,
    findByTagIdExceptId,
    findById,
    findWithPagination,
    count,
    updateByTagId,
    deleteByTagId,
    deleteById,
};

export default animalRepo;