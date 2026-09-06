const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function getInvoiceById(req, res, next) {
  try {
    const { id } = req.params;

    const query = `
      SELECT i.*,
             b.service_address, b.scheduled_time, b.actual_hours, b.hourly_rate,
             c_user.full_name AS customer_name, c_user.email AS customer_email,
             w_user.full_name AS worker_name,
             cat.name AS category_name, s.name AS skill_name
      FROM invoices i
      JOIN bookings b ON i.booking_id = b.id
      JOIN users c_user ON i.customer_id = c_user.id
      LEFT JOIN worker_profiles wp ON i.worker_id = wp.id
      LEFT JOIN users w_user ON wp.user_id = w_user.id
      JOIN categories cat ON b.category_id = cat.id
      JOIN skills s ON b.skill_id = s.id
      WHERE i.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Invoice not found');
    }

    return successResponse(res, 200, 'Invoice details retrieved', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getInvoiceByBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    const query = `
      SELECT i.*,
             b.service_address, b.scheduled_time, b.actual_hours, b.hourly_rate,
             c_user.full_name AS customer_name, c_user.email AS customer_email,
             w_user.full_name AS worker_name,
             cat.name AS category_name, s.name AS skill_name
      FROM invoices i
      JOIN bookings b ON i.booking_id = b.id
      JOIN users c_user ON i.customer_id = c_user.id
      LEFT JOIN worker_profiles wp ON i.worker_id = wp.id
      LEFT JOIN users w_user ON wp.user_id = w_user.id
      JOIN categories cat ON b.category_id = cat.id
      JOIN skills s ON b.skill_id = s.id
      WHERE i.booking_id = $1
    `;

    const result = await db.query(query, [bookingId]);

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Invoice not found for this booking');
    }

    return successResponse(res, 200, 'Invoice retrieved for booking', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function processMockPayment(req, res, next) {
  try {
    const { invoice_id, payment_method, transaction_reference } = req.body;

    const invRes = await db.query('SELECT * FROM invoices WHERE id = $1', [invoice_id]);

    if (invRes.rows.length === 0) {
      return errorResponse(res, 404, 'Invoice not found');
    }

    const invoice = invRes.rows[0];

    // Check customer authorization
    if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
      return errorResponse(res, 403, 'Unauthorized to process payment for this invoice');
    }

    if (invoice.status === 'paid') {
      return errorResponse(res, 400, 'Invoice is already paid');
    }

    const txnRef = transaction_reference || `MOCK_TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const result = await db.query(
      `UPDATE invoices
       SET status = 'paid',
           paid_at = CURRENT_TIMESTAMP,
           payment_method = $1,
           transaction_reference = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [payment_method, txnRef, invoice_id]
    );

    return successResponse(res, 200, 'Mock payment processed successfully', {
      invoice: result.rows[0],
      receipt: {
        transaction_reference: txnRef,
        payment_method,
        amount_paid: result.rows[0].amount_total,
        coop_welfare_fund_portion: result.rows[0].welfare_contribution_amount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInvoiceById,
  getInvoiceByBooking,
  processMockPayment,
};
