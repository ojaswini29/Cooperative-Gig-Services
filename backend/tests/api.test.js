const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const runMigrations = require('../src/db/migrate');

describe('Cooperative Gig Services API Integration Tests', () => {
  let adminToken, customerToken, workerToken;
  let adminId, customerId, workerUserId, workerProfileId;
  let categoryId, skillId;
  let bookingId, invoiceId, claimId;

  beforeAll(async () => {
    // Ensure database tables exist
    await runMigrations();

    // Clean up any data before tests
    await db.query(`
      TRUNCATE users, worker_profiles, categories, skills, worker_skills,
               bookings, invoices, ratings, welfare_claims, welfare_fund_ledger CASCADE
    `);
  });

  afterAll(async () => {
    // Clean up database tables after tests so database remains completely EMPTY as required
    await db.query(`
      TRUNCATE users, worker_profiles, categories, skills, worker_skills,
               bookings, invoices, ratings, welfare_claims, welfare_fund_ledger CASCADE
    `);
    await db.pool.end();
  });

  describe('1. Authentication & Registration', () => {
    test('POST /api/v1/auth/register - Register Admin', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'admin@coop.org',
          password: 'AdminPassword123!',
          full_name: 'Coop Admin User',
          phone: '+1111111111',
          role: 'cooperative_admin',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      adminToken = res.body.data.token;
      adminId = res.body.data.user.id;
    });

    test('POST /api/v1/auth/register - Register Customer', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'customer@example.com',
          password: 'CustomerPassword123!',
          full_name: 'Alice Customer',
          phone: '+2222222222',
          role: 'customer',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      customerToken = res.body.data.token;
      customerId = res.body.data.user.id;
    });

    test('POST /api/v1/auth/register - Register Gig Worker', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'worker@example.com',
          password: 'WorkerPassword123!',
          full_name: 'Bob Electrician',
          phone: '+3333333333',
          role: 'gig_worker',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      workerToken = res.body.data.token;
      workerUserId = res.body.data.user.id;
      workerProfileId = res.body.data.user.worker_profile.id;
    });

    test('POST /api/v1/auth/login - Login Customer', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'CustomerPassword123!',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.token).toBeDefined();
    });

    test('GET /api/v1/auth/me - Fetch Logged-in User Profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${workerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.user.email).toEqual('worker@example.com');
      expect(res.body.data.user.worker_profile).toBeDefined();
    });
  });

  describe('2. Worker Profile & Verification', () => {
    test('PUT /api/v1/workers/profile - Update Worker Profile', async () => {
      const res = await request(app)
        .put('/api/v1/workers/profile')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          bio: 'Licensed professional electrician with 8 years experience.',
          latitude: 18.5204,
          longitude: 73.8567,
          address: '789 Worker St, Pune',
          vehicle_type: 'Electric Scooter',
          insurance_provider: 'Coop Worker Mutual Fund',
          insurance_policy_number: 'CW-887766',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.bio).toContain('electrician');
    });

    test('GET /api/v1/workers/pending - Admin Fetch Pending Workers', async () => {
      const res = await request(app)
        .get('/api/v1/workers/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('PATCH /api/v1/workers/:id/verify - Admin Verify Worker', async () => {
      const res = await request(app)
        .patch(`/api/v1/workers/${workerProfileId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'verified',
          verification_notes: 'All documents verified and background check passed.',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.verification_status).toEqual('verified');
    });
  });

  describe('3. Categories & Skills Management', () => {
    test('POST /api/v1/categories - Admin Create Category', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Electrical Services',
          description: 'Wiring, repairs, and appliance installations.',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.id).toBeDefined();
      categoryId = res.body.data.id;
    });

    test('POST /api/v1/skills - Admin Create Skill', async () => {
      const res = await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category_id: categoryId,
          name: 'Home Wiring & Repair',
          description: 'Diagnostic and repair of residential wiring',
          base_hourly_rate: 30.00,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.id).toBeDefined();
      skillId = res.body.data.id;
    });

    test('POST /api/v1/workers/skills - Worker Add Skill', async () => {
      const res = await request(app)
        .post('/api/v1/workers/skills')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          skill_id: skillId,
          hourly_rate: 35.00,
          experience_years: 5,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.hourly_rate).toEqual('35.00');
    });
  });

  describe('4. Customer Booking & Geo-Matching', () => {
    test('POST /api/v1/bookings - Customer Create Booking', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          category_id: categoryId,
          skill_id: skillId,
          service_address: '100 Green Park, Pune',
          latitude: 18.5204,
          longitude: 73.8567,
          scheduled_time: new Date(Date.now() + 86400000).toISOString(),
          estimated_hours: 2.0,
          notes: 'Short circuit in living room light',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.status).toEqual('pending');
      bookingId = res.body.data.id;
    });

    test('GET /api/v1/match/workers - Match Nearby Workers', async () => {
      const res = await request(app)
        .get(`/api/v1/match/workers?latitude=18.5204&longitude=73.8567&skill_id=${skillId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].distance_km).toBeLessThanOrEqual(5);
    });

    test('GET /api/v1/allocation/score/:bookingId - Calculate Smart Allocation Scores', async () => {
      const res = await request(app)
        .get(`/api/v1/allocation/score/${bookingId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].scores.total_score).toBeGreaterThan(0);
    });
  });

  describe('5. Job Lifecycle & Acceptance', () => {
    test('POST /api/v1/jobs/:bookingId/accept - Worker Accept Job', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${bookingId}/accept`)
        .set('Authorization', `Bearer ${workerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('accepted');
    });

    test('POST /api/v1/jobs/:bookingId/start - Worker Start Job', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${bookingId}/start`)
        .set('Authorization', `Bearer ${workerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('in_progress');
    });

    test('POST /api/v1/jobs/:bookingId/complete - Worker Complete Job & Generate Invoice', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${bookingId}/complete`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          actual_hours: 2.0,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.booking.status).toEqual('completed');
      expect(res.body.data.invoice.amount_total).toEqual('70.00'); // 35 * 2
      expect(res.body.data.invoice.welfare_contribution_amount).toEqual('3.50'); // 5% of 70
      invoiceId = res.body.data.invoice.id;
    });
  });

  describe('6. Invoice & Mock Payment', () => {
    test('GET /api/v1/invoices/:id - Fetch Invoice', async () => {
      const res = await request(app)
        .get(`/api/v1/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('unpaid');
    });

    test('POST /api/v1/payments/process - Process Mock Payment', async () => {
      const res = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          invoice_id: invoiceId,
          payment_method: 'coop_wallet',
          transaction_reference: 'MOCK_PAY_1001',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.invoice.status).toEqual('paid');
      expect(res.body.data.receipt.transaction_reference).toEqual('MOCK_PAY_1001');
    });
  });

  describe('7. Ratings & Reviews', () => {
    test('POST /api/v1/ratings - Customer Rate Worker', async () => {
      const res = await request(app)
        .post('/api/v1/ratings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          booking_id: bookingId,
          score: 5,
          comment: 'Fantastic job, fixed the issue quickly!',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.score).toEqual(5);
    });

    test('GET /api/v1/ratings/worker/:workerId - Fetch Worker Ratings', async () => {
      const res = await request(app)
        .get(`/api/v1/ratings/worker/${workerProfileId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(1);
      expect(res.body.data[0].score).toEqual(5);
    });
  });

  describe('8. Cooperative Welfare & Insurance', () => {
    test('GET /api/v1/welfare/worker/status - Get Worker Welfare Details', async () => {
      const res = await request(app)
        .get('/api/v1/welfare/worker/status')
        .set('Authorization', `Bearer ${workerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.insurance.coverage_active).toBe(true);
      expect(res.body.data.welfare_contributions.total_contributed).toEqual(3.5);
    });

    test('POST /api/v1/welfare/claims - Worker Submit Welfare Claim', async () => {
      const res = await request(app)
        .post('/api/v1/welfare/claims')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          title: 'Safety Equipment Allowance',
          claim_type: 'equipment',
          description: 'Purchase of insulated protective gloves and multimeter.',
          amount_requested: 50.00,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.status).toEqual('pending');
      claimId = res.body.data.id;
    });

    test('PATCH /api/v1/welfare/claims/:id/status - Admin Approve Claim', async () => {
      const res = await request(app)
        .patch(`/api/v1/welfare/claims/${claimId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          amount_approved: 50.00,
          admin_notes: 'Approved under safety gear subsidy.',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('approved');
    });

    test('GET /api/v1/welfare/summary - Admin Welfare Summary', async () => {
      const res = await request(app)
        .get('/api/v1/welfare/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.fund_ledger.total_contributions_collected).toBeDefined();
    });
  });

  describe('9. AI Demand Forecasting & Admin Dashboard', () => {
    test('GET /api/v1/forecasting/demand-features - AI Feature Dataset', async () => {
      const res = await request(app)
        .get('/api/v1/forecasting/demand-features')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toBeDefined();
    });

    test('GET /api/v1/forecasting/predict - Predictive Demand Projections', async () => {
      const res = await request(app)
        .get('/api/v1/forecasting/predict')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toBeDefined();
    });

    test('GET /api/v1/admin/dashboard - Comprehensive Admin Dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.financials.gross_revenue).toBeDefined();
      expect(res.body.data.recent_bookings.length).toBeGreaterThan(0);
    });
  });
});
