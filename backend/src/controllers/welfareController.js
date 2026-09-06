const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function getWorkerWelfareStatus(req, res, next) {
  try {
    const wpRes = await db.query(
      `SELECT id, user_id, insurance_status, insurance_provider, insurance_policy_number,
              completed_jobs_count, created_at
       FROM worker_profiles WHERE user_id = $1`,
      [req.user.id]
    );

    if (wpRes.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }

    const worker = wpRes.rows[0];

    const ledgerRes = await db.query(
      `SELECT COALESCE(SUM(i.welfare_contribution_amount), 0.00) AS total_welfare_earned
       FROM invoices i
       JOIN bookings b ON i.booking_id = b.id
       WHERE b.worker_id = $1 AND b.status = 'completed'`,
      [worker.id]
    );

    const claimsRes = await db.query(
      'SELECT * FROM welfare_claims WHERE worker_id = $1 ORDER BY created_at DESC',
      [worker.id]
    );

    return successResponse(res, 200, 'Worker welfare status retrieved', {
      insurance: {
        status: worker.insurance_status,
        provider: worker.insurance_provider || 'Co-op Mutual Health & Safety Protection',
        policy_number: worker.insurance_policy_number || `COOP-POL-${worker.id.substring(0, 8).toUpperCase()}`,
        coverage_active: worker.insurance_status === 'active',
      },
      welfare_contributions: {
        total_contributed: parseFloat(ledgerRes.rows[0].total_welfare_earned),
        completed_jobs_count: worker.completed_jobs_count,
      },
      claims: claimsRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

async function submitClaim(req, res, next) {
  try {
    const { title, claim_type, description, amount_requested } = req.body;

    const wpRes = await db.query('SELECT id FROM worker_profiles WHERE user_id = $1', [req.user.id]);
    if (wpRes.rows.length === 0) {
      return errorResponse(res, 404, 'Worker profile not found');
    }

    const workerId = wpRes.rows[0].id;

    const result = await db.query(
      `INSERT INTO welfare_claims (worker_id, title, claim_type, description, amount_requested, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [workerId, title, claim_type, description, amount_requested]
    );

    return successResponse(res, 201, 'Welfare claim submitted successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listClaims(req, res, next) {
  try {
    const { status } = req.query;

    let query = `
      SELECT wc.*,
             wp.user_id, wp.insurance_status,
             u.full_name AS worker_name, u.email AS worker_email, u.phone AS worker_phone
      FROM welfare_claims wc
      JOIN worker_profiles wp ON wc.worker_id = wp.id
      JOIN users u ON wp.user_id = u.id
    `;

    const whereClauses = [];
    const params = [];

    if (req.user.role === 'gig_worker') {
      const wpRes = await db.query('SELECT id FROM worker_profiles WHERE user_id = $1', [req.user.id]);
      const workerId = wpRes.rows.length > 0 ? wpRes.rows[0].id : null;
      params.push(workerId);
      whereClauses.push(`wc.worker_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`wc.status = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY wc.created_at DESC';

    const result = await db.query(query, params);

    return successResponse(res, 200, 'Welfare claims retrieved', result.rows);
  } catch (err) {
    next(err);
  }
}

async function updateClaimStatus(req, res, next) {
  let client;
  try {
    const { id } = req.params;
    const { status, amount_approved, admin_notes } = req.body;

    client = await db.getClient();

    const claimRes = await client.query('SELECT * FROM welfare_claims WHERE id = $1', [id]);
    if (claimRes.rows.length === 0) {
      return errorResponse(res, 404, 'Welfare claim not found');
    }

    const claim = claimRes.rows[0];
    const approvedAmt = amount_approved !== undefined ? parseFloat(amount_approved) : parseFloat(claim.amount_requested);

    await client.query('BEGIN');

    const updatedClaimRes = await client.query(
      `UPDATE welfare_claims
       SET status = $1,
           amount_approved = $2,
           admin_notes = COALESCE($3, admin_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, approvedAmt, admin_notes, id]
    );

    if (['approved', 'paid_out'].includes(status) && approvedAmt > 0) {
      await client.query(
        `INSERT INTO welfare_fund_ledger (type, amount, claim_id, description)
         VALUES ('payout_claim', $1, $2, $3)`,
        [-approvedAmt, id, `Payout for welfare claim #${id.substring(0, 8)}: ${claim.title}`]
      );
    }

    await client.query('COMMIT');

    return successResponse(res, 200, `Welfare claim status updated to '${status}'`, updatedClaimRes.rows[0]);
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

async function getWelfareSummary(req, res, next) {
  try {
    const ledgerRes = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0.00) AS total_credits,
         COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0.00) AS total_payouts,
         COALESCE(SUM(amount), 0.00) AS net_fund_balance
       FROM welfare_fund_ledger`
    );

    const workerStatsRes = await db.query(
      `SELECT
         COUNT(*)::int AS total_workers,
         COUNT(CASE WHEN insurance_status = 'active' THEN 1 END)::int AS active_insured_workers
       FROM worker_profiles`
    );

    const claimStatsRes = await db.query(
      `SELECT
         COUNT(*)::int AS total_claims,
         COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending_claims,
         COUNT(CASE WHEN status IN ('approved', 'paid_out') THEN 1 END)::int AS approved_claims,
         COALESCE(SUM(CASE WHEN status IN ('approved', 'paid_out') THEN amount_approved ELSE 0 END), 0.00) AS total_claim_amount_approved
       FROM welfare_claims`
    );

    return successResponse(res, 200, 'Cooperative welfare fund summary retrieved', {
      fund_ledger: {
        total_contributions_collected: parseFloat(ledgerRes.rows[0].total_credits),
        total_payouts_distributed: parseFloat(ledgerRes.rows[0].total_payouts),
        net_fund_balance: parseFloat(ledgerRes.rows[0].net_fund_balance),
      },
      worker_coverage: workerStatsRes.rows[0],
      claims_summary: claimStatsRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWorkerWelfareStatus,
  submitClaim,
  listClaims,
  updateClaimStatus,
  getWelfareSummary,
};
