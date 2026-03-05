import Zone from "../models/Zone.model.js";
import ProtectedArea from "../models/ProtectedArea.model.js";

// Check if protected area exists and is ACTIVE
const ensureProtectedAreaActive = async (protectedAreaId) => {
  return await ProtectedArea.findOne({
    _id: protectedAreaId,
    status: "ACTIVE",
  });
};

// List zones by protected area
const listZonesByProtectedAreaId = async (protectedAreaId) => {
  return await Zone.find({
    protectedAreaId: protectedAreaId,
    status: "ACTIVE",
  });
};

// Create zone
const createZone = async (protectedAreaId, data) => {
  return await Zone.create({
    ...data,
    protectedAreaId,
    status: "ACTIVE",
  });
};

// Update zone
const updateZone = async (zoneId, payload) => {
  return await Zone.findOneAndUpdate(
    { _id: zoneId, status: "ACTIVE" },
    payload,
    { new: true }
  );
};

// Soft delete zone
const softDeleteZone = async (zoneId) => {
  return await Zone.findOneAndDelete({ _id: zoneId, status: "ACTIVE" });
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
