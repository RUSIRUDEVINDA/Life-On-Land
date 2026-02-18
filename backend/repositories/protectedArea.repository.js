import ProtectedArea from "../models/ProtectedArea.models.js";

const listProtectedAreas = async () => {
  return await ProtectedArea.find({ isDeleted: false });
};

const createProtectedArea = async (data) => {
  return await ProtectedArea.create(data);
};

const getProtectedAreaById = async (id) => {
  return await ProtectedArea.findOne({ _id: id, isDeleted: false });
};

const updateProtectedArea = async (id, payload) => {
  return await ProtectedArea.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true }
  );
};

const softDeleteProtectedArea = async (id) => {
  return await ProtectedArea.findOneAndUpdate(
    { _id: id, isDeleted: false },
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
