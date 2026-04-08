import mongoose from "mongoose";

// This function builds a MongoDB query object based on the provided query parameters.
export const buildAnimalQuery = (queryParams) => {
    const { search, species, status, protectedAreaId, zoneId } = queryParams;
    const query = {};

    // Full-text search across tagId, species, and protectedAreaName
    if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
        query.$or = [
            { tagId: searchRegex },
            { species: searchRegex },
            { protectedAreaName: searchRegex },
        ];
    }

    // Exact species filter (overrides search on species if both provided)
    if (species) {
        query.species = new RegExp(`^${species}$`, "i");
    }

    if (status) query.status = status;

    if (protectedAreaId) {
        query.protectedAreaId =
            new mongoose.Types.ObjectId(String(protectedAreaId));
    }

    if (zoneId) {
        query.zoneId = new mongoose.Types.ObjectId(String(zoneId));
    }

    return query;
};
