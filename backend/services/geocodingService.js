/**
 * Smart Child Geocoding & Forward Search Service
 * - Reverse Geocoding (Google Primary + Nominatim Fallback)
 * - Forward Search (/api/geocode/search) with Multi-Variant Query Normalization,
 *   10-minute caching, rate-limiting (max 1 req/s), and Overpass fallback.
 */

const addressCache = new Map();
const lastDevicePoints = new Map(); // deviceId -> { lat, lng, time, address }
let lastNominatimRequestTime = 0;

// Search Cache: query -> { timestamp, results }
const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Monthly Google Geocoding Usage Tracker
let currentMonth = new Date().getMonth();
let monthlyGoogleCalls = 0;
const GOOGLE_MONTHLY_LIMIT = 8000;

function checkMonthlyReset() {
  const m = new Date().getMonth();
  if (m !== currentMonth) {
    currentMonth = m;
    monthlyGoogleCalls = 0;
  }
}

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

function getGridKey(lat, lng) {
  const gridLat = Math.round(lat / 0.00025) * 0.00025;
  const gridLng = Math.round(lng / 0.00025) * 0.00025;
  return `${gridLat.toFixed(5)},${gridLng.toFixed(5)}`;
}

// ==========================================
// FORWARD SEARCH & QUERY NORMALIZATION
// ==========================================

const UZ_CITIES = [
  { uz: 'Urganch', ru: 'Ургенч', en: 'Urgench' },
  { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
  { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' },
  { uz: 'Buxoro', ru: 'Бухара', en: 'Bukhara' },
  { uz: 'Andijon', ru: 'Андижан', en: 'Andijan' },
  { uz: "Farg'ona", ru: 'Фергана', en: 'Fergana' },
  { uz: 'Namangan', ru: 'Наманган', en: 'Namangan' },
  { uz: 'Qarshi', ru: 'Карши', en: 'Karshi' },
  { uz: 'Nukus', ru: 'Нукус', en: 'Nukus' },
  { uz: 'Navoiy', ru: 'Навои', en: 'Navoi' },
  { uz: 'Jizzax', ru: 'Джизак', en: 'Jizzakh' },
  { uz: 'Termiz', ru: 'Термез', en: 'Termez' },
  { uz: 'Guliston', ru: 'Гулистан', en: 'Gulistan' },
  { uz: 'Xiva', ru: 'Хива', en: 'Khiva' },
];

function generateQueryVariants(rawQuery) {
  const trimmed = rawQuery.trim();
  const variants = [trimmed];

  // Detect school number (e.g. 30, 30-maktab, 30-sonli, №30, 30 son)
  const numberMatch = trimmed.match(/(?:maktab\s*|школа\s*|school\s*|№\s*|sonli\s*|^|\s)(\d+)(?:-maktab|-sonli|-son|\s*maktab|\s*sonli|\b)/i);
  const schoolNum = numberMatch ? numberMatch[1] : null;

  // Detect city name (supporting both Latin and Cyrillic without ASCII \b limitation)
  let detectedCity = null;
  for (const c of UZ_CITIES) {
    const pattern = new RegExp(`(^|[\\s,.-])(${c.uz}|${c.ru}|${c.en})($|[\\s,.-])`, 'i');
    if (pattern.test(trimmed)) {
      detectedCity = c;
      break;
    }
  }

  if (schoolNum && detectedCity) {
    variants.push(`${schoolNum}-maktab ${detectedCity.uz}`);
    variants.push(`${schoolNum} maktab ${detectedCity.uz}`);
    variants.push(`${schoolNum}-sonli maktab ${detectedCity.uz}`);
    variants.push(`Школа ${schoolNum} ${detectedCity.ru}`);
    variants.push(`School ${schoolNum} ${detectedCity.en}`);
    variants.push(`${detectedCity.uz} ${schoolNum}-maktab`);
    variants.push(`maktab ${schoolNum} ${detectedCity.uz}`);
  } else if (schoolNum) {
    variants.push(`${schoolNum}-maktab`);
    variants.push(`${schoolNum} maktab`);
    variants.push(`${schoolNum}-sonli maktab`);
    variants.push(`Школа ${schoolNum}`);
  }

  // Remove duplicate entries
  return Array.from(new Set(variants));
}

// Rate-limited single Nominatim search call
async function fetchNominatimSingle(query, options = {}) {
  const now = Date.now();
  const elapsed = now - lastNominatimRequestTime;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastNominatimRequestTime = Date.now();

  const contactEmail = process.env.NOMINATIM_EMAIL || 'support@maktab-nazorati.uz';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=uz&limit=6&addressdetails=1`;

    if (options.lat && options.lng) {
      const d = 0.15; // ~16 km viewbox bias
      const viewbox = `${options.lng - d},${options.lat + d},${options.lng + d},${options.lat - d}`;
      url += `&viewbox=${encodeURIComponent(viewbox)}&bounded=0`;
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': `SmartChild-GPS/2.0 (contact: ${contactEmail})`,
        'Accept-Language': 'uz,ru,en',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Nominatim HTTP ${res.status}`);
    }

    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`Nominatim variant qidiruv xatosi ("${query}"):`, err.message);
    return null;
  }
}

// Forward search with variant chain & caching
async function searchPlaces(rawQuery, options = {}) {
  const clean = rawQuery ? rawQuery.trim() : '';
  if (clean.length < 2) {
    return { success: true, count: 0, results: [] };
  }

  const cacheKey = `${clean.toLowerCase()}_${options.lat || ''}_${options.lng || ''}`;
  if (searchCache.has(cacheKey)) {
    const entry = searchCache.get(cacheKey);
    if (Date.now() - entry.timestamp < SEARCH_CACHE_TTL_MS) {
      return { success: true, count: entry.results.length, results: entry.results, cached: true };
    }
  }

  const variants = generateQueryVariants(clean);
  let rawResults = [];
  let isNetworkError = false;

  for (const variant of variants) {
    const res = await fetchNominatimSingle(variant, options);
    if (res === null) {
      isNetworkError = true;
      // If network is completely offline/unreachable, don't keep retrying all variants
      break;
    }
    if (res && res.length > 0) {
      rawResults = res;
      break;
    }
  }

  // If network failed for all calls
  if (rawResults.length === 0 && isNetworkError) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: "Qidiruv xizmati vaqtincha ishlamayapti, qayta urinib ko'ring",
      results: [],
    };
  }

  // Format results uniformly
  const formattedResults = rawResults.map((item, idx) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const isSchool = item.class === 'amenity' && (item.type === 'school' || item.type === 'kindergarten');

    // Clean display title
    let title = item.name || clean;
    if (item.display_name) {
      const parts = item.display_name.split(',');
      if (!title || title === clean) {
        title = parts[0].trim();
      }
    }

    return {
      id: item.place_id || `osm_${idx}_${Date.now()}`,
      title,
      displayName: item.display_name,
      lat,
      lng,
      category: isSchool ? 'school' : 'address',
      type: item.type || 'place',
      source: 'osm',
    };
  });

  // Store in search cache
  searchCache.set(cacheKey, { timestamp: Date.now(), results: formattedResults });

  return {
    success: true,
    count: formattedResults.length,
    results: formattedResults,
  };
}

// ==========================================
// REVERSE GEOCODING (LAT/LNG -> ADDRESS)
// ==========================================

async function geocodeWithGoogle(lat, lng, apiKey) {
  checkMonthlyReset();
  if (monthlyGoogleCalls >= GOOGLE_MONTHLY_LIMIT) {
    console.warn('⚠️ Google Geocoding oylik 8,000 chaqiruv limiti to\'ldi. Nominatim zaxirasiga o\'tilmoqda.');
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
      lat
    )},${encodeURIComponent(lng)}&key=${encodeURIComponent(apiKey)}&language=uz&region=uz`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Google Geocoding HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      monthlyGoogleCalls++;
      return data.results[0].formatted_address;
    }
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Google Geocoding API xatosi, fallbackka o\'tilmoqda:', err.message);
    return null;
  }
}

async function geocodeWithNominatim(lat, lng) {
  const now = Date.now();
  const timeSinceLast = now - lastNominatimRequestTime;
  if (timeSinceLast < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLast));
  }

  lastNominatimRequestTime = Date.now();
  const contactEmail = process.env.NOMINATIM_EMAIL || 'support@maktab-nazorati.uz';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': `SmartChild-GPS/2.0 (contact: ${contactEmail})`,
        'Accept-Language': 'uz,ru,en',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Nominatim HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.display_name) {
      const parts = data.display_name.split(',');
      return parts.slice(0, 3).map((p) => p.trim()).join(', ');
    }

    const addr = data.address || {};
    const road = addr.road || addr.street || addr.pedestrian || '';
    const houseNumber = addr.house_number ? ` ${addr.house_number}-uy` : '';
    const suburb = addr.suburb || addr.neighbourhood || addr.city_district || '';
    const city = addr.city || addr.town || 'Toshkent';

    const result = [road ? road + houseNumber : '', suburb, city].filter(Boolean).join(', ');
    return result || 'Toshkent shahri';
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

async function reverseGeocode(lat, lng, deviceId = null) {
  if (lat == null || lng == null) return "Noma'lum manzil";

  const gridKey = getGridKey(lat, lng);
  if (addressCache.has(gridKey)) {
    const cached = addressCache.get(gridKey);
    if (deviceId) {
      lastDevicePoints.set(deviceId, { lat, lng, time: Date.now(), address: cached });
    }
    return cached;
  }

  const now = Date.now();
  if (deviceId && lastDevicePoints.has(deviceId)) {
    const last = lastDevicePoints.get(deviceId);
    const dist = haversineDistMeters(lat, lng, last.lat, last.lng);
    const elapsedSec = (now - last.time) / 1000;
    if (dist < 30 || elapsedSec < 30) {
      return last.address;
    }
  }

  const googleServerKey = process.env.GOOGLE_GEOCODING_KEY || process.env.GOOGLE_MAPS_SERVER_KEY;
  let resolvedAddress = null;

  if (googleServerKey) {
    resolvedAddress = await geocodeWithGoogle(lat, lng, googleServerKey);
  }

  if (!resolvedAddress) {
    resolvedAddress = await geocodeWithNominatim(lat, lng);
  }

  if (!resolvedAddress) {
    if (deviceId && lastDevicePoints.has(deviceId)) {
      return lastDevicePoints.get(deviceId).address + ' (taxminiy)';
    }
    resolvedAddress = 'Toshkent shahri (taxminiy)';
  }

  addressCache.set(gridKey, resolvedAddress);
  if (addressCache.size > 2000) {
    const firstKey = addressCache.keys().next().value;
    addressCache.delete(firstKey);
  }

  if (deviceId) {
    lastDevicePoints.set(deviceId, { lat, lng, time: now, address: resolvedAddress });
  }

  return resolvedAddress;
}

module.exports = {
  reverseGeocode,
  searchPlaces,
  generateQueryVariants,
  getMonthlyGoogleCalls: () => monthlyGoogleCalls,
};
