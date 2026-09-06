-- Cooperative Gig Services Platform Schema
-- Empty database structure (no seed/demo data)

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'gig_worker', 'cooperative_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS worker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    vehicle_type VARCHAR(100),
    insurance_status VARCHAR(50) DEFAULT 'active' CHECK (insurance_status IN ('active', 'inactive', 'suspended')),
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    identity_document_url TEXT,
    is_available BOOLEAN DEFAULT true,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_ratings INT DEFAULT 0,
    completed_jobs_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_category_skill_name UNIQUE (category_id, name)
);

CREATE TABLE IF NOT EXISTS worker_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    experience_years INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_worker_skill UNIQUE (worker_id, skill_id)
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES worker_profiles(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    skill_id UUID NOT NULL REFERENCES skills(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    service_address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_hours DECIMAL(4, 2) DEFAULT 1.00,
    actual_hours DECIMAL(4, 2),
    hourly_rate DECIMAL(10, 2) NOT NULL,
    estimated_amount DECIMAL(10, 2) NOT NULL,
    final_amount DECIMAL(10, 2),
    notes TEXT,
    accepted_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id),
    worker_id UUID REFERENCES worker_profiles(id),
    amount_subtotal DECIMAL(10, 2) NOT NULL,
    coop_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    welfare_contribution_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    amount_total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    reviewer_role VARCHAR(50) NOT NULL CHECK (reviewer_role IN ('customer', 'gig_worker')),
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_booking_reviewer UNIQUE (booking_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS welfare_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    claim_type VARCHAR(100) NOT NULL CHECK (claim_type IN ('health', 'injury', 'equipment', 'education', 'emergency')),
    description TEXT NOT NULL,
    amount_requested DECIMAL(10, 2) NOT NULL,
    amount_approved DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid_out')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS welfare_fund_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit_from_job', 'payout_claim', 'grant', 'adjustment')),
    amount DECIMAL(10, 2) NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    claim_id UUID REFERENCES welfare_claims(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_verification ON worker_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_location ON worker_profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_skills_category_id ON skills(category_id);
CREATE INDEX IF NOT EXISTS idx_worker_skills_worker_id ON worker_skills(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_skills_skill_id ON worker_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker_id ON bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_location ON bookings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_welfare_claims_worker_id ON welfare_claims(worker_id);
