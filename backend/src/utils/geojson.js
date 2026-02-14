const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

const isValidPosition = (position) =>
  Array.isArray(position) &&
  position.length === 2 &&
  isNumber(position[0]) &&
  isNumber(position[1]);

const isRingClosed = (ring) => {
  if (!Array.isArray(ring) || ring.length < 4) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return (
    Array.isArray(first) &&
    Array.isArray(last) &&
    first.length === 2 &&
    last.length === 2 &&
    first[0] === last[0] &&
    first[1] === last[1]
  );
};

const validatePolygon = (geometry) => {
  if (!geometry || typeof geometry !== "object") {
    return "geometry must be an object";
  }

  if (geometry.type !== "Polygon") {
    return "geometry.type must be 'Polygon'";
  }

  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    return "geometry.coordinates must be a non-empty array";
  }

  for (const ring of geometry.coordinates) {
    if (!Array.isArray(ring) || ring.length < 4) {
      return "Each polygon ring must have at least 4 positions";
    }

    if (!isRingClosed(ring)) {
      return "Each polygon ring must be closed (first and last positions must match)";
    }

    for (const position of ring) {
      if (!isValidPosition(position)) {
        return "Each position must be an array of two numbers [lng, lat]";
      }
    }
  }

  return null;
};

export { validatePolygon };
