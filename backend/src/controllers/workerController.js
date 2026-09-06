const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function getMyProfile(req, res, next) {
  try {
    const result = await db.query(
      `SELECT wp.*,
              u.email, u.full_name, u.phone,
              COALESCE(
                json_agg(
                  json_build_object(
                    'skill_id', s.id,
                    'skill_name', s.name,
                    'category_id', s.category_id,
                    'category_name', c.name,
                    'hourly_rate', ws.hourly_rate,
                    'experience_years', ws.experience_years
                  )
                ) FILTER (WHERE s.id IS NOT NULL), '[]'
              ) AS skills
       FROM worker_profiles wp
       JOIN users u ON wp.user_id = u.id
       LEFT JOIN worker_skills ws ON wp.id = ws.worker_id
       LEFT JOIN skills s ON ws.skill_id = s.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE wp.user_id = $1
       GROUP BY wp.id, u.id`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }

    return successResponse(res, 200, 'Worker profile fetched', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateWorkerProfile(req, res, next) {
  try {
    const {
      bio,
      latitude,
      longitude,
      address,
      vehicle_type,
      insurance_provider,
      insurance_policy_number,
      identity_document_url,
    } = req.body;

    const wpResult = await db.query('SELECT id FROM worker_profiles WHERE user_id = $1', [req.user.id]);
    if (wpResult.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found for user');
    }

    const workerId = wpResult.rows[0].id;

    const result = await db.query(
      `UPDATE worker_profiles
       SET bio = COALESCE($1, bio),
           latitude = COALESCE($2, latitude),
           longitude = COALESCE($3, longitude),
           address = COALESCE($4, address),
           vehicle_type = COALESCE($5, vehicle_type),
           insurance_provider = COALESCE($6, insurance_provider),
           insurance_policy_number = COALESCE($7, insurance_policy_number),
           identity_document_url = COALESCE($8, identity_document_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        bio,
        latitude,
        longitude,
        address,
        vehicle_type,
        insurance_provider,
        insurance_policy_number,
        identity_document_url,
        workerId,
      ]
    );

    return successResponse(res, 200, 'Worker profile updated successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateLocationAndAvailability(req, res, next) {
  try {
    const { latitude, longitude, is_available } = req.body;

    const result = await db.query(
      `UPDATE worker_profiles
       SET latitude = $1,
           longitude = $2,
           is_available = COALESCE($3, is_available),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING id, latitude, longitude, is_available, updated_at`,
      [latitude, longitude, is_available, req.user.id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }

    return successResponse(res, 200, 'Worker location and availability updated', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function addSkill(req, res, next) {
  try {
    const { skill_id, hourly_rate, experience_years } = req.body;

    const wpResult = await db.query('SELECT id FROM worker_profiles WHERE user_id = $1', [req.user.id]);
    if (wpResult.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }
    const workerId = wpResult.rows[0].id;

    const skillCheck = await db.query('SELECT id FROM skills WHERE id = $1', [skill_id]);
    if (skillCheck.rows.length === 0) {
      return errorResponse(res, 404, 'Skill not found');
    }

    const result = await db.query(
      `INSERT INTO worker_skills (worker_id, skill_id, hourly_rate, experience_years)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (worker_id, skill_id) DO UPDATE
       SET hourly_rate = EXCLUDED.hourly_rate,
           experience_years = EXCLUDED.experience_years
       RETURNING *`,
      [workerId, skill_id, hourly_rate, experience_years || 0]
    );

    return successResponse(res, 201, 'Skill added/updated for worker', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function removeSkill(req, res, next) {
  try {
    const { skillId } = req.params;

    const wpResult = await db.query('SELECT id FROM worker_profiles WHERE user_id = $1', [req.user.id]);
    if (wpResult.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }
    const workerId = wpResult.rows[0].id;

    const result = await db.query(
      'DELETE FROM worker_skills WHERE worker_id = $1 AND skill_id = $2 RETURNING *',
      [workerId, skillId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Skill association not found for worker');
    }

    return successResponse(res, 200, 'Skill removed from worker profile');
  } catch (err) {
    next(err);
  }
}

async function getPendingWorkers(req, res, next) {
  try {
    const status = req.query.status || 'pending';
    const result = await db.query(
      `SELECT wp.*, u.full_name, u.email, u.phone, u.created_at AS user_registered_at
       FROM worker_profiles wp
       JOIN users u ON wp.user_id = u.id
       WHERE wp.verification_status = $1::varchar
       ORDER BY wp.created_at DESC`,
      [status]
    );

    return successResponse(res, 200, `Workers with status ${status} retrieved`, result.rows);
  } catch (err) {
    next(err);
  }
}

async function verifyWorker(req, res, next) {
  try {
    const { id } = req.params;
    const { status, verification_notes } = req.body;

    const result = await db.query(
      `UPDATE worker_profiles
       SET verification_status = $1::varchar,
           verification_notes = COALESCE($2, verification_notes),
           verified_at = CASE WHEN $1::text = 'verified' THEN CURRENT_TIMESTAMP ELSE verified_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, verification_notes, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }

    return successResponse(res, 200, `Worker verification status updated to ${status}`, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyProfile,
  updateWorkerProfile,
  updateLocationAndAvailability,
  addSkill,
  removeSkill,
  getPendingWorkers,
  verifyWorker,
};
