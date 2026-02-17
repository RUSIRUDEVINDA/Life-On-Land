const ALLOWED_TYPES = ["NATIONAL_PARK", "FOREST_RESERVE", "SAFARI_AREA"];

const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

// Validate GeoJSON Polygon structure
const validateGeometry = (geometry) => {
  if (!geometry) return "geometry is required";

  if (geometry.type !== "Polygon") {
    return "geometry.type must be 'Polygon'";
  }

  if (
    !Array.isArray(geometry.coordinates) ||
    !Array.isArray(geometry.coordinates[0])
  ) {
    return "geometry.coordinates must be a valid Polygon coordinate array";
  }

  return null;
};

// CREATE VALIDATOR
const validateCreateProtectedArea = (data) => {
  const { name, type, district, areaSize, geometry } = data;

  if (!name || !type || !district || areaSize === undefined || !geometry) {
    return "name, type, district, areaSize, and geometry are required fields";
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return "type must be one of NATIONAL_PARK, FOREST_RESERVE, SAFARI_AREA";
  }

  if (!isPositiveNumber(areaSize)) {
    return "areaSize must be a positive number";
  }

  const geoError = validateGeometry(geometry);
  if (geoError) return geoError;

  return null;
};

// UPDATE VALIDATOR
const validateUpdateProtectedArea = (data) => {
  const { type, areaSize, geometry } = data;

  if (type !== undefined && !ALLOWED_TYPES.includes(type)) {
    return "type must be one of NATIONAL_PARK, FOREST_RESERVE, SAFARI_AREA";
  }

  if (areaSize !== undefined && !isPositiveNumber(areaSize)) {
    return "areaSize must be a positive number";
  }

  if (geometry !== undefined) {
    const geoError = validateGeometry(geometry);
    if (geoError) return geoError;
  }

  return null;
};

export {
  validateCreateProtectedArea,
  validateUpdateProtectedArea,
};
