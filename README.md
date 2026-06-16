# RAKKU - V2.2 (Release Candidate RC-1)

*Responsive Assistant for Knowledge, Kiosk & Citizen Utilities*  
**AI-Powered Citizen Assistance Platform with SAE & CIE Core Foundations**

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![Prisma](https://img.shields.io/badge/Prisma-6-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-compose-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)

---

## 1. Executive Summary

RAKKU is an AI-powered Digital Citizen Assistance Platform simplifying access to police and e-governance services through natural language conversations. 

With **V2.2 (RC-1)**, the platform introduces a production-grade Copilot Foundation designed to capture citizen narratives, classify intent, extract facts, resolve contradictions, and generate structured police complaints ready for integration into FIR/NCR/CCTNS pipelines.

---

## 2. Dynamic Architecture

```mermaid
graph TD
    A["Frontend Client (Next.js 15)"] -->|"/api/chat (Message + Session)"| B["Backend Gateway (NestJS 10)"]
    B -->|Check Flag: ENABLE_SAE| C["Situation Assessment Engine (SAE)"]
    B -->|Check Flag: ENABLE_CIE| D["Complaint Intelligence Engine (CIE)"]
    C -->|Persist snaps| E[("Database (PostgreSql via Prisma)")]
    D -->|Persist facts| E
    B -->|Logs telemetry| F["CopilotTelemetryListener"]
    F -->|PII Sanitization Masking| E
    B -->|Vector RAG & AI| G["AI Classifier (Gemini API)"]
```

---

## 3. Core Copilot Engines

### Situation Assessment Engine (SAE)
- **Multi-Service Recommendations**: Assesses citizen inputs and recommends multiple relevant services (e.g. Complaint Registration, App Tracking, Tenant Verification) with urgency mapping (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Assessment Versioning**: Tracks how a citizen's story evolves over time via parent-child version lineage tree indexes.
- **Multilingual Support**: Supports dynamic card rendering in English, Hindi, and Hinglish.

### Complaint Intelligence Engine (CIE)
- **Fact Extraction & Gap Analysis**: Automatically extracts parameters (brands, locations, time, suspects, evidence) and computes completeness scores.
- **Contradiction Detection**: Flags timeline, identity, or location discrepancies (e.g. conflicting scene descriptions).
- **Narrative Snapshotting**: Appends versioned history lists with concise `changeSummary` attributes for audit logging.

---

## 4. Telemetry Logging & Privacy Masking

The `CopilotTelemetryListener` logs all diagnostic and telemetry indicators into the `AuditLog` table. To protect citizen privacy, it recursively scrub-masks:
- **Aadhaar Cards**: `XXXX-XXXX-XXXX`
- **Mobile Numbers**: `XXXXXX-XXXX`
- **UPI IDs**: `XXXX@XXXX`
- **PIN Codes**: `XXXXXX`
- **Locations & Addresses**: Values in fields matching `address` or `location` are masked as `[MASKED_ADDRESS]`.

---

## 5. Environment & Feature Flags

Configure the following environment toggles in your `.env`:

```env
# Database Credentials
DATABASE_URL="postgresql://postgres.mlvtsaltkhnvjevlyzfy:bUwXj8qyz25qXugC@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

# Backend Gateway Configurations
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001/api"
AI_SERVICE_URL="http://localhost:8000"

# Copilot Feature Toggles
ENABLE_SAE=true
ENABLE_CIE=true
```

- When **disabled**, requests fallback directly back to classic V1 menu-selection and direct submission pipelines.

---

## 6. Development & Run Commands

### Docker Execution (Recommended)
```bash
docker compose up --build
```

### Manual Execution

1. **Database Schema Sync**:
   ```bash
   cd backend
   npx prisma db push
   ```
2. **Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Frontend Client**:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 7. Test Verification Suites

Run the full validation suite using the following command:

```bash
# Execute all backend, copilot, telemetry, resilience, performance, and frontend tests
npx jest
```

### Key Test Categories:
- **Telemetry Masking**: `npx jest tests/telemetry/copilot_telemetry.spec.ts`
- **E2E Chat Journey**: `npx jest tests/e2e/citizen_journey.spec.ts`
- **V1 Parity & Flags**: `npx jest tests/compatibility/v1_workflow_compatibility.spec.ts`
- **Database Load Benchmarks**: `npx jest tests/performance/database_load.spec.ts`
- **AI Resilience/Failover**: `npx jest tests/resilience/gemini_fallback.spec.ts`
- **Zustand State Stores**: `npx jest tests/frontend/`

---

## 8. Version History

| Version | Highlights | Status |
|---|---|---|
| **v1.0** | Production Ready Audit, PRP, Feedback Systems | Completed |
| **v2.1** | Situation Assessment Engine (SAE) with Versioning | Completed |
| **v2.2** | Complaint Intelligence Engine (CIE) with PII Scrubbing, Audit Indexing, Flags & RC-1 Validation | **Production Ready** |
| **v2.3** | Case Companion & Police Knowledge Integration | Upcoming |
