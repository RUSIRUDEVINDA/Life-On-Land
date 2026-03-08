import areaRepo from "../repositories/protectedArea.repository.js";

/*
 * @desc    Get all protected areas
 * @returns {Array} List of active protected areas
 */
export const getAllProtectedAreas = async () => {
  return areaRepo.findAll();
};

/*
 * @desc    Create a new protected area
 */
export const createProtectedArea = async (payload) => {
  return areaRepo.create(payload);
};

/*
 * @desc    Get a protected area by ID
 */
export const getProtectedAreaById = async (id) => {
  const area = await areaRepo.findById(id);
  if (!area) {
    const error = new Error("Protected area not found");
    error.statusCode = 404;
    throw error;
  }
  return area;
};

/*
 * @desc    Update a protected area
 */
export const updateProtectedArea = async (id, payload) => {
  const area = await areaRepo.updateById(id, payload);
  if (!area) {
    const error = new Error("Protected area not found");
    error.statusCode = 404;
    throw error;
  }
  return area;
};

/*
 * @desc    Soft delete a protected area
 */
export const deleteProtectedArea = async (id) => {
  const area = await areaRepo.softDelete(id);
  if (!area) {
    const error = new Error("Protected area not found");
    error.statusCode = 404;
    throw error;
  }
  return area;
};