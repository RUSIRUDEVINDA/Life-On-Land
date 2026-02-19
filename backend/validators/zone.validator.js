const ALLOWED_ZONE_TYPES = ["CORE", "BUFFER", "EDGE", "CORRIDOR"];

const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;


// Validate GeoJSON Polygon
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


// CREATE VALIDATION
const validateCreateZone = (data) => {
  const { name, zoneType, areaSize, geometry } = data;

  if (!name || !zoneType || areaSize === undefined || !geometry) {
    return "name, zoneType, areaSize, and geometry are required fields";
  }

  if (!ALLOWED_ZONE_TYPES.includes(zoneType)) {
    return "zoneType must be one of CORE, BUFFER, EDGE, CORRIDOR";
  }

  if (!isPositiveNumber(areaSize)) {
    return "areaSize must be a positive number";
  }

  const geoError = validateGeometry(geometry);
  if (geoError) return geoError;

  return null;
};


// UPDATE VALIDATION
const validateUpdateZone = (data) => {
  const { zoneType, areaSize, geometry } = data;

  if (zoneType !== undefined && !ALLOWED_ZONE_TYPES.includes(zoneType)) {
    return "zoneType must be one of CORE, BUFFER, EDGE, CORRIDOR";
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
  validateCreateZone,
  validateUpdateZone,
};
