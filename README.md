# EPA Punjab · Social Media Executive Operations Dashboard

Enterprise Social Media Operations Dashboard engineered exclusively for the **Environment Protection Agency (EPA), Government of the Punjab**. Built with **Clean Architecture**, a decoupled **Frontend & Backend**, **PostgreSQL** persistence driven by **Prisma ORM**, Role-Based Access Control (**RBAC**), interactive date range selection, and automated testing suites.

---

## 🏛 Clean Architecture Overview

This codebase adheres strictly to Domain-Driven Design (DDD) and Clean Architecture principles:
- **`backend/`**: Node.js & TypeScript service organized into:
  - `domain/`: Pure business entities (`PlatformMetric`, `ExecutiveSummary`, `User`, `AppConfig`) and repository interfaces.
  - `application/`: Application use cases (`GetMetricsUseCase`, `SyncPlatformsUseCase`, `AuthUseCase`, `ConfigUseCase`).
  - `infrastructure/`: External adapters (Prisma ORM, PostgreSQL, native PBKDF2/HMAC `AuthService`, social API fetchers, and fallback scraper).
  - `interfaces/http/`: Express presentation layer (Controllers, RBAC `authGuard` middleware, request logger, API routes).
- **`backend/prisma/`**: PostgreSQL data model, schema definitions (`schema.prisma`), and baseline database seeder (`seed.ts`).
- **`frontend/`**: Decoupled Single Page Application (SPA) with modular ES6 components, centralized reactive state store (`dashboardState.js`), and SPA hash router (`#dashboard`, `#platform/:id`, `#settings`).
- **`tests/`**: Automated test suite containing Jest unit and integration tests, plus Playwright browser end-to-end tests.
- **`docker/`**: Multi-container Docker Compose definition for PostgreSQL 16 and the backend service.

For complete architectural details, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🔐 Pre-Configured Access Roles (RBAC)

The system enforces cryptographic Role-Based Access Control:

| Role | Username | Default Password | Permissions |
|---|---|---|---|
| **Administrator (`ADMIN`)** | `admin` | `Admin@EPAPunjab2026!` | Access API Settings, manage OAuth tokens, execute manual platform synchronizations |
| **Executive Viewer (`EXECUTIVE`)** | `executive` | `Executive@EPAPunjab2026!` | View Executive Overview, filter dynamic date ranges, inspect platform master-detail pages |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (v22 recommended)
- **PostgreSQL**: v14+ (or Docker)
- **npm**

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate
```

### 3. Database Configuration (PostgreSQL)
Configure your database connection string in `.env`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/epa_social_dashboard?schema=public"
```

Push schema and seed baseline figures:
```bash
# Create database tables via Prisma
npx prisma db push

# Seed official EPA baseline data and user credentials
npm run prisma:seed
```
*(Note: If PostgreSQL is temporarily unreachable during local dev, the backend automatically activates a resilient in-memory fallback store with full functionality).*

### 4. Running the Application

#### Development Mode:
```bash
cd backend
npm run dev
```
The server will start on `http://127.0.0.1:8080`.
The frontend dashboard is served directly at `http://127.0.0.1:8080/`.

#### Production Build:
```bash
cd backend
npm run build
npm start
```

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests (Jest)
```bash
cd backend
npm test
```

### End-to-End Browser Tests (Playwright)
```bash
python tests/e2e/run_e2e.py
```

---

## 📊 6-Platform Coverage

The dashboard monitors and integrates direct operational data across the official EPA Punjab channels:

1. **Facebook**: [`facebook.com/EnvironmentProtectionAgencyPunjab`](https://www.facebook.com/EnvironmentProtectionAgencyPunjab/) — `26,409` followers
2. **Instagram**: [`instagram.com/epapunjablive`](https://www.instagram.com/epapunjablive) — `2,754` followers · `1,306` posts
3. **TikTok**: [`tiktok.com/@epapunjab`](https://www.tiktok.com/@epapunjab) — `5` published videos · `4` likes
4. **LinkedIn**: [`pk.linkedin.com/company/environment-protection-agency-punjab`](https://pk.linkedin.com/company/environment-protection-agency-punjab) — `609` followers
5. **X (Twitter)**: [`x.com/@epapunjab`](https://x.com/@epapunjab) — `5` posts · `1` follower
6. **YouTube**: *Official channel pending launch*

---

## 📜 License
Government of the Punjab — Environmental Protection Agency (EPA). Official Use Only.
