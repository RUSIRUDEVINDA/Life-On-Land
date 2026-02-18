import mongoose from "mongoose";

// This function builds a MongoDB query object based on the provided query parameters.
export const buildAnimalQuery = (queryParams) => {
    const { species, status, protectedAreaId } = queryParams;
    const query = {};

    if (species) {
        query.species = new RegExp(`^${species}$`, "i");
    }

    if (status) query.status = status;

    if (protectedAreaId) {
        query.protectedAreaId =
            new mongoose.Types.ObjectId(protectedAreaId);
    }

    return query;
};
