# Cooperative Gig Services Platform

The Cooperative Gig Services API connects workers, cooperatives, businesses, and customers. It supports job matching, service management, payments, and worker tracking, enabling efficient and transparent gig services.

A production-grade, full-stack Cooperative Gig Services Platform built with **React**, **Vite**, **Node.js**, **Express.js**, **PostgreSQL**, and **JWT Authentication**.

---

## 🏛 Platform Overview

The platform empowers cooperative gig economies with role-based interfaces, automated mutual safety net protection, smart worker allocation, and AI demand forecasting analytics:

- 👤 **Customer Portal**: Service browsing, booking creation, Haversine geo-distance worker matching, multi-factor smart allocation scoring, live status tracking (`pending` -> `accepted` -> `in_progress` -> `completed`), itemized invoices (10% coop fee + 5% welfare contribution), mock payment processing, and worker rating system.
- 👷 **Gig Worker Portal**: Registration & identity document submission, verification tracking, skill & hourly rate setup, real-time availability toggling, job acceptance/execution, 5% automated welfare fund earning, mutual insurance claims, and rating feedback.
- 🛡 **Cooperative Admin Portal**: Real-time metrics dashboard, worker verification audit, service catalog management, platform bookings control, mutual welfare fund treasury ledger, payout approvals, AI demand feature dataset engineering, and user directory controls.

---

## 📂 Project Structure

```
cooperative-gig-services-platform/
├── backend/
│   ├── src/
│   │   ├── app.js               # Express application configuration
│   │   ├── server.js            # Server entry point
│   │   ├── config/              # Database & env configuration
│   │   ├── db/                  # PostgreSQL schema migrations (schema.sql)
│   │   ├── controllers/         # 12 business logic controllers
│   │   ├── middleware/          # Auth, Joi validation, error handler
│   │   ├── routes/              # REST API endpoints (/api/v1)
│   │   ├── utils/               # Haversine formula & response helpers
│   │   ├── validators/          # Joi validation schemas
│   │   └── swagger/             # OpenAPI 3.0 specification (swagger.json)
│   ├── tests/                   # Jest integration tests (28/28 passing)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client & endpoint wrappers
│   │   ├── components/          # Reusable UI components (Modals, Badges, EmptyStates)
│   │   ├── context/             # JWT AuthContext
│   │   ├── pages/               # Role-based pages (Customer, Worker, Admin, Public)
│   │   ├── App.jsx              # Router & layout
│   │   └── main.jsx
│   ├── vite.config.js           # Vite dev server configuration & API proxy
│   └── package.json
├── .gitignore                   # Excludes .env, node_modules, build outputs
├── .env.example                 # Placeholder environment configuration
└── README.md
```

---

## 🚀 Setup & Installation Instructions

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your PostgreSQL database credentials in .env

npm install
npm run migrate    # Initializes DDL table schema (Database remains EMPTY)
npm start          # Starts server on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:3000
```

### 3. Running Automated Tests

```bash
cd backend
npm test           # Runs Jest integration test suite (28/28 tests)
```

---

## 🔒 Security & Privacy Compliance

- **No Hardcoded Secrets**: All passwords, database credentials, and JWT keys are loaded via environment variables (`.env`).
- **Git Ignore**: `.env` is strictly ignored and excluded from version control.
- **Empty Database**: Database schema migrations do NOT include demo/fake/seed data.

---

## 📖 API Documentation

Interactive Swagger UI documentation is available live at:
- `http://localhost:5000/api-docs`
- `http://localhost:5000/api-docs.json`
