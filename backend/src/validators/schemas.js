const Joi = require('joi');

const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().allow('', null),
    role: Joi.string().valid('customer', 'gig_worker', 'cooperative_admin').required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    full_name: Joi.string().min(2).max(100),
    phone: Joi.string().allow('', null),
  }),
};

const workerSchemas = {
  updateProfile: Joi.object({
    bio: Joi.string().allow('', null),
    latitude: Joi.number().min(-90).max(90).allow(null),
    longitude: Joi.number().min(-180).max(180).allow(null),
    address: Joi.string().allow('', null),
    vehicle_type: Joi.string().allow('', null),
    insurance_provider: Joi.string().allow('', null),
    insurance_policy_number: Joi.string().allow('', null),
    identity_document_url: Joi.string().uri().allow('', null),
  }),

  updateLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    is_available: Joi.boolean(),
  }),

  addSkill: Joi.object({
    skill_id: Joi.string().uuid().required(),
    hourly_rate: Joi.number().positive().required(),
    experience_years: Joi.number().integer().min(0).default(0),
  }),

  verifyWorker: Joi.object({
    status: Joi.string().valid('verified', 'rejected', 'pending').required(),
    verification_notes: Joi.string().allow('', null),
  }),
};

const categorySchemas = {
  createCategory: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('', null),
  }),

  updateCategory: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().allow('', null),
  }),

  createSkill: Joi.object({
    category_id: Joi.string().uuid().required(),
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('', null),
    base_hourly_rate: Joi.number().positive().default(25.00),
  }),

  updateSkill: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().allow('', null),
    base_hourly_rate: Joi.number().positive(),
  }),
};

const bookingSchemas = {
  createBooking: Joi.object({
    category_id: Joi.string().uuid().required(),
    skill_id: Joi.string().uuid().required(),
    service_address: Joi.string().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    scheduled_time: Joi.date().iso().required(),
    estimated_hours: Joi.number().positive().default(1.0),
    notes: Joi.string().allow('', null),
    worker_id: Joi.string().uuid().allow(null),
  }),
};

const matchSchemas = {
  findNearby: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    skill_id: Joi.string().uuid().allow(null, ''),
    category_id: Joi.string().uuid().allow(null, ''),
    max_distance_km: Joi.number().positive().default(25),
  }),
};

const jobSchemas = {
  completeJob: Joi.object({
    actual_hours: Joi.number().positive().required(),
  }),
};

const paymentSchemas = {
  processPayment: Joi.object({
    invoice_id: Joi.string().uuid().required(),
    payment_method: Joi.string().valid('credit_card', 'debit_card', 'upi', 'coop_wallet', 'bank_transfer').required(),
    transaction_reference: Joi.string().allow('', null),
  }),
};

const ratingSchemas = {
  createRating: Joi.object({
    booking_id: Joi.string().uuid().required(),
    score: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().allow('', null),
  }),
};

const welfareSchemas = {
  submitClaim: Joi.object({
    title: Joi.string().min(3).max(255).required(),
    claim_type: Joi.string().valid('health', 'injury', 'equipment', 'education', 'emergency').required(),
    description: Joi.string().min(10).required(),
    amount_requested: Joi.number().positive().required(),
  }),

  updateClaimStatus: Joi.object({
    status: Joi.string().valid('approved', 'rejected', 'paid_out').required(),
    amount_approved: Joi.number().min(0),
    admin_notes: Joi.string().allow('', null),
  }),
};

module.exports = {
  authSchemas,
  workerSchemas,
  categorySchemas,
  bookingSchemas,
  matchSchemas,
  jobSchemas,
  paymentSchemas,
  ratingSchemas,
  welfareSchemas,
};
