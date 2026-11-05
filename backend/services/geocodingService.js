/**
 * Reverse Geocoding Service (Nominatim with server-side caching & rate-limiting)
 * Adheres to Nominatim Usage Policy:
 * - Max 1 request per second
 * - Valid User-Agent with contact email
 * - In-memory caching & >30m distance threshold
 */

const addressCache = new Map();
let lastRequestTime = 0;
const lastDevicePoints = new Map(); // deviceId -> { lat, lng, address }

function haversineDistMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatAddress(data) {
  if (!data) return "Noma'lum manzil";
  if (data.display_name) {
    const parts = data.display_name.split(',');
    // Return first 3 informative parts (e.g. "Amir Temur ko'chasi, Yunusobod tumani, Toshkent")
    return parts.slice(0, 3).map(p => p.trim()).join(', ');
  }
  const addr = data.address || {};
  const road = addr.road || addr.street || addr.pedestrian || '';
  const houseNumber = addr.house_number ? ` ${addr.house_number}-uy` : '';
  const suburb = addr.suburb || addr.neighbourhood || addr.city_district || '';
  const city = addr.city || addr.town || addr.county || 'Toshkent';

  const result = [road ? road + houseNumber : '', suburb, city].filter(Boolean).join(', ');
  return result || "Toshkent, O'zbekiston";
}

async function reverseGeocode(lat, lng, deviceId = null) {
  if (lat == null || lng == null) return "Noma'lum manzil";

  // 1. Cache bucket (approx 10-15 meters precision)
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (addressCache.has(cacheKey)) {
    const cached = addressCache.get(cacheKey);
    if (deviceId) {
      lastDevicePoints.set(deviceId, { lat, lng, address: cached });
    }
    return cached;
  }

  // 2. Check threshold for this device (>30 meters required)
  if (deviceId && lastDevicePoints.has(deviceId)) {
    const last = lastDevicePoints.get(deviceId);
    const dist = haversineDistMeters(lat, lng, last.lat, last.lng);
    if (dist < 30 && last.address) {
      return last.address;
    }
  }

  // 3. Enforce rate limit (at least 1000ms between calls)
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < 1000) {
    // If we have any last address for this device, return it immediately
    if (deviceId && lastDevicePoints.has(deviceId)) {
      return lastDevicePoints.get(deviceId).address + ' (taxminiy)';
    }
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLast));
  }

  lastRequestTime = Date.now();
  const contactEmail = process.env.NOMINATIM_EMAIL || 'support@maktab-nazorati.uz';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': `SmartChild-GPS/2.0 (contact: ${contactEmail})`,
        'Accept-Language': 'uz,ru,en'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Nominatim HTTP ${res.status}`);
    }

    const data = await res.json();
    const formatted = formatAddress(data);

    addressCache.set(cacheKey, formatted);
    if (addressCache.size > 2000) {
      // LRU evict oldest entries
      const firstKeys = Array.from(addressCache.keys()).slice(0, 500);
      firstKeys.forEach(k => addressCache.delete(k));
    }

    if (deviceId) {
      lastDevicePoints.set(deviceId, { lat, lng, address: formatted });
    }

    return formatted;
  } catch (err) {
    console.warn('Reverse geocode error:', err.message);
    if (deviceId && lastDevicePoints.has(deviceId)) {
      return lastDevicePoints.get(deviceId).address + ' (taxminiy)';
    }
    return `Koordinata: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

module.exports = {
  reverseGeocode,
  haversineDistMeters
};
