const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const { errorResponse } = require('../utils/response');

async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Authentication token missing or invalid format');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.secret);

    // Verify user exists and is active
    const userResult = await db.query(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return errorResponse(res, 401, 'User no longer exists');
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      return errorResponse(res, 403, 'User account is deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token expired');
    }
    return errorResponse(res, 401, 'Invalid authentication token');
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthenticated');
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Requires one of the following roles: ${roles.join(', ')}`
      );
    }

    next();
  };
}

module.exports = {
  authenticateJWT,
  authorizeRoles,
};
