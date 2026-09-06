const db = require('../config/db');
const { calculateDistance } = require('../utils/geo');
const { successResponse, errorResponse } = require('../utils/response');

async function findNearbyWorkers(req, res, next) {
  try {
    const { latitude, longitude, skill_id, category_id, max_distance_km = 25 } = req.query;

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const maxDist = parseFloat(max_distance_km);

    let query = `
      SELECT wp.id AS worker_id,
             wp.user_id,
             wp.bio,
             wp.latitude,
             wp.longitude,
             wp.address,
             wp.vehicle_type,
             wp.insurance_status,
             wp.is_available,
             wp.average_rating,
             wp.total_ratings,
             wp.completed_jobs_count,
             u.full_name,
             u.phone,
             u.email,
             COALESCE(
               json_agg(
                 json_build_object(
                   'skill_id', s.id,
                   'skill_name', s.name,
                   'category_id', s.category_id,
                   'category_name', c.name,
                   'hourly_rate', ws.hourly_rate
                 )
               ) FILTER (WHERE s.id IS NOT NULL), '[]'
             ) AS skills
      FROM worker_profiles wp
      JOIN users u ON wp.user_id = u.id
      LEFT JOIN worker_skills ws ON wp.id = ws.worker_id
      LEFT JOIN skills s ON ws.skill_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE wp.verification_status = 'verified'
        AND wp.is_available = true
        AND wp.latitude IS NOT NULL
        AND wp.longitude IS NOT NULL
    `;

    const params = [];

    if (skill_id) {
      params.push(skill_id);
      query += ` AND wp.id IN (SELECT worker_id FROM worker_skills WHERE skill_id = $${params.length})`;
    } else if (category_id) {
      params.push(category_id);
      query += ` AND wp.id IN (SELECT ws.worker_id FROM worker_skills ws JOIN skills sk ON ws.skill_id = sk.id WHERE sk.category_id = $${params.length})`;
    }

    query += ` GROUP BY wp.id, u.id`;

    const result = await db.query(query, params);

    // Calculate distances and filter by max_distance_km
    const workersWithDistance = result.rows
      .map((worker) => {
        const dist = calculateDistance(
          lat,
          lon,
          parseFloat(worker.latitude),
          parseFloat(worker.longitude)
        );
        return {
          ...worker,
          distance_km: dist,
        };
      })
      .filter((worker) => worker.distance_km <= maxDist)
      .sort((a, b) => a.distance_km - b.distance_km);

    return successResponse(res, 200, 'Nearby workers matched successfully', workersWithDistance, {
      total_found: workersWithDistance.length,
      max_distance_km: maxDist,
      search_coordinates: { latitude: lat, longitude: lon },
    });
  } catch (err) {
    next(err);
  }
}

async function matchBooking(req, res, next) {
  try {
    const { bookingId } = req.params;
    const max_distance_km = req.query.max_distance_km || 25;

    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingRes.rows.length === 0) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const booking = bookingRes.rows[0];
    const lat = parseFloat(booking.latitude);
    const lon = parseFloat(booking.longitude);
    const maxDist = parseFloat(max_distance_km);

    const query = `
      SELECT wp.id AS worker_id,
             wp.user_id,
             wp.bio,
             wp.latitude,
             wp.longitude,
             wp.vehicle_type,
             wp.insurance_status,
             wp.is_available,
             wp.average_rating,
             wp.total_ratings,
             wp.completed_jobs_count,
             u.full_name,
             u.phone,
             ws.hourly_rate,
             s.name AS skill_name
      FROM worker_profiles wp
      JOIN users u ON wp.user_id = u.id
      JOIN worker_skills ws ON wp.id = ws.worker_id
      JOIN skills s ON ws.skill_id = s.id
      WHERE wp.verification_status = 'verified'
        AND wp.is_available = true
        AND ws.skill_id = $1
        AND wp.latitude IS NOT NULL
        AND wp.longitude IS NOT NULL
    `;

    const result = await db.query(query, [booking.skill_id]);

    const candidates = result.rows
      .map((worker) => {
        const dist = calculateDistance(
          lat,
          lon,
          parseFloat(worker.latitude),
          parseFloat(worker.longitude)
        );
        return {
          ...worker,
          distance_km: dist,
        };
      })
      .filter((w) => w.distance_km <= maxDist)
      .sort((a, b) => a.distance_km - b.distance_km);

    return successResponse(res, 200, 'Matched worker candidates for booking', candidates, {
      booking_id: bookingId,
      candidates_count: candidates.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  findNearbyWorkers,
  matchBooking,
};
