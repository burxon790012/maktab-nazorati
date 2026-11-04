const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'maktab-nazorati-jwt-secret-key-production-grade-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Sign standard access token
 */
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId || null,
      classId: user.classId || null,
      childrenIds: user.childrenIds || []
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Sign refresh token
 */
function signRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Hash password with bcrypt cost 12
 */
function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, 12);
}

/**
 * Compare plain password with bcrypt hash
 */
function verifyPassword(plainPassword, hash) {
  if (!hash) return false;
  return bcrypt.compareSync(plainPassword, hash);
}

/**
 * Strict Auth Middleware: requires valid Bearer JWT
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Autentifikatsiya talab qilinadi: Bearer token topilmadi'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Token yaroqsiz yoki muddati o\'tgan'
    });
  }

  req.user = decoded;
  next();
}

/**
 * Optional Auth Middleware: parses token if present, but doesn't block if missing
 */
function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

/**
 * Check if the user is authorized to read/manage child location data.
 * Rule: Only PARENT users linked via parent_child_connections (childrenIds) can read/manage child GPS location.
 * SCHOOL_ADMIN, TEACHER, or unlinked users get NO access.
 */
function canAccessChildLocation(user, studentId) {
  if (!user) return false;
  if (user.role !== 'PARENT') return false;
  if (!Array.isArray(user.childrenIds)) return false;
  return user.childrenIds.map(String).includes(String(studentId));
}

module.exports = {
  JWT_SECRET,
  signToken,
  signRefreshToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  authMiddleware,
  optionalAuthMiddleware,
  canAccessChildLocation
};

