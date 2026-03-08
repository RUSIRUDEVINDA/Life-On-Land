import ProtectedArea from "../models/ProtectedArea.model.js";
import Zone from "../models/Zone.model.js";

// LIST
const listProtectedAreas = async () => {
  return await ProtectedArea.find({ status: "ACTIVE" }).sort({ createdAt: -1 });
};

// CREATE
const createProtectedArea = async (data) => {
  return await ProtectedArea.create(data);
};

// GET BY ID
const getProtectedAreaById = async (id) => {
  return await ProtectedArea.findOne({ _id: id, status: "ACTIVE" });
};

// UPDATE
const updateProtectedArea = async (id, payload) => {
  return await ProtectedArea.findOneAndUpdate(
    { _id: id, status: "ACTIVE" },
    payload,
    { new: true, runValidators: true }
  );
};

// SOFT DELETE
const softDeleteProtectedArea = async (id) => {
  const removed = await ProtectedArea.findOneAndDelete({ _id: id, status: "ACTIVE" });

  if (!removed) {
    return null;
  }

  await Zone.deleteMany({ protectedAreaId: id });

  return removed;
};

// Default export — sinon can stub properties on this object
const areaRepo = {
  findAll,
  create,
  findById,
  updateById,
  softDelete,
};

export default areaRepo;