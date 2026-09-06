const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function createRating(req, res, next) {
  let client;
  try {
    const { booking_id, score, comment } = req.body;
    const reviewer_id = req.user.id;
    const reviewer_role = req.user.role;

    client = await db.getClient();

    const bookingRes = await client.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
    if (bookingRes.rows.length === 0) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const booking = bookingRes.rows[0];

    if (booking.status !== 'completed') {
      return errorResponse(res, 400, 'Ratings can only be submitted for completed bookings');
    }

    let reviewee_id;
    if (reviewer_role === 'customer') {
      if (booking.customer_id !== reviewer_id) {
        return errorResponse(res, 403, 'You are not the customer for this booking');
      }
      if (!booking.worker_id) {
        return errorResponse(res, 400, 'No worker was assigned to this booking');
      }
      const wpRes = await client.query('SELECT user_id FROM worker_profiles WHERE id = $1', [booking.worker_id]);
      if (wpRes.rows.length === 0) {
        return errorResponse(res, 404, 'Worker user account not found');
      }
      reviewee_id = wpRes.rows[0].user_id;
    } else if (reviewer_role === 'gig_worker') {
      const wpRes = await client.query('SELECT id FROM worker_profiles WHERE user_id = $1', [reviewer_id]);
      if (wpRes.rows.length === 0 || wpRes.rows[0].id !== booking.worker_id) {
        return errorResponse(res, 403, 'You are not the assigned worker for this booking');
      }
      reviewee_id = booking.customer_id;
    } else {
      return errorResponse(res, 403, 'Only customers and workers can submit ratings');
    }

    await client.query('BEGIN');

    const ratingRes = await client.query(
      `INSERT INTO ratings (booking_id, reviewer_id, reviewee_id, reviewer_role, score, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [booking_id, reviewer_id, reviewee_id, reviewer_role, score, comment || null]
    );

    if (reviewer_role === 'customer') {
      const avgRes = await client.query(
        `SELECT AVG(score)::numeric(3,2) as avg_score, COUNT(*)::int as total_count
         FROM ratings
         WHERE reviewee_id = $1 AND reviewer_role = 'customer'`,
        [reviewee_id]
      );

      const avgScore = avgRes.rows[0].avg_score || 0.00;
      const totalCount = avgRes.rows[0].total_count || 0;

      await client.query(
        `UPDATE worker_profiles
         SET average_rating = $1,
             total_ratings = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3`,
        [avgScore, totalCount, reviewee_id]
      );
    }

    await client.query('COMMIT');

    return successResponse(res, 201, 'Rating submitted successfully', ratingRes.rows[0]);
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    if (err.code === '23505') {
      return errorResponse(res, 400, 'You have already submitted a rating for this booking');
    }
    next(err);
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function getWorkerRatings(req, res, next) {
  try {
    const { workerId } = req.params;

    const wpRes = await db.query('SELECT user_id FROM worker_profiles WHERE id = $1', [workerId]);
    if (wpRes.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }
    const userId = wpRes.rows[0].user_id;

    const result = await db.query(
      `SELECT r.*, u.full_name AS reviewer_name
       FROM ratings r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    return successResponse(res, 200, 'Worker ratings retrieved', result.rows);
  } catch (err) {
    next(err);
  }
}

async function getBookingRatings(req, res, next) {
  try {
    const { bookingId } = req.params;

    const result = await db.query(
      `SELECT r.*, u.full_name AS reviewer_name
       FROM ratings r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.booking_id = $1`,
      [bookingId]
    );

    return successResponse(res, 200, 'Booking ratings retrieved', result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRating,
  getWorkerRatings,
  getBookingRatings,
};
