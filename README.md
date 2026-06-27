<!-- Header -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=200&section=header&text=Blood4U&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=Blood%20Donation%20Management%20System&descAlignY=58&descSize=20&descColor=d4af37" />

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1000&color=D4AF37&center=true&vCenter=true&width=700&lines=Production-Grade+Full+Stack+Platform;React+19+%7C+Node.js+%7C+MongoDB+%7C+Socket.io;Real-time+Chat+%7C+AI+Advisor+%7C+Geolocation;Saving+Lives+Through+Technology+%F0%9F%A9%B8" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-1a1a2e?style=for-the-badge&logo=react&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Node.js-v18+-1a1a2e?style=for-the-badge&logo=nodedotjs&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-1a1a2e?style=for-the-badge&logo=mongodb&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Socket.io-Realtime-1a1a2e?style=for-the-badge&logo=socketdotio&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Docker-Ready-1a1a2e?style=for-the-badge&logo=docker&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Tests-100%25%20Passing-1a1a2e?style=for-the-badge&logo=jest&logoColor=D4AF37" />
</p>

---

## ✦ Overview

**Blood4U** is a production-grade, full-stack platform for coordinating life-saving blood donations — connecting donors, hospitals, and blood banks in real time. Built with enterprise-level security, AI assistance, WebSocket communication, and containerized deployment.

---

## ✦ Core Features

<table>
<tr>
<td width="50%" valign="top">

**🤖 Gemini AI Advisor**
Integrated Google Gemini 1.5 Flash with full awareness of all registered donors and automatic blood compatibility rules. Ask questions like *"Is there any O- donor in Rawalpindi?"* or *"Who can B+ donate to?"*

**⚡ Optimized Real-time WebSockets**
Restructured global socket listener bindings in `Chat.jsx` to prevent memory leaks and double-rendering loops — background notification sync stays active across all tab navigations.

**🧪 Flawless Test Suite**
100% green test passing rate with mock Winston stream logs and conditional port allocation to prevent local test environment collisions.

</td>
<td width="50%" valign="top">

**🩸 Smart Donor Matching**
Urgency-based blood request broadcasting with auto-matched donors by blood type and geolocation — 2dsphere indexed for fast proximity queries.

**💬 Real-time Chat**
WhatsApp-style verified-only donor chat powered by Socket.io with Redis adapter for horizontal scaling across multiple server instances.

**🏥 Blood Bank Integration**
Admin-approved blood bank registration with inventory tracking, campaign management, and social media outreach integration.

</td>
</tr>
</table>

---

## ✦ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React 19)                       │
│   Redux Store ──► API Layer (lib/api.js) ──► Backend        │
│   (Normalized State, CSRF + Automatic Retry Logic)           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / WebSocket (Socket.io)
┌──────────────────────▼──────────────────────────────────────┐
│                  BACKEND (Express API v1)                    │
│                                                             │
│  Routes (v1) ──► Validation (express-validator) ──► Services │
│                                                             │
│  Middleware Stack:                                           │
│  helmet → cors → mongoSanitize → xss-clean →                │
│  rateLimit → Sentry → cookieParser → [routes]               │
│                                                             │
│  Observability: Sentry (Error Tracking + Performance)        │
│  Scalability:   Redis (Socket.io horizontal scaling)        │
│  Logging:       Winston (Structured JSON logs)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ Mongoose / Redis Adapter
┌──────────────────────▼──────────────────────────────────────┐
│              DATABASE (MongoDB Atlas)                       │
│  Indexes: Compound (city, group, status), TTL (OTP),        │
│           2dsphere (Location), User (Unique identity)       │
└─────────────────────────────────────────────────────────────┘
```

---

## ✦ System Flow

```
User Signup → OTP Email → Verify → JWT Cookie Set
     │
     ├── Become Donor ──────────────────────────────────────────►
     │   (GPS captured, role → donor, 2dsphere indexed)          │
     │                                                           │
     ├── Register Blood Bank ─────────────────────────► Admin Approval
     │   (pending → approved, GPS captured)                      │
     │                                                           │
     └── Create Blood Request ──► Auto-match Donors ──► Notify
         (role-based visibility, duplicate prevention)
              │
              ├── Donor: Chat (WhatsApp-style, verified only)
              ├── Donor: Confirm Donation (90-day cooldown enforced)
              └── Admin: Approve/Reject → Socket broadcast
```

---

## ✦ Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm
- *(Optional)* Redis for socket scaling, Docker for containerized runs

### 1. Clone & Install
```bash
# Backend
cd Backend && npm install

# Frontend
cd ../Auth && npm install
```

### 2. Configure Environment

**`Backend/.env`**
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/blood4u
JWT_SECRET=your_strong_secret_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Industry-Level Config
REDIS_URL=redis://localhost:6379       # For horizontal socket scaling
SENTRY_DSN=your_sentry_dsn_here       # For error tracking
```

> **Note:** Admin accounts are managed directly in the database for security. The first admin should be registered manually or via the seeding script.

**`Auth/.env`**
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Run Locally
```bash
# Terminal 1 — Backend (port 3000)
cd Backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd Auth && npm run dev
```

### 4. Seed Test Data *(development only)*
```bash
cd Backend && node seed-data.js
```

---

## ✦ Docker Deployment

Launch the full stack — MongoDB + Backend + Frontend/Nginx — with a single command:

```bash
# Create .env at project root with required variables, then:
docker-compose up --build
```

| Service   | URL |
|-----------|-----|
| Frontend  | http://localhost:5173 |
| Backend   | http://localhost:3000 |
| API Docs  | http://localhost:3000/api/docs |
| Health    | http://localhost:3000/api/health |

---

## ✦ Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Authentication | JWT in `httpOnly`, `SameSite=Strict` cookie |
| CSRF Protection | Double-submit cookie pattern (`/api/csrf-token`) |
| Rate Limiting | Global: 1000 req/15min · Auth routes: stricter limits |
| Input Validation | `express-validator` strong validation layer |
| Password Policy | Uppercase + Lowercase + Number + Special char enforced |
| Input Sanitization | `express-mongo-sanitize` (NoSQL injection) + `xss-clean` |
| OTP Security | bcrypt-hashed, 50-second TTL, max 3 attempts |
| Password Hashing | bcrypt (cost factor 10) |
| Security Headers | `helmet` (XSS, HSTS, CSP, etc.) |
| WebSocket Auth | JWT-authenticated via httpOnly cookie at handshake |
| Real-time Scaling | Redis Adapter for distributed socket management |

---

## ✦ API Documentation

Interactive Swagger UI available at:
```
http://localhost:3000/api/docs
```

| Group | Base Path |
|-------|-----------|
| Auth | `/api/auth` |
| Donors | `/api/donors` |
| Requests | `/api/requests` |
| Blood Banks | `/api/banks` |
| Events | `/api/events` |
| Chat | `/api/chat` |
| Users | `/api/users` |

---

## ✦ Testing

```bash
cd Backend

# Run all tests
npm test

# Run with coverage report (≥60% enforced)
npm run test:coverage

# Targeted suites
npm run test:unit          # Unit tests (services, utils)
npm run test:integration   # Integration tests (API routes)
```

| Suite | Coverage |
|-------|----------|
| `utils/hash.js` | 100% |
| `services/donorService.js` | ~80% |
| `routes/auth` (integration) | ~75% |

---

## ✦ Domain Rules

| Rule | Implementation |
|------|---------------|
| 90-day donor cooldown | Enforced server-side in `DonorService` + pre-save hook |
| One active request per user | Checked on create in `RequestService` |
| Admin requests private | Filtered in `getRequests()` by admin user IDs |
| OTP brute-force lock | Max 3 attempts; token deleted after lock |
| Blood bank one-per-user | Checked in `BloodBankService` before registration |
| Events only when approved | Non-admins see only `approved` + upcoming events |

---

## ✦ Project Structure

```
Authentication/
├── Auth/                       # React Frontend
│   ├── src/
│   │   ├── features/           # Redux slices (auth, data, theme)
│   │   ├── lib/api.js          # HTTP client (CSRF + retry)
│   │   ├── pages/dashboard/    # All dashboard pages
│   │   └── components/         # Reusable UI components
│   ├── Dockerfile              # Multi-stage build (Nginx)
│   └── nginx.conf              # SPA routing + API proxy
│
├── Backend/                    # Node.js API
│   ├── controllers/            # HTTP request/response only
│   ├── services/               # Business logic
│   ├── repositories/           # Database queries (Mongoose)
│   ├── models/                 # Mongoose schemas + indexes
│   ├── middleware/             # Auth, rate limit, error handler
│   ├── routes/                 # Express routers
│   ├── utils/                  # logger, mailer, hash, bloodCompatibility
│   ├── tests/                  # Jest unit + Supertest integration
│   ├── swagger.yaml            # OpenAPI 3.0 spec
│   ├── Dockerfile              # Production image
│   └── server.js               # Entry point
│
├── docker-compose.yml          # Full-stack orchestration
└── README.md
```

---

## ✦ Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/React_19-1a1a2e?style=for-the-badge&logo=react&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Redux-1a1a2e?style=for-the-badge&logo=redux&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Node.js-1a1a2e?style=for-the-badge&logo=nodedotjs&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Express.js-1a1a2e?style=for-the-badge&logo=express&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/MongoDB-1a1a2e?style=for-the-badge&logo=mongodb&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Socket.io-1a1a2e?style=for-the-badge&logo=socketdotio&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Redis-1a1a2e?style=for-the-badge&logo=redis&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Google_Gemini-1a1a2e?style=for-the-badge&logo=google&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Docker-1a1a2e?style=for-the-badge&logo=docker&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Jest-1a1a2e?style=for-the-badge&logo=jest&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Sentry-1a1a2e?style=for-the-badge&logo=sentry&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Swagger-1a1a2e?style=for-the-badge&logo=swagger&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/TailwindCSS-1a1a2e?style=for-the-badge&logo=tailwind-css&logoColor=D4AF37" />
  <img src="https://img.shields.io/badge/Nginx-1a1a2e?style=for-the-badge&logo=nginx&logoColor=D4AF37" />
</p>

---

<p align="center">Developed with ❤️ for the community — <strong>Abdul Saboor</strong></p>
<p align="center">
  <a href="https://linkedin.com/in/saboor-rana49">
    <img src="https://img.shields.io/badge/LinkedIn-1a1a2e?style=for-the-badge&logo=linkedin&logoColor=D4AF37" />
  </a>&nbsp;
  <a href="mailto:saboor.rana49@gmail.com">
    <img src="https://img.shields.io/badge/Gmail-1a1a2e?style=for-the-badge&logo=gmail&logoColor=D4AF37" />
  </a>&nbsp;
  <a href="https://github.com/rana-saboorr">
    <img src="https://img.shields.io/badge/GitHub-1a1a2e?style=for-the-badge&logo=github&logoColor=D4AF37" />
  </a>
</p>

<!-- Footer -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:24243e,50:302b63,100:0f0c29&height=130&section=footer" />