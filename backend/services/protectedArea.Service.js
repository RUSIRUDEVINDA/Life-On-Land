import ProtectedArea from "../models/ProtectedArea.model.js";

const listProtectedAreas = async () => {
  return ProtectedArea.find({ status: "ACTIVE" }).sort({ createdAt: -1 });
};

const createProtectedArea = async (payload) => {
  return ProtectedArea.create(payload);
};

const getProtectedAreaById = async (id) => {
  return ProtectedArea.findOne({ _id: id, status: "ACTIVE" });
};

const updateProtectedArea = async (id, payload) => {
  return ProtectedArea.findOneAndUpdate(
    { _id: id, status: "ACTIVE" },
    payload,
    { new: true, runValidators: true }
  );
};

const softDeleteProtectedArea = async (id) => {
  const removed = await ProtectedArea.findOneAndDelete({ _id: id, status: "ACTIVE" });

  if (!removed) {
    return null;
  }

  await Zone.deleteMany({ protectedAreaId: id });

  return removed;
};

export {
  listProtectedAreas,
  createProtectedArea,
  getProtectedAreaById,
  updateProtectedArea,
  softDeleteProtectedArea,
};
