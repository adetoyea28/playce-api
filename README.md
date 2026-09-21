# Playce API 🏟️

> A web-based booking system made specifically for event venues within the University of Ibadan campus (e.g. SUB pitch).

---

## 📖 Overview

Manual venue scheduling often results in clashing events due to the understaffed managerial body having to cross-check paper logs. **Playce** solves this by moving the entire booking lifecycle to a digital platform. Event planners can inspect venue availability on a given date, request a time slot verified by the **Core Time Clash Prevention Algorithm**, and submit it to venue managers for review and approval.

---

## 🏛️ Architecture & Tech Stack

Playce is built around the **MSCV (Model, Service, Controller, View/Route)** architecture.

- **Runtime**: Node.js (ES Modules `import`/`export`)
- **Web Framework**: Express.js
- **Database & ORM**: PostgreSQL with Sequelize
- **Caching & OTP Storage**: Redis (with automatic fallback to in-memory TTL store for local development)
- **Email Notifications**: Resend SDK (with simulated logger fallback for development)
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs` for password/OTP hashing
- **Session Delivery**: `httpOnly` secure cookies (`cookie-parser`)
- **Validation**: `express-validator`
- **Rate Limiting**: `express-rate-limit`
- **API Documentation**: OpenAPI 3.0 via Swagger (`swagger-ui-express` + `yamljs`), protected with `express-basic-auth`

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and adjust the variables:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `5000` |
| `NODE_ENV` | Environment (`development` or `production`) | `development` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_NAME` | PostgreSQL database name | `playce_db` |
| `DATABASE_URL` | Alternative PostgreSQL connection URI | Optional |
| `REDIS_URL` | Redis server connection URI | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | Secret key for 30-min access tokens | (preset) |
| `JWT_REFRESH_SECRET` | Secret key for 4-hr refresh tokens | (preset) |
| `JWT_RESET_SECRET` | Secret key for 15-min password reset tokens | (preset) |
| `RESEND_API_KEY` | Resend API key for outbound emails | Optional |
| `SWAGGER_USER` | Basic auth username for Swagger documentation | `admin` |
| `SWAGGER_PASSWORD` | Basic auth password for Swagger documentation | `playce_docs_pass` |

### 3. Run the Server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

---

## 📚 API Documentation (Swagger)

Interactive Swagger UI is served at:
```
http://localhost:5000/api-docs
```

It is protected with HTTP Basic Auth:
- **Username**: `admin` (or defined in `SWAGGER_USER`)
- **Password**: `playce_docs_pass` (or defined in `SWAGGER_PASSWORD`)

---

## ⚙️ Core Time Clash Prevention Algorithm

When booking an event:
1. **Operating Day Validation**: Checks that the requested date's day-of-week is not in the venue's `days_closed` list.
2. **Operating Hours Validation**: Verifies that `start_time >= time_open` and `end_time <= time_closed`.
3. **Atomic Clash Prevention**: Queries all existing bookings for that venue and date with status `pending` or `approved`. Two intervals $[S_1, E_1)$ and $[S_2, E_2)$ clash if and only if:
   $$S_1 < E_2 \quad \text{and} \quad E_1 > S_2$$
   If any collision is found, the API rejects the request with HTTP `409 Conflict` and reports the colliding booking details.

---

## 🧪 Testing

Run the automated test suites:
```bash
# Unit & Algorithm Tests
node src/tests/test_suite.js

# HTTP & Swagger Endpoints Integration Tests
node src/tests/api_http_test.js
```