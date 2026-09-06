const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { successResponse, errorResponse } = require('../utils/response');

async function register(req, res, next) {
  try {
    const { email, password, full_name, phone, role } = req.body;

    // Check existing email
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return errorResponse(res, 400, 'Email address is already registered');
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, phone, role, is_active, created_at`,
      [email, password_hash, full_name, phone || null, role]
    );

    const user = userResult.rows[0];

    // If gig worker, create worker profile
    let workerProfile = null;
    if (role === 'gig_worker') {
      const workerResult = await db.query(
        `INSERT INTO worker_profiles (user_id, verification_status)
         VALUES ($1, 'pending')
         RETURNING id, verification_status, is_available, insurance_status`,
        [user.id]
      );
      workerProfile = workerResult.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    return successResponse(res, 201, 'User registered successfully', {
      user: {
        ...user,
        worker_profile: workerProfile,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const userResult = await db.query(
      `SELECT id, email, password_hash, full_name, phone, role, is_active, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return errorResponse(res, 403, 'User account is deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    delete user.password_hash;

    let workerProfile = null;
    if (user.role === 'gig_worker') {
      const workerResult = await db.query(
        `SELECT id, verification_status, verification_notes, latitude, longitude, address,
                vehicle_type, insurance_status, insurance_provider, is_available,
                average_rating, total_ratings, completed_jobs_count
         FROM worker_profiles WHERE user_id = $1`,
        [user.id]
      );
      if (workerResult.rows.length > 0) {
        workerProfile = workerResult.rows[0];
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    return successResponse(res, 200, 'Login successful', {
      user: {
        ...user,
        worker_profile: workerProfile,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const userResult = await db.query(
      `SELECT id, email, full_name, phone, role, is_active, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return errorResponse(res, 404, 'User not found');
    }

    const user = userResult.rows[0];

    let workerProfile = null;
    if (user.role === 'gig_worker') {
      const workerResult = await db.query(
        `SELECT wp.*, 
                json_agg(
                  json_build_object(
                    'skill_id', s.id,
                    'skill_name', s.name,
                    'category_name', c.name,
                    'hourly_rate', ws.hourly_rate,
                    'experience_years', ws.experience_years
                  )
                ) FILTER (WHERE s.id IS NOT NULL) AS skills
         FROM worker_profiles wp
         LEFT JOIN worker_skills ws ON wp.id = ws.worker_id
         LEFT JOIN skills s ON ws.skill_id = s.id
         LEFT JOIN categories c ON s.category_id = c.id
         WHERE wp.user_id = $1
         GROUP BY wp.id`,
        [user.id]
      );
      if (workerResult.rows.length > 0) {
        workerProfile = workerResult.rows[0];
        workerProfile.skills = workerProfile.skills || [];
      }
    }

    return successResponse(res, 200, 'User details retrieved', {
      user: {
        ...user,
        worker_profile: workerProfile,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { full_name, phone } = req.body;

    const result = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, full_name, phone, role, updated_at`,
      [full_name, phone, req.user.id]
    );

    return successResponse(res, 200, 'Profile updated successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
