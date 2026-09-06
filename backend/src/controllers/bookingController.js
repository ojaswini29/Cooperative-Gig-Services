const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function createBooking(req, res, next) {
  try {
    const customer_id = req.user.id;
    const {
      category_id,
      skill_id,
      service_address,
      latitude,
      longitude,
      scheduled_time,
      estimated_hours,
      notes,
      worker_id,
    } = req.body;

    // Check skill and category
    const skillRes = await db.query(
      `SELECT s.*, c.id as cat_id
       FROM skills s
       JOIN categories c ON s.category_id = c.id
       WHERE s.id = $1 AND s.category_id = $2`,
      [skill_id, category_id]
    );

    if (skillRes.rows.length === 0) {
      return errorResponse(res, 404, 'Category or Skill not found or mismatch');
    }

    const skill = skillRes.rows[0];
    let hourly_rate = parseFloat(skill.base_hourly_rate);

    // If specific worker requested, get worker skill rate if present
    if (worker_id) {
      const wsRes = await db.query(
        `SELECT ws.hourly_rate
         FROM worker_skills ws
         JOIN worker_profiles wp ON ws.worker_id = wp.id
         WHERE ws.worker_id = $1 AND ws.skill_id = $2 AND wp.verification_status = 'verified'`,
        [worker_id, skill_id]
      );
      if (wsRes.rows.length > 0) {
        hourly_rate = parseFloat(wsRes.rows[0].hourly_rate);
      }
    }

    const hrs = parseFloat(estimated_hours || 1.0);
    const estimated_amount = Math.round(hourly_rate * hrs * 100) / 100;

    const result = await db.query(
      `INSERT INTO bookings (
        customer_id, worker_id, category_id, skill_id, status,
        service_address, latitude, longitude, scheduled_time,
        estimated_hours, hourly_rate, estimated_amount, notes
      ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        customer_id,
        worker_id || null,
        category_id,
        skill_id,
        service_address,
        latitude,
        longitude,
        scheduled_time,
        hrs,
        hourly_rate,
        estimated_amount,
        notes || null,
      ]
    );

    return successResponse(res, 201, 'Booking created successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listBookings(req, res, next) {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*,
             c_user.full_name AS customer_name, c_user.phone AS customer_phone, c_user.email AS customer_email,
             w_user.full_name AS worker_name, w_user.phone AS worker_phone,
             cat.name AS category_name,
             s.name AS skill_name,
             i.status AS invoice_status, i.amount_total AS invoice_amount
      FROM bookings b
      JOIN users c_user ON b.customer_id = c_user.id
      LEFT JOIN worker_profiles wp ON b.worker_id = wp.id
      LEFT JOIN users w_user ON wp.user_id = w_user.id
      JOIN categories cat ON b.category_id = cat.id
      JOIN skills s ON b.skill_id = s.id
      LEFT JOIN invoices i ON b.id = i.booking_id
    `;

    const whereClauses = [];
    const params = [];

    if (req.user.role === 'customer') {
      params.push(req.user.id);
      whereClauses.push(`b.customer_id = $${params.length}`);
    } else if (req.user.role === 'gig_worker') {
      const wpResult = await db.query('SELECT id FROM worker_profiles WHERE user_id = $1', [req.user.id]);
      const workerId = wpResult.rows.length > 0 ? wpResult.rows[0].id : null;
      params.push(workerId);
      whereClauses.push(`(b.worker_id = $${params.length} OR (b.status = 'pending' AND b.worker_id IS NULL))`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`b.status = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY b.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    return successResponse(res, 200, 'Bookings retrieved', result.rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      count: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
}

async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;

    const query = `
      SELECT b.*,
             c_user.full_name AS customer_name, c_user.phone AS customer_phone, c_user.email AS customer_email,
             w_user.full_name AS worker_name, w_user.phone AS worker_phone, wp.average_rating AS worker_rating,
             cat.name AS category_name,
             s.name AS skill_name,
             i.id AS invoice_id, i.status AS invoice_status, i.amount_total AS invoice_amount, i.paid_at
      FROM bookings b
      JOIN users c_user ON b.customer_id = c_user.id
      LEFT JOIN worker_profiles wp ON b.worker_id = wp.id
      LEFT JOIN users w_user ON wp.user_id = w_user.id
      JOIN categories cat ON b.category_id = cat.id
      JOIN skills s ON b.skill_id = s.id
      LEFT JOIN invoices i ON b.id = i.booking_id
      WHERE b.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const booking = result.rows[0];

    // Authorization check
    if (
      req.user.role === 'customer' && booking.customer_id !== req.user.id
    ) {
      return errorResponse(res, 403, 'Unauthorized access to this booking');
    }

    return successResponse(res, 200, 'Booking details retrieved', booking);
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;

    // Check booking status
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingRes.rows.length === 0) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const booking = bookingRes.rows[0];

    if (req.user.role === 'customer' && booking.customer_id !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to cancel this booking');
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return errorResponse(res, 400, `Cannot cancel booking with status '${booking.status}'`);
    }

    const result = await db.query(
      `UPDATE bookings
       SET status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return successResponse(res, 200, 'Booking cancelled successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking,
  listBookings,
  getBookingById,
  cancelBooking,
};
