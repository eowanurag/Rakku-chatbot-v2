# RAKKU - V2.7.5 RC-1 (Scenario-Hint Driven Reasoning)

*Responsive Assistant for Knowledge, Kiosk & Citizen Utilities*  
**AI-Powered Citizen Assistance Platform with CUE, SAE, SRE & CIE Transition Foundations**

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

With **V2.7.5 RC-1**, the reasoning architecture is officially frozen. This release shifts the primary decision-making authority to the Scenario Reasoning Engine (SRE), redefines the Situation Assessment Engine (SAE) as a scenario hint engine, and establishes a robust Citizen Understanding Engine (CUE) for language normalization.

---

## 2. Dynamic Architecture

```mermaid
graph TD
    A["Frontend Client (Next.js 15)"] -->|"/api/chat (Message + Session)"| B["Backend Gateway (NestJS 10)"]
    B -->|Language normalisation| CUE["Citizen Understanding Engine (CUE)"]
    B -->|Check Flag: ENABLE_SAE| SAE["Situation Assessment Engine (SAE)"]
    SAE -->|Rule, Pattern, AI providers| Consensus["HintConsensusEngine"]
    Consensus -->|Attributed hints| SRE["Scenario Reasoning Engine (SRE)"]
    B -->|Check Flag: ENABLE_CIE| CIE["Complaint Intelligence Engine (CIE)"]
    SRE -->|Primary Decision Authority| Workflow["Workflow Layer"]
    SRE -->|Persist session & assessment| DB[("Database (PostgreSql via Prisma)")]
    CIE -->|Persist facts| DB
```

---

## 3. Core Copilot Engines

### Citizen Understanding Engine (CUE)
- **Language Normalization**: Translates dialects, Hinglish phrases, and abbreviations into canonical dictionary terms.
- **AI Review Queue**: Routes unknown terms to the `UnderstandingCandidate` governance review queue instead of executing inline writes.

### Situation Assessment Engine (SAE)
- **Hint Consensus Architecture**: Resolves overlapping outputs from `RuleClassifier`, `PatternClassifier`, and `AiClassifier` using a deterministic consensus scores algorithm (`HintConsensusEngine`).
- **Hint Attribution**: Emits scenario hints together with source classification records (e.g. `RULE_CLASSIFIER`, `PATTERN_CLASSIFIER`) for auditable traceability.
- **Legacy Intent Adaptation**: Employs the `LegacyIntentAdapter` to map older intents (e.g. `LOST_MOBILE`) to V2.7.5 scenario paths seamlessly.

### Scenario Reasoning Engine (SRE)
- **Decision Authority**: Coordinates scenario traversals (`traverseFromSeeds`), outcome determinations, risk evaluations, and clarification strategy plans.
- **Seeded Traversal & Session Recovery**: Recovers active conversation states from database `activeScenarioPath` values when incoming hints are empty.
- **Path Resolution Cache**: Enhances performance with an in-memory `resolvedPathCache` capped at 1000 items with automatic eviction.
- **Standardized Mappings**: Standardizes quality metrics into `FAST_PATH`, `HIGH_CONFIDENCE`, `CLARIFIED`, `OFFICER_REVIEW`, and `FALLBACK`.

### Complaint Intelligence Engine (CIE)
- **Fact Extraction & Gap Analysis**: Extracts incident entities, missing fields, and timeline parameters.
- **Contradiction Detection**: Identifies time, identity, or location discrepancies in citizen reports.

---

## 4. Database Schema & Data Structures

RAKKU V2.7.5 introduces structured schemas for state tracking, auditing, and configuration candidates:

### `ScenarioSession`
Tracks the status and history of the citizen reasoning session:
*   `sessionId` (String, Unique): Primary session identifier.
*   `currentScenario` (String, Nullable): Resolved scenario context.
*   `activeScenarioPath` (Json, Nullable): Saved traversal list (e.g. `["LOSS", "DOCUMENT"]`) used for session recovery.
*   `currentNode` (String, Nullable): The node SRE is currently evaluating.
*   `scenarioRevision` (Int): Counter incremented on major branch changes (refinements do not trigger increments).
*   `clarificationCount` (Int): Number of clarifying questions asked.
*   `askedQuestions` (Json, Nullable): Prevent clarification loops.

### `ScenarioAssessment`
A snapshot audit record of a scenario determination event:
*   `sessionId` (String): Session trace.
*   `scenario` (String): Target scenario mapped.
*   `scenarioPath` (Json, Nullable): Full path traversed.
*   `outcome` (String): Final workflow outcome determined.
*   `riskLevel` (String): Evaluated risk state.
*   `scenarioConfidence` (Float, Nullable): Fused confidence value.
*   `hintConfidenceBreakdown` (Json, Nullable): Breakdown of CUE, SAE, SRE confidence.
*   `resolutionSource` (String, Nullable): Traversal source (e.g., `FAST_PATH`, `GRAPH_ONLY`, `GRAPH_AND_QUESTION`).
*   `resolutionQuality` (String, Nullable): Quality tier mapping (`FAST_PATH`, `HIGH_CONFIDENCE`, `CLARIFIED`, `OFFICER_REVIEW`, `FALLBACK`).
*   `graphHash` (String, Nullable): SHA256 graph hash calculated at startup.

### `ScenarioGraphCandidate`
Governance queue for suggesting additions to SRE graphs:
*   `parentNode` (String): Target parent category in the graph.
*   `proposedNode` (String): Unregistered keyword node.
*   `occurrences` (Int): Request miss counter.
*   `status` (String): Governance review state (`PENDING`, `APPROVED`, `REJECTED`).

---

## 5. Reasoning Workflow

Rakku processes input messages through a deterministic pipeline:

```mermaid
sequenceDiagram
    participant Citizen
    participant CUE
    participant SAE
    participant SRE
    participant CIE
    participant DB

    Citizen->>CUE: Raw message input
    CUE->>SAE: Normalized dictionary terms
    Note over SAE: Rule, Pattern, AI matchers run
    SAE->>SRE: Provider hint arrays & sources
    Note over SRE: HintConsensusEngine runs deterministically
    Note over SRE: Seeded traversal & session recovery checks
    Note over SRE: Confidence fusion & Fast path evaluation
    SRE->>CIE: Standardized Outcome & Actions
    SRE->>DB: Save ScenarioSession & ScenarioAssessment logs
    SRE->>Citizen: Action plan & explainable reasoning summary
```

### Detailed Lifecycle Steps:
1. **Normalization (CUE)**: Incoming message undergoes keyword and spelling normalization against versioned dictionary files. Unknown candidate terms are queued in database governance candidates.
2. **Consensus Generation (SAE)**: Hint providers output suggested hints. `HintConsensusEngine` aggregates them, maps legacy inputs, attributes sources, and resolves overlaps.
3. **Graph Traversal (SRE)**: Seed nodes are compiled. If the incoming seed node array is empty, the SRE recovers the path from the session's database `activeScenarioPath`.
4. **Fusion & Fast-Path Routing**: Confidence fusion computes weights for CUE (15%), SAE (25%), and SRE Completeness (60%). If fused confidence >= 0.95, node is active, and no path ambiguity exists, SRE routes directly to `FAST_PATH`.
5. **Execution & Telemetry**: SRE generates explanation responses, triggers action plan workflows, logs privacy-masked telemetry, and updates session tables.

---

## 6. Telemetry Logging & Privacy Masking

The `CopilotTelemetryListener` logs all diagnostic and telemetry indicators into the `AuditLog` table. To protect citizen privacy, it recursively scrub-masks PII (Aadhaar Cards, Mobile Numbers, UPI IDs, PIN Codes, and Addresses) and emits zero raw citizen narratives in telemetry events.

---

## 7. Environment & Feature Flags

Configure the following environment toggles in your `.env`:

```env
# Database Credentials
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rakku?schema=public"

# Backend Gateway Configurations
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001/api"
AI_SERVICE_URL="http://localhost:8000"

# Copilot Feature Toggles
ENABLE_SAE=true
ENABLE_CIE=true
```

---

## 8. Folder Directory Guide

The core logic of the RAKKU V2.7.5 reasoning copilot resides under the NestJS backend application folder:

```text
backend/src/copilot/
├── cue/                              # Citizen Understanding Engine (CUE)
│   ├── analytics/                    # Replay logs and offline replay tools
│   ├── governance/                   # Approval endpoints and dictionary management
│   └── runtime/                      # Normalization providers and dictionaries
├── sae/                              # Situation Assessment Engine (SAE)
│   ├── adapters/                     # Legacy Intent Adapters
│   ├── classification/               # Rule, Pattern, and AI classifiers
│   ├── consensus/                    # HintConsensusEngine resolver
│   └── providers/                    # HintProvider registry interface
└── sre/                              # Scenario Reasoning Engine (SRE)
    ├── analytics/                    # ScenarioGraphCandidate record logging
    ├── clarification/                # Information Gain follow-up planner
    ├── explanation/                  # ExplanationEngine reasoning summary
    ├── resolver/                     # Traversal logic, SHA256 checksums, and caching
    ├── risk/                         # Situation-based risk assessment
    ├── telemetry/                    # Anonymized SRE event emitters
    └── sre.service.ts                # Primary reasoning coordinator service
```

---

## 9. Development & Run Commands

### Docker Execution (Recommended)
```bash
docker compose up -d db     # Starts local PostgreSQL instance
npx prisma db push          # Pushes schema updates to local DB
```

### Manual Execution

1. **Database Schema Sync**:
   ```bash
   cd backend
   npx prisma generate
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

## 10. Test Verification Suites

Run the full validation suite sequentially in band to prevent database transaction collisions:

```bash
npx jest --runInBand tests/copilot
```

### Key V2.7.5 Copilot Test Suites:
- **Consensus Determinism**: `npx jest tests/copilot/hint_consensus.spec.ts`
- **Session Recovery**: `npx jest tests/copilot/scenario_session_recovery.spec.ts`
- **Graph Hash governance**: `npx jest tests/copilot/graph_hash.spec.ts`
- **Fast Path Resolution**: `npx jest tests/copilot/fast_path_resolution.spec.ts`
- **Confidence Fusion**: `npx jest tests/copilot/confidence_fusion.spec.ts`
- **Path Resolution Cache**: `npx jest tests/copilot/scenario_path_resolution.spec.ts`
- **Resolution Quality**: `npx jest tests/copilot/resolution_quality.spec.ts`

---

## 11. Version History

| Version | Highlights | Status |
|---|---|---|
| **v1.0** | Production Ready Audit, PRP, Feedback Systems | Completed |
| **v2.1** | Situation Assessment Engine (SAE) with Versioning | Completed |
| **v2.2** | Complaint Intelligence Engine (CIE) with PII Scrubbing | Completed |
| **v2.6** | Scenario Reasoning Engine (SRE) v1.0, Governance Layer, Risk Engines | Completed |
| **v2.7.5** | SRE Decision Authority, CUE normalisation, SAE Hint consensus (RC-1 Architecture Freeze) | **Frozen & Verified** |
