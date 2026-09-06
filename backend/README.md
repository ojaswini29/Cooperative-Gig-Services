# Cooperative Gig Services Platform - Backend API

A complete, production-grade RESTful API built with **Node.js**, **Express.js**, **PostgreSQL**, and **JWT Authentication** for a Cooperative Gig Services Platform.

> **CRITICAL COMPLIANCE NOTICE**: As strictly required, the database contains **NO seed, demo, or sample data**. All 10 database tables are initialized, migrated, and completely **EMPTY**, ready for your custom data.

---

## 🌟 Key Features

1. **Role-Based Authentication**: Support for 3 distinct user roles:
   - `customer`
   - `gig_worker`
   - `cooperative_admin`
   - Secure password hashing with `bcryptjs` and token verification with `jsonwebtoken`.

2. **Worker Registration & Admin Verification**:
   - Extended worker profile with geolocation coordinates, vehicle type, insurance details, and identity documents.
   - Admin verification workflow (`pending`, `verified`, `rejected`) with verification notes.

3. **Service Categories & Skills Management**:
   - Hierarchical category and skill management created/managed by Cooperative Admins.
   - Customized worker skill attachments with individual hourly rates and experience years.

4. **Customer Service Booking**:
   - Location-aware booking requests specifying category, skill, scheduled time, service address, and estimated hours.
   - Automatic price estimation based on worker/skill hourly rates.

5. **Geo-Location Worker Matching**:
   - Haversine great-circle distance algorithm to match nearby available & verified workers within custom radius (km).

6. **Smart Worker Allocation Engine**:
   - Multi-factor algorithmic scoring model evaluating:
     - Proximity / Distance (35% weight)
     - Average Rating (30% weight)
     - Experience & Completed Jobs Count (20% weight)
     - Active Welfare & Insurance Status (15% weight)
   - One-click auto-assignment of the highest-scoring candidate worker.

7. **Job Lifecycle Management**:
   - State machine tracking job transition: `pending` -> `accepted` -> `in_progress` -> `completed` / `cancelled`.

8. **Automated Invoicing & Mock Payment**:
   - Auto-generated detailed invoices upon job completion.
   - Automatic separation of Subtotal, Cooperative Platform Fee (10%), and Cooperative Welfare Fund Contribution (5%).
   - Mock payment gateway endpoint supporting `coop_wallet`, `upi`, `credit_card`, and `bank_transfer`.

9. **Ratings & Feedback System**:
   - Customer-to-worker and worker-to-customer 5-star ratings and reviews.
   - Auto-recalculating rolling worker average ratings and review counts.

10. **Cooperative Welfare & Mutual Insurance Fund**:
    - Automatic allocation of 5% job completion fees into a central welfare fund ledger.
    - Worker insurance policy status tracking and health/injury/equipment benefit claim submission.
    - Admin claim approval, rejection, and payout ledger logging.
    - Cooperative welfare fund balance, contributions, and payout metrics summary.

11. **AI-Ready Demand Forecasting**:
    - Feature vector aggregation by location grid (lat/lon), service category, day of week, and hour slot for ML model training (XGBoost/TensorFlow/PyTorch).
    - Time-series predictive demand projections and surge zone density calculations.

12. **Admin Dashboard APIs**:
    - Consolidated metrics: user role distribution, worker verification queue, booking counts & gross values, financial earnings, and system audit log.

13. **Interactive Swagger / OpenAPI 3.0 Documentation**:
    - Full OpenAPI 3.0 interactive specification served live at `/api-docs`.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: PostgreSQL 17 (pg connection pool)
- **Authentication**: JWT (JSON Web Tokens) & Bcryptjs
- **Validation**: Joi Schema Validation
- **Security**: Helmet & CORS
- **Documentation**: Swagger UI Express & OpenAPI 3.0
- **Testing**: Jest & Supertest (28/28 integration tests passing)

---

## 🚀 Getting Started

### 1. Environment Configuration

The application uses environment variables configured in `.env`:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=coop_user
DB_PASSWORD=coop_password
DB_NAME=cooperative_gig_db
JWT_SECRET=super_secret_cooperative_gig_jwt_key_2026
JWT_EXPIRES_IN=7d
COOP_FEE_PERCENTAGE=10
WELFARE_FUND_PERCENTAGE=5
```

### 2. Database Migration

Run migrations to initialize table schema (Database remains **EMPTY**):

```bash
npm run migrate
```

### 3. Run the Server

Start in production mode:
```bash
npm start
```

Start in development mode with hot reloading:
```bash
npm run dev
```

### 4. Run Automated Tests

Execute full integration test suite:
```bash
npm test
```

---

## 📚 API Endpoints Summary

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register customer, worker, or admin | None |
| `POST` | `/api/v1/auth/login` | Login & receive JWT token | None |
| `GET` | `/api/v1/auth/me` | Get current logged-in user profile | JWT |
| `PUT` | `/api/v1/auth/profile` | Update profile info | JWT |

### 👷 Worker Management (`/api/v1/workers`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/workers/me` | Fetch worker profile & skills | `gig_worker` |
| `PUT` | `/api/v1/workers/profile` | Update worker bio, vehicle, insurance info | `gig_worker` |
| `PUT` | `/api/v1/workers/location` | Update worker location (lat/lon) & availability | `gig_worker` |
| `POST` | `/api/v1/workers/skills` | Attach skill & custom hourly rate | `gig_worker` |
| `DELETE` | `/api/v1/workers/skills/:skillId` | Remove skill from profile | `gig_worker` |
| `GET` | `/api/v1/workers/pending` | List pending worker verifications | `cooperative_admin` |
| `PATCH` | `/api/v1/workers/:id/verify` | Approve or reject worker application | `cooperative_admin` |

### 📂 Categories & Skills (`/api/v1`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/categories` | List service categories | None |
| `POST` | `/api/v1/categories` | Create service category | `cooperative_admin` |
| `GET` | `/api/v1/skills` | List skills | None |
| `POST` | `/api/v1/skills` | Create skill with base rate | `cooperative_admin` |

### 📅 Bookings & Matching (`/api/v1`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/bookings` | Create service booking request | `customer` |
| `GET` | `/api/v1/bookings` | List user bookings | JWT |
| `GET` | `/api/v1/match/workers` | Match nearby verified workers by lat/lon | JWT |
| `GET` | `/api/v1/allocation/score/:bookingId` | Calculate Smart Allocation scores | JWT |
| `POST` | `/api/v1/allocation/auto-assign/:bookingId` | Auto-assign top scored worker | Customer/Admin |

### 🔧 Job Execution & Payments (`/api/v1`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/jobs/:bookingId/accept` | Accept booking | `gig_worker` |
| `POST` | `/api/v1/jobs/:bookingId/start` | Start job execution | `gig_worker` |
| `POST` | `/api/v1/jobs/:bookingId/complete` | Complete job & trigger invoice | `gig_worker` |
| `POST` | `/api/v1/payments/process` | Process mock payment for invoice | Customer/Admin |

### ⭐ Ratings & Welfare (`/api/v1`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/ratings` | Rate completed booking | Customer/Worker |
| `GET` | `/api/v1/welfare/worker/status` | View insurance & welfare earnings | `gig_worker` |
| `POST` | `/api/v1/welfare/claims` | Submit welfare claim | `gig_worker` |
| `PATCH` | `/api/v1/welfare/claims/:id/status` | Process claim status & payout | `cooperative_admin` |
| `GET` | `/api/v1/welfare/summary` | Welfare fund metrics & ledger | `cooperative_admin` |

### 📊 AI Forecasting & Admin (`/api/v1`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/forecasting/demand-features` | ML dataset feature vectors | JWT |
| `GET` | `/api/v1/forecasting/predict` | Time-series demand density projection | JWT |
| `GET` | `/api/v1/admin/dashboard` | Platform metrics & financials | `cooperative_admin` |

---

## 📖 Swagger / OpenAPI Documentation

Interactive documentation is live at:
- **UI**: `http://localhost:5000/api-docs`
- **JSON Spec**: `http://localhost:5000/api-docs.json`
