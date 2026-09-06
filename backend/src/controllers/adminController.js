const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function getDashboardStats(req, res, next) {
  try {
    // 1. Users by role
    const usersRes = await db.query(
      `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`
    );

    // 2. Workers by verification status
    const workersRes = await db.query(
      `SELECT verification_status, COUNT(*)::int AS count FROM worker_profiles GROUP BY verification_status`
    );

    // 3. Bookings by status
    const bookingsRes = await db.query(
      `SELECT status, COUNT(*)::int AS count, SUM(COALESCE(final_amount, estimated_amount))::numeric(10,2) as total_val FROM bookings GROUP BY status`
    );

    // 4. Financials & Welfare
    const finRes = await db.query(
      `SELECT
         COALESCE(SUM(amount_subtotal), 0.00) AS gross_revenue,
         COALESCE(SUM(coop_fee_amount), 0.00) AS total_coop_fees,
         COALESCE(SUM(welfare_contribution_amount), 0.00) AS total_welfare_collected
       FROM invoices WHERE status = 'paid'`
    );

    const welfareFundRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0.00) AS net_welfare_fund_balance FROM welfare_fund_ledger`
    );

    // 5. Categories & Skills counts
    const catalogRes = await db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM categories) AS categories_count,
         (SELECT COUNT(*)::int FROM skills) AS skills_count`
    );

    // 6. Recent Bookings
    const recentBookingsRes = await db.query(
      `SELECT b.id, b.status, b.created_at, b.estimated_amount,
              u.full_name AS customer_name, cat.name AS category_name
       FROM bookings b
       JOIN users u ON b.customer_id = u.id
       JOIN categories cat ON b.category_id = cat.id
       ORDER BY b.created_at DESC LIMIT 5`
    );

    return successResponse(res, 200, 'Admin dashboard metrics retrieved', {
      user_distribution: usersRes.rows,
      worker_verifications: workersRes.rows,
      booking_metrics: bookingsRes.rows,
      financials: {
        ...finRes.rows[0],
        net_welfare_fund_balance: parseFloat(welfareFundRes.rows[0].net_welfare_fund_balance),
      },
      catalog: catalogRes.rows[0],
      recent_bookings: recentBookingsRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const { role, search, is_active, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT id, email, full_name, phone, role, is_active, created_at FROM users`;
    const whereClauses = [];
    const params = [];

    if (role) {
      params.push(role);
      whereClauses.push(`role = $${params.length}`);
    }

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      whereClauses.push(`is_active = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    return successResponse(res, 200, 'Users retrieved', result.rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      count: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active, role } = req.body;

    const result = await db.query(
      `UPDATE users
       SET is_active = COALESCE($1, is_active),
           role = COALESCE($2, role),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, full_name, role, is_active, updated_at`,
      [is_active, role, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User status updated successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  listUsers,
  updateUserStatus,
};
