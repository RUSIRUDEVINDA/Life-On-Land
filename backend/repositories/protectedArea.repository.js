import ProtectedArea from "../models/ProtectedArea.models.js";

// LIST
const listProtectedAreas = async () => {
  return await ProtectedArea.find({
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
  });
};

// CREATE
const createProtectedArea = async (data) => {
  return await ProtectedArea.create({
    ...data,
    isDeleted: false
  });
};

// GET BY ID
const getProtectedAreaById = async (id) => {
  return await ProtectedArea.findOne({
    _id: id,
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
  });
};

// UPDATE
const updateProtectedArea = async (id, payload) => {
  return await ProtectedArea.findOneAndUpdate(
    {
      _id: id,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    },
    payload,
    { new: true }
  );
};

// SOFT DELETE
const softDeleteProtectedArea = async (id) => {
  return await ProtectedArea.findOneAndUpdate(
    {
      _id: id,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    },
    { isDeleted: true },
    { new: true }
  );
};

export {
  listProtectedAreas,
  createProtectedArea,
  getProtectedAreaById,
  updateProtectedArea,
  softDeleteProtectedArea,
};
