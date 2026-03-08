import {
  ensureProtectedAreaActive,
  listZonesByProtectedAreaId,
  createZone,
  updateZone,
  softDeleteZone,
} from "../repositories/zone.repository.js";

import {
  validateCreateZone,
  validateUpdateZone,
} from "../validators/zone.validator.js";


// LIST ZONES BY PROTECTED AREA
const listByProtectedArea = async (req, res, next) => {
  try {
    const areaId = req.params.id;

    const area = await ensureProtectedAreaActive(areaId);

    if (!area) {
      return res.status(404).json({ message: "Protected area not found" });
    }

    const zones = await listZonesByProtectedAreaId(areaId);

    return res.status(200).json({ data: zones });
  } catch (error) {
    return next(error);
  }
};


// CREATE ZONE FOR PROTECTED AREA
const createForProtectedArea = async (req, res, next) => {
  try {
    const error = validateCreateZone(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const areaId = req.params.id;

    const area = await ensureProtectedAreaActive(areaId);
    if (!area) {
      return res.status(404).json({ message: "Protected area not found" });
    }

    const created = await createZone(areaId, req.body);

    return res.status(201).json({ data: created });
  } catch (error) {
    return next(error);
  }
};


// UPDATE ZONE
const update = async (req, res, next) => {
  try {
    const error = validateUpdateZone(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const zoneId = req.params.zoneId;

    const updated = await updateZone(zoneId, req.body);

    if (!updated) {
      return res.status(404).json({ message: "Zone not found" });
    }

    return res.status(200).json({ data: updated });
  } catch (error) {
    return next(error);
  }
};


// DELETE ZONE (Soft Delete)
const remove = async (req, res, next) => {
  try {
    const zoneId = req.params.zoneId;

    const removed = await softDeleteZone(zoneId);

    if (!removed) {
      return res.status(404).json({ message: "Zone not found" });
    }

    return res.status(200).json({ message: "Zone deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export {
  listByProtectedArea,
  createForProtectedArea,
  update,
  remove,
};