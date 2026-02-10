const Zone = require("../models/Zone");
const ProtectedArea = require("../models/ProtectedArea");

const ensureProtectedAreaActive = async (protectedAreaId) => {
  const area = await ProtectedArea.findOne({
    _id: protectedAreaId,
    status: "ACTIVE",
  });
  return area;
};

const listZonesByProtectedAreaId = async (protectedAreaId) => {
  return Zone.find({
    protectedAreaId,
    status: "ACTIVE",
  }).sort({ createdAt: -1 });
};

const createZone = async (protectedAreaId, payload) => {
  return Zone.create({ ...payload, protectedAreaId });
};

const updateZone = async (zoneId, payload) => {
  return Zone.findOneAndUpdate(
    { _id: zoneId, status: "ACTIVE" },
    payload,
    { new: true, runValidators: true }
  );
};

const softDeleteZone = async (zoneId) => {
  return Zone.findOneAndUpdate(
    { _id: zoneId, status: "ACTIVE" },
    { status: "DELETED" },
    { new: true }
  );
};

module.exports = {
  ensureProtectedAreaActive,
  listZonesByProtectedAreaId,
  createZone,
  updateZone,
  softDeleteZone,
};
