const {
  listProtectedAreas,
  createProtectedArea,
  getProtectedAreaById,
  updateProtectedArea,
  softDeleteProtectedArea,
} = require("../services/protectedAreaService");
const { validatePolygon } = require("../utils/geojson");

const ALLOWED_TYPES = ["NATIONAL_PARK", "FOREST_RESERVE", "SAFARI_AREA"];

const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const list = async (req, res, next) => {
  try {
    const items = await listProtectedAreas();
    return res.status(200).json({ data: items });
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, type, district, description, areaSize, geometry } = req.body;

    if (!name || !type || !district || !geometry || areaSize === undefined) {
      return res.status(400).json({
        message:
          "name, type, district, areaSize, and geometry are required fields",
      });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        message: "type must be one of NATIONAL_PARK, FOREST_RESERVE, SAFARI_AREA",
      });
    }

    if (!isPositiveNumber(areaSize)) {
      return res.status(400).json({
        message: "areaSize must be a positive number",
      });
    }

    const geoError = validatePolygon(geometry);
    if (geoError) {
      return res.status(400).json({ message: geoError });
    }

    const created = await createProtectedArea({
      name,
      type,
      district,
      description,
      areaSize,
      geometry,
    });

    return res.status(201).json({ data: created });
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await getProtectedAreaById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Protected area not found" });
    }
    return res.status(200).json({ data: item });
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const payload = {};
    const { name, type, district, description, areaSize, geometry } = req.body;

    if (name !== undefined) payload.name = name;
    if (district !== undefined) payload.district = district;
    if (description !== undefined) payload.description = description;

    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({
          message:
            "type must be one of NATIONAL_PARK, FOREST_RESERVE, SAFARI_AREA",
        });
      }
      payload.type = type;
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

    const updated = await updateProtectedArea(req.params.id, payload);
    if (!updated) {
      return res.status(404).json({ message: "Protected area not found" });
    }

    return res.status(200).json({ data: updated });
  } catch (error) {
    return next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const removed = await softDeleteProtectedArea(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: "Protected area not found" });
    }
    return res.status(200).json({ message: "Protected area deleted" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
  remove,
};
