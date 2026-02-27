import mongoose from "mongoose";

// This function builds a MongoDB query object based on the provided query parameters.
export const buildAnimalQuery = (queryParams) => {
    const {
        species,
        status,
        protectedAreaId,
        zoneId,
        zoneName,
        protectedAreaName,
        tagId,
        sex,
        ageClass,
        endemicToSriLanka
    } = queryParams;
    const query = {};

    if (species) {
        query.species = new RegExp(`^${species}$`, "i");
    }

    if (tagId) {
        query.tagId = new RegExp(`^${tagId}$`, "i");
    }

    if (status) query.status = status;
    if (sex) query.sex = sex;
    if (ageClass) query.ageClass = ageClass;

    if (endemicToSriLanka !== undefined) {
        query.endemicToSriLanka = endemicToSriLanka === "true";
    }

    if (protectedAreaId) {
        query.protectedAreaId =
            new mongoose.Types.ObjectId(String(protectedAreaId));
    }

    if (zoneId) {
        query.zoneId = new mongoose.Types.ObjectId(String(zoneId));
    }

    if (zoneName) {
        query.zoneName = new RegExp(`^${zoneName}$`, "i");
    }

    if (protectedAreaName) {
        query.protectedAreaName = new RegExp(`^${protectedAreaName}$`, "i");
    }

    return query;
};
