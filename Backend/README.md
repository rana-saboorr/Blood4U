# Blood4U Backend Infrastructure

This is the production-grade Node.js / Express / MongoDB backend for the **Blood4U** platform, a life-critical blood donation coordination system. 

The architecture has been comprehensively hardened following enterprise security standards, zero-trust principles, and robust reliability patterns.

## 🚀 Key Features & Architecture

### 1. Advanced Security
*   **Dual-Token Authentication:** Short-lived JWT Access Tokens (15m) and long-lived Refresh Tokens (7d), transmitted securely via `httpOnly`, `SameSite=Strict` cookies.
*   **Token Fingerprinting:** Tokens are cryptographically bound to the user's IP address and User-Agent. Mid-session hijacking attempts instantly invalidate all of the user's sessions.
*   **Zero-Trust Input Validation:** Strict request sanitization using `express-validator`, `xss-clean`, `express-mongo-sanitize` (NoSQL injection prevention), and `hpp` (Parameter Pollution).
*   **Brute-Force Protection:** Redis-backed login rate-limiting auto-locks accounts after 5 failed attempts, firing email alerts.
*   **Strict CORS & CSP:** Granular Helmet configurations enforcing secure Content Security Policies and strict Origin boundaries.

### 2. Reliability & Resilience
*   **Circuit Breakers:** External services (like NodeMailer) are wrapped in Circuit Breakers to fail fast and prevent cascading system timeouts during third-party outages.
*   **Redis Caching & Fallbacks:** High-traffic endpoints utilize Redis for caching. If Redis goes down, the application gracefully degrades to hitting the database instead of crashing.
*   **Graceful Shutdowns:** Intercepts `SIGTERM`/`SIGINT` to cleanly close HTTP, Socket.io, MongoDB, and Redis connections before exiting, preventing orphaned requests.

### 3. Real-Time Socket Engine
*   **Namespace Isolation:** Users are forced into dedicated `user:{id}` and `role:{role}` rooms upon connection. 
*   **Strict Authentication:** Handshakes require valid JWTs. Expired or forged tokens are instantly rejected.
*   **Rate-Limiting:** Token-bucket rate-limiter applied per-socket connection to prevent event flooding or DoS.

### 4. Observability & Auditing
*   **Winston Structured Logging:** Outputs human-readable colorized logs in development, and Datadog-ready JSON in production.
*   **Correlation IDs:** A unique `X-Correlation-ID` is generated and tracked across all HTTP and Log boundaries for trace debugging.
*   **Append-Only Audit Trail:** All administrative actions (approving blood banks, modifying roles, suspending users) are logged permanently to an AuditLog collection for compliance.

## 🛠 Prerequisites

*   Node.js (v18 LTS recommended)
*   MongoDB (v6+)
*   Redis Server (v7+)
*   SMTP Server details (for sending OTPs)

## 📦 Setup & Installation

1. **Install Dependencies:**
   ```bash
   cd Backend
   npm install
   ```

2. **Environment Variables:**
   Copy the example file and fill in your secrets.
   ```bash
   cp .env.example .env
   ```
   **Critical Keys required for startup:**
   * `MONGO_URI`: MongoDB connection string.
   * `REDIS_URL`: Redis connection string.
   * `JWT_SECRET`: Must be exactly 32 bytes.
   * `REFRESH_TOKEN_SECRET`: Must be exactly 32 bytes.
   * `FIELD_ENCRYPTION_KEY`: Must be exactly 32 bytes.

3. **Run the Server:**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   NODE_ENV=production npm start
   ```

## 📚 API Architecture

The API strictly adheres to a **Controller-Service-Repository** pattern to decouple HTTP transport from business logic and database operations.

*   **`/routes`**: Express routing, HTTP verb mapping, and strict validation chains using `express-validator`.
*   **`/controllers`**: Pure HTTP layer. Extracts request data, delegates to Services, and formats JSON responses.
*   **`/services`**: Core business logic, computations, and orchestration.
*   **`/repositories`**: Isolated database queries, abstracts Mongoose entirely.
*   **`/validators`**: Shared, DRY express-validator chains (`validators/shared.js`).

## 🩺 System Health Monitoring

The application provides a comprehensive `/api/health` endpoint that checks component vitality:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptimeSeconds": 1342,
  "timestamp": "2024-05-18T10:15:30Z",
  "checks": {
    "mongodb": { "status": "healthy", "latencyMs": 14 },
    "redis": { "status": "healthy", "latencyMs": 2 },
    "memory": { "heapUsedMB": 84, "heapTotalMB": 128, "rssMB": 180 }
  }
}
```

## 🔒 Security Best Practices

*   **Never commit `.env` files.**
*   **Never query the `SystemConfig` model directly**; always use the cached `getConfig()` helper from `config/systemConfig.js`.
*   **Never use `io.emit()` directly**; always use the helpers in `utils/socketEmit.js` to ensure data isolation.
*   All controllers returning User data must pass it through the `sanitizeUser()` utility in `utils/sanitize.js`.
