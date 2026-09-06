const db = require('../config/db');
const { calculateDistance } = require('../utils/geo');
const { successResponse, errorResponse } = require('../utils/response');

function calculateWorkerScore(worker, bookingLat, bookingLon, maxDistance = 30) {
  const dist = calculateDistance(
    bookingLat,
    bookingLon,
    parseFloat(worker.latitude),
    parseFloat(worker.longitude)
  );

  const distanceScore = Math.max(0, 100 - (dist / maxDistance) * 100);
  const rating = parseFloat(worker.average_rating || 0);
  const ratingScore = (rating / 5.0) * 100;
  const jobs = parseInt(worker.completed_jobs_count || 0, 10);
  const years = parseInt(worker.experience_years || 0, 10);
  const experienceScore = Math.min(100, jobs * 5 + years * 10);
  const welfareScore = worker.insurance_status === 'active' ? 100 : 0;

  const totalScore = Math.round(
    distanceScore * 0.35 + ratingScore * 0.30 + experienceScore * 0.20 + welfareScore * 0.15
  );

  return {
    worker_id: worker.worker_id,
    full_name: worker.full_name,
    phone: worker.phone,
    email: worker.email,
    hourly_rate: worker.hourly_rate,
    distance_km: dist,
    scores: {
      total_score: totalScore,
      distance_score: Math.round(distanceScore),
      rating_score: Math.round(ratingScore),
      experience_score: Math.round(experienceScore),
      welfare_score: Math.round(welfareScore),
    },
    insurance_status: worker.insurance_status,
    completed_jobs_count: jobs,
    average_rating: rating,
  };
}

async function scoreWorkersForBooking(req, res, next) {
  try {
    const { bookingId } = req.params;
    const max_distance_km = parseFloat(req.query.max_distance_km || 30);

    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingRes.rows.length === 0) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const booking = bookingRes.rows[0];

    const query = `
      SELECT wp.id AS worker_id,
             wp.user_id,
             wp.latitude,
             wp.longitude,
             wp.insurance_status,
             wp.average_rating,
             wp.completed_jobs_count,
             u.full_name,
             u.phone,
             u.email,
             ws.hourly_rate,
             ws.experience_years
      FROM worker_profiles wp
      JOIN users u ON wp.user_id = u.id
      JOIN worker_skills ws ON wp.id = ws.worker_id
      WHERE wp.verification_status = 'verified'
        AND wp.is_available = true
        AND ws.skill_id = $1
        AND wp.latitude IS NOT NULL
        AND wp.longitude IS NOT NULL
    `;

    const result = await db.query(query, [booking.skill_id]);

    const scoredWorkers = result.rows
      .map((w) => calculateWorkerScore(w, parseFloat(booking.latitude), parseFloat(booking.longitude), max_distance_km))
      .filter((w) => w.distance_km <= max_distance_km)
      .sort((a, b) => b.scores.total_score - a.scores.total_score);

    return successResponse(res, 200, 'Smart worker allocation scores calculated', scoredWorkers, {
      booking_id: bookingId,
      candidates_evaluated: scoredWorkers.length,
      max_distance_km,
    });
  } catch (err) {
    next(err);
  }
}

async function autoAssignWorker(req, res, next) {
  try {
    const { bookingId } = req.params;

    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingRes.rows.length === 0) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const booking = bookingRes.rows[0];

    if (booking.status !== 'pending') {
      return errorResponse(res, 400, `Cannot auto-assign worker for booking with status '${booking.status}'`);
    }

    const query = `
      SELECT wp.id AS worker_id,
             wp.user_id,
             wp.latitude,
             wp.longitude,
             wp.insurance_status,
             wp.average_rating,
             wp.completed_jobs_count,
             u.full_name,
             u.phone,
             u.email,
             ws.hourly_rate,
             ws.experience_years
      FROM worker_profiles wp
      JOIN users u ON wp.user_id = u.id
      JOIN worker_skills ws ON wp.id = ws.worker_id
      WHERE wp.verification_status = 'verified'
        AND wp.is_available = true
        AND ws.skill_id = $1
        AND wp.latitude IS NOT NULL
        AND wp.longitude IS NOT NULL
    `;

    const result = await db.query(query, [booking.skill_id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'No available verified workers match this skill');
    }

    const scoredWorkers = result.rows
      .map((w) => calculateWorkerScore(w, parseFloat(booking.latitude), parseFloat(booking.longitude), 50))
      .sort((a, b) => b.scores.total_score - a.scores.total_score);

    const bestWorker = scoredWorkers[0];

    if (!bestWorker) {
      return errorResponse(res, 404, 'No suitable worker found within range');
    }

    const estAmount = Math.round(parseFloat(bestWorker.hourly_rate) * parseFloat(booking.estimated_hours) * 100) / 100;

    const updateRes = await db.query(
      `UPDATE bookings
       SET worker_id = $1,
           hourly_rate = $2,
           estimated_amount = $3,
           status = 'accepted',
           accepted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [bestWorker.worker_id, bestWorker.hourly_rate, estAmount, bookingId]
    );

    return successResponse(res, 200, 'Worker auto-assigned successfully based on Smart Allocation score', {
      booking: updateRes.rows[0],
      assigned_worker: bestWorker,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  scoreWorkersForBooking,
  autoAssignWorker,
};
