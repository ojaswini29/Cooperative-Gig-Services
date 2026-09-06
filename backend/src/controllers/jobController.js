const db = require('../config/db');
const env = require('../config/env');
const { successResponse, errorResponse } = require('../utils/response');

async function acceptJob(req, res, next) {
  try {
    const { bookingId } = req.params;

    const wpResult = await db.query('SELECT * FROM worker_profiles WHERE user_id = $1', [req.user.id]);
    if (wpResult.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }

    const worker = wpResult.rows[0];

    if (worker.verification_status !== 'verified') {
      return errorResponse(res, 403, 'Only verified workers can accept job requests');
    }

    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingRes.rows.length === 0) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const booking = bookingRes.rows[0];

    if (booking.status !== 'pending') {
      return errorResponse(res, 400, `Booking cannot be accepted because it is already '${booking.status}'`);
    }

    if (booking.worker_id && booking.worker_id !== worker.id) {
      return errorResponse(res, 400, 'Booking was assigned to a different worker');
    }

    let hourly_rate = booking.hourly_rate;
    const wsRes = await db.query(
      'SELECT hourly_rate FROM worker_skills WHERE worker_id = $1 AND skill_id = $2',
      [worker.id, booking.skill_id]
    );
    if (wsRes.rows.length > 0) {
      hourly_rate = parseFloat(wsRes.rows[0].hourly_rate);
    }

    const estAmount = Math.round(hourly_rate * parseFloat(booking.estimated_hours) * 100) / 100;

    const result = await db.query(
      `UPDATE bookings
       SET worker_id = $1,
           hourly_rate = $2,
           estimated_amount = $3,
           status = 'accepted',
           accepted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [worker.id, hourly_rate, estAmount, bookingId]
    );

    return successResponse(res, 200, 'Job accepted successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function startJob(req, res, next) {
  try {
    const { bookingId } = req.params;

    const wpResult = await db.query('SELECT id FROM worker_profiles WHERE user_id = $1', [req.user.id]);
    if (wpResult.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }
    const workerId = wpResult.rows[0].id;

    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingRes.rows.length === 0) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const booking = bookingRes.rows[0];

    if (booking.worker_id !== workerId) {
      return errorResponse(res, 403, 'You are not the assigned worker for this job');
    }

    if (booking.status !== 'accepted') {
      return errorResponse(res, 400, `Cannot start job with status '${booking.status}'`);
    }

    const result = await db.query(
      `UPDATE bookings
       SET status = 'in_progress',
           started_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [bookingId]
    );

    return successResponse(res, 200, 'Job started successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function completeJob(req, res, next) {
  let client;
  try {
    const { bookingId } = req.params;
    const { actual_hours } = req.body;

    client = await db.getClient();

    const wpResult = await client.query('SELECT id FROM worker_profiles WHERE user_id = $1', [req.user.id]);
    if (wpResult.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }
    const workerId = wpResult.rows[0].id;

    const bookingRes = await client.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingRes.rows.length === 0) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const booking = bookingRes.rows[0];

    if (booking.worker_id !== workerId) {
      return errorResponse(res, 403, 'You are not the assigned worker for this job');
    }

    if (booking.status !== 'in_progress' && booking.status !== 'accepted') {
      return errorResponse(res, 400, `Cannot complete job with status '${booking.status}'`);
    }

    const actHours = parseFloat(actual_hours);
    const hourlyRate = parseFloat(booking.hourly_rate);
    const finalAmount = Math.round(hourlyRate * actHours * 100) / 100;

    const coopFee = Math.round(finalAmount * (env.coop.feePercentage / 100) * 100) / 100;
    const welfareContribution = Math.round(finalAmount * (env.coop.welfarePercentage / 100) * 100) / 100;

    await client.query('BEGIN');

    // 1. Update Booking
    const updatedBookingRes = await client.query(
      `UPDATE bookings
       SET status = 'completed',
           actual_hours = $1,
           final_amount = $2,
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [actHours, finalAmount, bookingId]
    );

    // 2. Increment Worker Completed Jobs Count
    await client.query(
      `UPDATE worker_profiles
       SET completed_jobs_count = completed_jobs_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [workerId]
    );

    // 3. Create Invoice
    const invoiceRes = await client.query(
      `INSERT INTO invoices (
        booking_id, customer_id, worker_id,
        amount_subtotal, coop_fee_amount, welfare_contribution_amount,
        amount_total, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid')
      ON CONFLICT (booking_id) DO UPDATE
      SET amount_subtotal = EXCLUDED.amount_subtotal,
          coop_fee_amount = EXCLUDED.coop_fee_amount,
          welfare_contribution_amount = EXCLUDED.welfare_contribution_amount,
          amount_total = EXCLUDED.amount_total,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        bookingId,
        booking.customer_id,
        workerId,
        finalAmount,
        coopFee,
        welfareContribution,
        finalAmount,
      ]
    );

    // 4. Record Welfare Fund Ledger Credit
    await client.query(
      `INSERT INTO welfare_fund_ledger (type, amount, booking_id, description)
       VALUES ('credit_from_job', $1, $2, $3)`,
      [
        welfareContribution,
        bookingId,
        `Co-op welfare contribution from job completion #${bookingId.substring(0, 8)}`,
      ]
    );

    await client.query('COMMIT');

    return successResponse(res, 200, 'Job completed successfully and invoice generated', {
      booking: updatedBookingRes.rows[0],
      invoice: invoiceRes.rows[0],
    });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    next(err);
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function getMyJobs(req, res, next) {
  try {
    const wpResult = await db.query('SELECT id FROM worker_profiles WHERE user_id = $1', [req.user.id]);
    if (wpResult.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }
    const workerId = wpResult.rows[0].id;

    const { status } = req.query;

    let query = `
      SELECT b.*,
             c_user.full_name AS customer_name, c_user.phone AS customer_phone,
             cat.name AS category_name, s.name AS skill_name,
             i.status AS invoice_status, i.amount_total AS invoice_amount
      FROM bookings b
      JOIN users c_user ON b.customer_id = c_user.id
      JOIN categories cat ON b.category_id = cat.id
      JOIN skills s ON b.skill_id = s.id
      LEFT JOIN invoices i ON b.id = i.booking_id
      WHERE b.worker_id = $1
    `;

    const params = [workerId];

    if (status) {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await db.query(query, params);

    return successResponse(res, 200, 'Worker jobs retrieved', result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  acceptJob,
  startJob,
  completeJob,
  getMyJobs,
};
