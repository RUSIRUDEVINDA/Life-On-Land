import Animal from "../models/Animal.js";

export const create = (data) => Animal.create(data);

export const findByTagId = (tagId) =>
    Animal.findOne({ tagId });

export const findByTagIdExceptId = (tagId, id) =>
    Animal.findOne({ tagId, _id: { $ne: id } });

export const findById = (id) =>
    Animal.findById(id);

export const findWithPagination = (query, sort, skip, limit) =>
    Animal.find(query).sort(sort).skip(skip).limit(limit);

export const count = (query) =>
    Animal.countDocuments(query);

export const updateByTagId = (tagId, update) =>
    Animal.findOneAndUpdate(
        { tagId },
        update,
        { new: true, runValidators: true }
    );

export const deleteByTagId = (tagId) => {
    console.log("Repo: Calling findOneAndDelete for tagId:", tagId);
    return Animal.findOneAndDelete({ tagId });
};

export const deleteById = (id) =>
    Animal.findByIdAndDelete(id);
