import ProtectedArea from "../models/ProtectedArea.model.js";

const findAll = async () => {
  return await ProtectedArea.find({ isDeleted: false });
};

const create = async (data) => {
  return await ProtectedArea.create(data);
};

const findById = async (id) => {
  return await ProtectedArea.findOne({ _id: id, isDeleted: false });
};

const updateById = async (id, payload) => {
  return await ProtectedArea.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true }
  );
};

const softDelete = async (id) => {
  return await ProtectedArea.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
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