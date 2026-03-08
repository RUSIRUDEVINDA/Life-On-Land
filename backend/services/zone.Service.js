import zoneRepo from "../repositories/zone.repository.js";

/*
 * @desc    Get a zone by ID
 * @returns {Object} Zone document
 */
export const getZoneById = async (zoneId) => {
  const zone = await zoneRepo.findById(zoneId);
  if (!zone) {
    const error = new Error("Zone not found");
    error.statusCode = 404;
    throw error;
  }
  return zone;
};

/*
 * @desc    List zones by protected area
 */
export const listZonesByProtectedArea = async (protectedAreaId) => {
  const area = await zoneRepo.ensureProtectedAreaActive(protectedAreaId);
  if (!area) {
    const error = new Error("Protected area not found or inactive");
    error.statusCode = 404;
    throw error;
  }
  return zoneRepo.listZonesByProtectedAreaId(protectedAreaId);
};

/*
 * @desc    Create a zone under a protected area
 */
export const createZone = async (protectedAreaId, payload) => {
  const area = await zoneRepo.ensureProtectedAreaActive(protectedAreaId);
  if (!area) {
    const error = new Error("Protected area not found or inactive");
    error.statusCode = 404;
    throw error;
  }
  return zoneRepo.createZone(protectedAreaId, payload);
};

/*
 * @desc    Update a zone
 */
export const updateZone = async (zoneId, payload) => {
  const zone = await zoneRepo.updateZone(zoneId, payload);
  if (!zone) {
    const error = new Error("Zone not found");
    error.statusCode = 404;
    throw error;
  }
  return zone;
};

/*
 * @desc    Soft delete a zone
 */
export const deleteZone = async (zoneId) => {
  const zone = await zoneRepo.softDeleteZone(zoneId);
  if (!zone) {
    const error = new Error("Zone not found");
    error.statusCode = 404;
    throw error;
  }
  return zone;
};