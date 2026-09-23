# EPA Punjab · Social Media Operations Dashboard

An internal enterprise dashboard for monitoring and managing the official social media presence of the **Environment Protection Agency (EPA), Government of the Punjab**.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js · TypeScript · Express |
| Database | PostgreSQL · Prisma ORM |
| Frontend | Vanilla ES6 SPA |
| Auth | RBAC · PBKDF2/HMAC |
| Testing | Jest · Playwright |
| Infrastructure | Docker · Docker Compose |

---

## 🏗 Project Structure

```
├── backend/       # Node.js API service (Clean Architecture)
├── frontend/      # Decoupled Single Page Application
├── tests/         # Unit, integration & E2E test suites
├── docker/        # Docker Compose configuration
└── docs/          # Architecture & technical documentation
```

For full architectural details, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (v22 recommended)
- **PostgreSQL** v14+ (or Docker)
- **npm**

### 1. Install Dependencies

```bash
cd backend
npm install
npx prisma generate
```

### 2. Environment Configuration

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

> **Never commit `.env` to version control.**

### 3. Database Setup

```bash
npx prisma db push
npm run prisma:seed
```

> If PostgreSQL is unreachable during local development, the backend automatically falls back to an in-memory store with full functionality.

### 4. Run

**Development (with live reload):**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

The application will be available at `http://127.0.0.1:8080`.

---

## 🧪 Tests

**Unit & Integration (Jest):**
```bash
cd backend && npm test
```

**End-to-End (Playwright):**
```bash
npm run test:e2e
```

---

## 🔐 Access & Roles

The system enforces Role-Based Access Control (RBAC) with two roles:

| Role | Capabilities |
|---|---|
| **Administrator** | API settings, OAuth token management, manual platform sync |
| **Executive Viewer** | Dashboard overview, date range filtering, platform detail pages |

> Default credentials are configured during the seed step. Change them immediately after first login.

---

## 📊 Platform Coverage

The dashboard tracks EPA Punjab's official presence across **6 social media platforms**:

- Facebook
- Instagram
- TikTok
- LinkedIn
- X (Twitter)
- YouTube

---

## 📜 License

Government of the Punjab — Environment Protection Agency (EPA).  
**Official Internal Use Only. All rights reserved.**
