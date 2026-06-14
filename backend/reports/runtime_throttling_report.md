# Runtime Rate Limiting Validation Report

## Executive Summary
* **Status**: **PASS**
* **Verification Method**: Automated E2E integration test (`tests/e2e/runtime_throttling.spec.ts`)
* **Core Protection**: Tiered request throttling based on endpoint risk

---

## Configuration & Architecture

To protect the Rakku backend APIs against abuse, brute forcing, and spamming, we implemented NestJS `@nestjs/throttler` in the global application context:

1. **Global Default Limits**:
   * **Window (TTL)**: 60 seconds (60,000 ms)
   * **Limit**: 60 requests per window

2. **High-Risk API Endpoints**:
   A stricter limit of **15 requests per 60 seconds** is enforced for high-risk transactional and LLM-backed endpoints using the custom `@Throttle` decorator:
   * `POST /api/chat` (AI conversation)
   * `POST /api/event` (Event permission filing)
   * `POST /api/intelligence/feedback` (Citizen feedback intelligence)
   * `POST /api/citizen-assistance/jurisdiction/lifecycle` (Jurisdiction updates and validation)

3. **Read-Only & Public APIs**:
   * Fall back to the default rate limit (60 requests/min) to prevent throttling of regular directory searches and page discovery.

---

## Proxy & Render Header Resolution

When running in production on Render, the application is deployed behind a reverse proxy. To prevent the rate limiter from throttling the proxy's IP (which would block all citizens globally), the client IP is extracted correctly by:

1. Enabling `trust proxy` in the Express app:
   ```typescript
   app.getHttpAdapter().getInstance().set('trust proxy', true);
   ```
2. Relying on the `x-forwarded-for` header to identify the original citizen's client IP.

---

## Automated Test Results

The throttling behavior was verified under actual simulated runtime load in `tests/e2e/runtime_throttling.spec.ts`:

* **Single Client IP Rate Limiting (IP `203.0.113.195`)**:
  * Requests 1 through 15 are successfully routed and processed (`201 Created`).
  * Request 16 immediately returns a `429 Too Many Requests` error.
* **Multi-Client Isolation (IP `198.51.100.42`)**:
  * Requests sent from a different client IP address do not consume the limit of the first IP, confirming strict IP-level tracking.
* **Window Reset**:
  * Submissions after the TTL window expires are accepted normally.
