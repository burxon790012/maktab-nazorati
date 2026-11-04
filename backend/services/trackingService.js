const crypto = require('crypto');
const { z } = require('zod');

// Single-use Stream Tickets (60-second TTL)
const streamTickets = new Map();

// IP-based failed pairing attempts tracker
const ipFailedAttempts = new Map();

/**
 * Generate 256-bit random cryptographic device token (64 hex chars)
 */
function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash device token using SHA-256
 */
function hashDeviceToken(token) {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Generate 6-digit numeric pairing code
 */
function generatePairingCode() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create a single-use stream ticket (expires in 60 seconds)
 */
function createStreamTicket(user) {
  const ticket = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 60 * 1000;
  streamTickets.set(ticket, {
    user,
    expiresAt
  });
  return ticket;
}

/**
 * Consume a single-use stream ticket. Returns user or null.
 */
function consumeStreamTicket(ticket) {
  if (!ticket || !streamTickets.has(ticket)) return null;
  const entry = streamTickets.get(ticket);
  streamTickets.delete(ticket); // strictly single-use
  if (Date.now() > entry.expiresAt) {
    return null;
  }
  return entry.user;
}

// Clean up expired tickets periodically
const ticketCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [t, entry] of streamTickets.entries()) {
    if (now > entry.expiresAt) {
      streamTickets.delete(t);
    }
  }
}, 30000);
if (ticketCleanupTimer.unref) ticketCleanupTimer.unref();

/**
 * Device Authentication Middleware
 * Checks Bearer <device_token> or X-Device-Token header, hashes it with SHA-256,
 * and matches against the devices table.
 */
function createDeviceAuthMiddleware(knexDb) {
  return async (req, res, next) => {
    let rawToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.split(' ')[1];
    } else if (req.headers['x-device-token']) {
      rawToken = req.headers['x-device-token'];
    }

    if (!rawToken) {
      return res.status(401).json({
        success: false,
        message: 'Qurilma tokeni talab qilinadi (Bearer yoki X-Device-Token)'
      });
    }

    try {
      const tokenHash = hashDeviceToken(rawToken);
      const device = await knexDb('devices')
        .where({ token_hash: tokenHash, is_paired: 1 })
        .first();

      if (!device) {
        return res.status(401).json({
          success: false,
          message: 'Qurilma tokeni yaroqsiz yoki bekor qilingan (revoked)'
        });
      }

      req.device = device;
      next();
    } catch (err) {
      console.error('Device auth error:', err);
      return res.status(500).json({ success: false, message: 'Autentifikatsiyada ichki xatolik' });
    }
  };
}

/**
 * Validation schema for incoming location point
 */
const LocationPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  altitude: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
  bearing: z.number().nullable().optional(),
  batteryLevel: z.number().min(0).max(100).nullable().optional(),
  isSyncedOffline: z.boolean().optional().default(false),
  clientId: z.string().max(128).nullable().optional(),
  recordedAt: z.union([z.string(), z.number()]).refine(val => {
    const timestamp = typeof val === 'number' ? val : new Date(val).getTime();
    // Cannot be in the future beyond 5 minutes
    return !isNaN(timestamp) && timestamp <= Date.now() + 5 * 60 * 1000;
  }, { message: 'Vaqt kelajakda bo\'lishi mumkin emas' })
});

const LocationBatchSchema = z.object({
  locations: z.array(LocationPointSchema).min(1).max(500)
});

/**
 * Calculate haversine distance in meters
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Server-side Geofencing Evaluation
 */
async function evaluateGeofences(knexDb, device, locationPoint, broadcastFn) {
  // Ignore fixes with accuracy worse than 100 m
  if (locationPoint.accuracy > 100) {
    return [];
  }

  const activeGeofences = await knexDb('geofences')
    .where({ student_id: device.student_id, is_active: 1 });

  if (!activeGeofences || activeGeofences.length === 0) {
    return [];
  }

  const triggeredAlerts = [];

  for (const fence of activeGeofences) {
    // Only evaluate if accuracy is smaller than the zone radius
    if (locationPoint.accuracy >= fence.radius_meters) {
      continue;
    }

    const dist = haversineDistanceMeters(
      locationPoint.latitude,
      locationPoint.longitude,
      fence.latitude,
      fence.longitude
    );

    const isInsideNow = dist <= fence.radius_meters;

    // Check last alert for this geofence & student
    const lastAlert = await knexDb('alert_events')
      .where({
        student_id: device.student_id,
        geofence_id: fence.id
      })
      .orderBy('triggered_at', 'desc')
      .first();

    const wasInside = lastAlert ? lastAlert.event_type === 'ENTER' : null;

    let eventType = null;
    let message = '';

    if (wasInside === null && isInsideNow) {
      eventType = 'ENTER';
      message = `Bola "${fence.name}" xavfsiz zonasiga kirdi`;
    } else if (wasInside === true && !isInsideNow) {
      eventType = 'EXIT';
      message = `Bola "${fence.name}" xavfsiz zonasidan chiqdi`;
    } else if (wasInside === false && isInsideNow) {
      eventType = 'ENTER';
      message = `Bola "${fence.name}" xavfsiz zonasiga qayta kirdi`;
    }

    if (eventType) {
      const alertId = 'alt_' + crypto.randomUUID();
      const alertRecord = {
        id: alertId,
        guardian_id: device.guardian_id,
        student_id: device.student_id,
        device_id: device.id,
        geofence_id: fence.id,
        event_type: eventType,
        message,
        is_delayed: locationPoint.isSyncedOffline ? 1 : 0,
        triggered_at: new Date(locationPoint.recordedAt),
        created_at: new Date()
      };

      await knexDb('alert_events').insert(alertRecord);
      triggeredAlerts.push(alertRecord);

      if (broadcastFn) {
        broadcastFn('geofence_alert', alertRecord);
      }
    }
  }

  return triggeredAlerts;
}

/**
 * Run 30-day retention cleanup
 */
async function runRetentionCleanup(knexDb, retentionDays = 30) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const deletedCount = await knexDb('locations')
    .where('recorded_at', '<', cutoff)
    .del();
  return deletedCount;
}

/**
 * Log Audit Trail Entry
 */
async function logAudit(knexDb, { userId, action, targetType, targetId, ipAddress, userAgent, details }) {
  try {
    await knexDb('audit_logs').insert({
      id: 'aud_' + crypto.randomUUID(),
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId || null,
      ip_address: ipAddress || null,
      user_agent: userAgent ? userAgent.substring(0, 255) : null,
      details: details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null,
      created_at: new Date()
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

function resetIpFailedAttempts() {
  ipFailedAttempts.clear();
}

module.exports = {
  generateDeviceToken,
  hashDeviceToken,
  generatePairingCode,
  createStreamTicket,
  consumeStreamTicket,
  createDeviceAuthMiddleware,
  LocationPointSchema,
  LocationBatchSchema,
  haversineDistanceMeters,
  evaluateGeofences,
  runRetentionCleanup,
  logAudit,
  ipFailedAttempts,
  resetIpFailedAttempts
};
