const db = require('../config/db');
const { successResponse } = require('../utils/response');

async function getDemandFeatures(req, res, next) {
  try {
    const { category_id, days = 90 } = req.query;

    let query = `
      SELECT
        ROUND(b.latitude::numeric, 2) AS grid_lat,
        ROUND(b.longitude::numeric, 2) AS grid_lon,
        b.category_id,
        cat.name AS category_name,
        b.skill_id,
        s.name AS skill_name,
        EXTRACT(DOW FROM b.scheduled_time)::int AS day_of_week,
        EXTRACT(HOUR FROM b.scheduled_time)::int AS hour_of_day,
        COUNT(b.id)::int AS total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::int AS completed_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END)::int AS cancelled_bookings,
        ROUND(AVG(b.estimated_hours)::numeric, 2) AS avg_estimated_hours,
        ROUND(AVG(b.hourly_rate)::numeric, 2) AS avg_hourly_rate,
        ROUND(SUM(COALESCE(b.final_amount, b.estimated_amount))::numeric, 2) AS total_gross_value,
        ROUND((COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(b.id), 0))::numeric, 2) AS completion_rate
      FROM bookings b
      JOIN categories cat ON b.category_id = cat.id
      JOIN skills s ON b.skill_id = s.id
      WHERE b.created_at >= CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL
    `;

    const params = [parseInt(days)];

    if (category_id) {
      params.push(category_id);
      query += ` AND b.category_id = $${params.length}`;
    }

    query += `
      GROUP BY grid_lat, grid_lon, b.category_id, cat.name, b.skill_id, s.name, day_of_week, hour_of_day
      ORDER BY total_bookings DESC
    `;

    const result = await db.query(query, params);

    return successResponse(res, 200, 'AI-ready demand feature vectors generated', result.rows, {
      total_feature_rows: result.rows.length,
      timeframe_days: parseInt(days),
      schema_description: {
        grid_lat: 'Rounded latitude grid coordinate',
        grid_lon: 'Rounded longitude grid coordinate',
        day_of_week: '0 = Sunday, 1 = Monday, ..., 6 = Saturday',
        hour_of_day: '0 to 23 hour slot',
        total_bookings: 'Target demand variable (booking volume)',
        completion_rate: 'Supply fulfillment ratio',
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getPredictiveDemand(req, res, next) {
  try {
    const { category_id, forecast_horizon_days = 7 } = req.query;

    let query = `
      SELECT
        ROUND(b.latitude::numeric, 2) AS grid_lat,
        ROUND(b.longitude::numeric, 2) AS grid_lon,
        b.category_id,
        cat.name AS category_name,
        COUNT(b.id)::int AS historical_booking_count,
        ROUND(COUNT(b.id)::numeric / 30.0, 2) AS daily_baseline_demand,
        ROUND((COUNT(b.id)::numeric / 30.0) * $1, 2) AS projected_demand_units,
        CASE
          WHEN COUNT(b.id) >= 50 THEN 'CRITICAL_HIGH'
          WHEN COUNT(b.id) >= 20 THEN 'HIGH'
          WHEN COUNT(b.id) >= 5 THEN 'MODERATE'
          ELSE 'LOW'
        END AS demand_zone_level,
        CASE
          WHEN COUNT(b.id) >= 20 THEN 1.25
          WHEN COUNT(b.id) >= 10 THEN 1.10
          ELSE 1.00
        END AS peak_surge_multiplier
      FROM bookings b
      JOIN categories cat ON b.category_id = cat.id
      WHERE b.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
    `;

    const params = [parseInt(forecast_horizon_days)];

    if (category_id) {
      params.push(category_id);
      query += ` AND b.category_id = $${params.length}`;
    }

    query += `
      GROUP BY grid_lat, grid_lon, b.category_id, cat.name
      ORDER BY historical_booking_count DESC
    `;

    const result = await db.query(query, params);

    return successResponse(res, 200, 'Predictive demand projection computed', result.rows, {
      forecast_horizon_days: parseInt(forecast_horizon_days),
      total_zones_modeled: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDemandFeatures,
  getPredictiveDemand,
};
