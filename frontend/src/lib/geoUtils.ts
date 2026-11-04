/**
 * SMART CHILD — Geographic & Geofencing Mathematical Utilities
 */

// Earth's mean radius in meters
const EARTH_RADIUS = 6371000;

/**
 * Calculates great-circle distance between two GPS coordinates using Haversine formula (meters)
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Calculates perimeter of a polygon in meters
 */
export function calculatePerimeter(points: [number, number][]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const nextIdx = (i + 1) % points.length;
    total += haversineDistance(
      points[i][0],
      points[i][1],
      points[nextIdx][0],
      points[nextIdx][1]
    );
  }
  return total;
}

/**
 * Calculates area of a polygon in square meters (m²) using spherical projection Shoelace formula
 */
export function calculatePolygonArea(points: [number, number][]): number {
  if (points.length < 3) return 0;

  // Approximate metric projection centered around centroid
  const centerLat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const latRad = (centerLat * Math.PI) / 180;
  const metersPerDegLat = 111132.954 - 559.822 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
  const metersPerDegLon = (Math.PI / 180) * EARTH_RADIUS * Math.cos(latRad);

  const projected = points.map(([lat, lon]) => [
    (lon - points[0][1]) * metersPerDegLon,
    (lat - points[0][0]) * metersPerDegLat,
  ]);

  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length;
    area += projected[i][0] * projected[j][1];
    area -= projected[j][0] * projected[i][1];
  }

  return Math.abs(area / 2);
}

/**
 * Generates an N-sided polygon approximation of a circle
 */
export function generateCirclePolygon(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  pointsCount: number = 32
): [number, number][] {
  const coords: [number, number][] = [];
  const latRad = (centerLat * Math.PI) / 180;
  const degLatOffset = radiusMeters / 111132;
  const degLngOffset = radiusMeters / (111132 * Math.cos(latRad));

  for (let i = 0; i < pointsCount; i++) {
    const angle = (i * 2 * Math.PI) / pointsCount;
    const lat = centerLat + degLatOffset * Math.cos(angle);
    const lng = centerLng + degLngOffset * Math.sin(angle);
    coords.push([parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]);
  }

  return coords;
}

/**
 * Ray-casting algorithm to test if a point is inside a polygon
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Formats meters into human-readable text (e.g., "120 m" or "1.45 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats square meters into m² or hectares (ga)
 */
export function formatArea(m2: number): string {
  if (m2 >= 10000) {
    return `${(m2 / 10000).toFixed(2)} ga (${Math.round(m2).toLocaleString()} m²)`;
  }
  return `${Math.round(m2).toLocaleString()} m²`;
}
