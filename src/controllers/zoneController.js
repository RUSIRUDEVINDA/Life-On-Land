const {
  ensureProtectedAreaActive,
  listZonesByProtectedAreaId,
  createZone,
  updateZone,
  softDeleteZone,
} = require("../services/zoneService");
const { validatePolygon } = require("../utils/geojson");

const ALLOWED_ZONE_TYPES = ["CORE", "BUFFER", "EDGE", "CORRIDOR"];

const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const listByProtectedArea = async (req, res, next) => {
  try {
    const area = await ensureProtectedAreaActive(req.params.id);
    if (!area) {
      return res.status(404).json({ message: "Protected area not found" });
    }

    const zones = await listZonesByProtectedAreaId(req.params.id);
    return res.status(200).json({ data: zones });
  } catch (error) {
    return next(error);
  }
};

const createForProtectedArea = async (req, res, next) => {
  try {
    const { name, zoneType, areaSize, geometry } = req.body;

    if (!name || !zoneType || !geometry || areaSize === undefined) {
      return res.status(400).json({
        message: "name, zoneType, areaSize, and geometry are required fields",
      });
    }

    if (!ALLOWED_ZONE_TYPES.includes(zoneType)) {
      return res.status(400).json({
        message: "zoneType must be one of CORE, BUFFER, EDGE, CORRIDOR",
      });
    }

    if (!isPositiveNumber(areaSize)) {
      return res.status(400).json({ message: "areaSize must be a positive number" });
    }

    const geoError = validatePolygon(geometry);
    if (geoError) {
      return res.status(400).json({ message: geoError });
    }

    const area = await ensureProtectedAreaActive(req.params.id);
    if (!area) {
      return res.status(404).json({ message: "Protected area not found" });
    }

    const created = await createZone(req.params.id, {
      name,
      zoneType,
      areaSize,
      geometry,
    });

    return res.status(201).json({ data: created });
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const payload = {};
    const { name, zoneType, areaSize, geometry } = req.body;

    if (name !== undefined) payload.name = name;

    if (zoneType !== undefined) {
      if (!ALLOWED_ZONE_TYPES.includes(zoneType)) {
        return res.status(400).json({
          message: "zoneType must be one of CORE, BUFFER, EDGE, CORRIDOR",
        });
      }
      payload.zoneType = zoneType;
    }

    if (areaSize !== undefined) {
      if (!isPositiveNumber(areaSize)) {
        return res
          .status(400)
          .json({ message: "areaSize must be a positive number" });
      }
      payload.areaSize = areaSize;
    }

    if (geometry !== undefined) {
      const geoError = validatePolygon(geometry);
      if (geoError) {
        return res.status(400).json({ message: geoError });
      }
      payload.geometry = geometry;
    }

    const updated = await updateZone(req.params.zoneId, payload);
    if (!updated) {
      return res.status(404).json({ message: "Zone not found" });
    }

    return res.status(200).json({ data: updated });
  } catch (error) {
    return next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const removed = await softDeleteZone(req.params.zoneId);
    if (!removed) {
      return res.status(404).json({ message: "Zone not found" });
    }
    return res.status(200).json({ message: "Zone deleted" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listByProtectedArea,
  createForProtectedArea,
  update,
  remove,
};
