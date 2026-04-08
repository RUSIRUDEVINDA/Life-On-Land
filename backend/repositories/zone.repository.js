import Zone from "../models/Zone.model.js";
import ProtectedArea from "../models/ProtectedArea.model.js";

// Check if protected area exists and is ACTIVE
export const ensureProtectedAreaActive = async (protectedAreaId) => {
  return await ProtectedArea.findOne({
    _id: protectedAreaId,
    status: "ACTIVE",
  });
};

// List zones by protected area
export const listZonesByProtectedAreaId = async (protectedAreaId) => {
  return await Zone.find({
    protectedAreaId: protectedAreaId,
    status: "ACTIVE",
  });
};

// Create zone
export const createZone = async (protectedAreaId, data) => {
  return await Zone.create({
    ...data,
    protectedAreaId,
    status: "ACTIVE",
  });
};

// Update zone
export const updateZone = async (zoneId, payload) => {
  return await Zone.findOneAndUpdate(
    { _id: zoneId, status: "ACTIVE" },
    payload,
    { new: true }
  );
};

// Soft delete zone
export const softDeleteZone = async (zoneId) => {
  return await Zone.findOneAndDelete({ _id: zoneId, status: "ACTIVE" });
};

export const findZoneByCoordinates = async (lng, lat) => {
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

// findById used by zone service & mocking tests
export const findById = async (zoneId) => {
  return await Zone.findOne({ _id: zoneId, isDeleted: false });
};

// Default export — sinon can stub properties on this object
const zoneRepo = {
  ensureProtectedAreaActive,
  listZonesByProtectedAreaId,
  createZone,
  updateZone,
  softDeleteZone,
  findZoneByCoordinates,
  findById,
};

export default zoneRepo;