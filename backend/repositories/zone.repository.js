import Zone from "../models/Zone.model.js";
import ProtectedArea from "../models/ProtectedArea.model.js";

// Check if protected area exists and is active
const ensureProtectedAreaActive = async (protectedAreaId) => {
  return await ProtectedArea.findOne({
    _id: protectedAreaId,
    isDeleted: false,
  });
};

// List zones by protected area
const listZonesByProtectedAreaId = async (protectedAreaId) => {
  return await Zone.find({
    protectedArea: protectedAreaId,
    isDeleted: false,
  });
};

// Create zone
const createZone = async (protectedAreaId, data) => {
  return await Zone.create({
    ...data,
    protectedArea: protectedAreaId,
  });
};

// Update zone
const updateZone = async (zoneId, payload) => {
  return await Zone.findOneAndUpdate(
    { _id: zoneId, isDeleted: false },
    payload,
    { new: true }
  );
};

// Soft delete zone
const softDeleteZone = async (zoneId) => {
  return await Zone.findOneAndUpdate(
    { _id: zoneId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
};

const findZoneByCoordinates = async (lng, lat) => {
  return await Zone.findOne({
    status: { $ne: "DELETED" },
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
    },
  });
};

export {
  ensureProtectedAreaActive,
  listZonesByProtectedAreaId,
  createZone,
  updateZone,
  softDeleteZone,
  findZoneByCoordinates,
};
