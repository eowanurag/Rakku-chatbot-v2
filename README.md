# RAKKU

Responsive Assistant for Knowledge, Kiosk & Citizen Utilities

AI-Powered Citizen Assistance Platform for Police & e-Governance Services

![Next.js]
![NestJS]
![FastAPI]
![Prisma]
![Supabase]
![Docker]
![TypeScript]
![Python]

## Executive Summary

RAKKU is an AI-powered Digital Citizen Assistance Platform designed to simplify access to police and citizen services through natural language conversations.

The platform currently supports:

- Complaint Registration
- Tenant Verification
- Character Certificates
- Event Permissions
- Application Tracking
- Police Station Discovery
- Citizen Guidance & Helpdesk Services

Designed with a modular architecture, RAKKU can operate independently or integrate with future e-Governance systems.

## Table of Contents
- [Executive Summary](#executive-summary)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Security](#security)
- [Government Integration Roadmap](#government-integration-roadmap)
- [Development Modes](#development-modes)
- [Project Status](#project-status)
- [Version History](#version-history)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Technology Stack

| Layer            | Technology            |
|------------------|-----------------------|
| Frontend         | Next.js 15            |
| Backend          | NestJS                |
| AI Service       | FastAPI               |
| Database         | PostgreSQL / Supabase |
| ORM              | Prisma                |
| Authentication   | Future Integration    |
| Containerization | Docker                |
| AI Models        | Gemini 2.5 Flash      |

## Architecture

```mermaid
graph TD
    A["Frontend (Next.js 15 App)"] -->|"/api/chat (Message + Coordinates)"| B["Backend Gateway (NestJS)"]
    B -->|"/api/chat (Proxy with Fallback)"| C["AI Service (FastAPI)"]
    B -->|Read/Write Operations| D[("Database (PostgreSQL via Prisma)")]
    C -->|"Vector RAG lookup"| E["Local Knowledge Base (JSON)"]
    C -->|"Structured Extraction & Text Gen"| F["Gemini 2.5 Flash API"]
```

**Explanation**

```
Citizen
↓
Next.js Portal
↓
NestJS Gateway
↓
FastAPI AI Engine
↓
Prisma
↓
Supabase/PostgreSQL
```

## File Structure

```text
Rakku-chatbot-v1/
├── docker-compose.yml               # Environment variables template
├── .env.example                     # Environment variables template
├── README.md                        # Project documentation
├── shared/
│   ├── message_library.json         # All conversational strings
│   └── officer_persona.md           # Persona guardrails for the AI
├── frontend/
│   ├── package.json                 # Frontend dependencies
│   ├── next.config.js               # Next.js configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── tsconfig.json                # TypeScript config
│   └── src/
│       ├── app/
│       │   ├── chat/
│       │   │   ├── page.tsx         # Chat page component
│       │   │   └── components/     # Chat UI components (ChatBubble, TypingIndicator, etc.)
│       │   ├── admin/               # Admin dashboard components
│       │   ├── track/               # Application tracking UI
│       │   └── layout/              # Shared layout components (Header, Footer)
│       ├── components/
│       │   ├── chat/
│       │   │   ├── ChatBubble.tsx
│       │   │   ├── TypingIndicator.tsx
│       │   │   └── ActionButtonGroup.tsx
│       │   ├── dashboard/
│       │   │   ├── ApplicationCard.tsx
│       │   │   └── ServiceCard.tsx
│       │   ├── layout/
│       │   │   ├── ErrorBoundary.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── Header.tsx
│       │   ├── review/
│       │   │   ├── ApplicantReviewCard.tsx
│       │   │   ├── ServiceReviewCard.tsx
│       │   │   └── ValidationStatusCard.tsx
│       │   ├── tracking/
│       │   │   └── TrackingTimeline.tsx
│       │   └── ui/
│       │       ├── EmptyState.tsx
│       │       ├── LoadingCard.tsx
│       │       ├── PageContainer.tsx
│       │       └── StatusBadge.tsx
│       └── services/
│           └── api.ts               # API client wrapper
├── backend/
│   ├── package.json                 # Backend dependencies
│   ├── tsconfig.json                # TypeScript config
│   ├── prisma/
│   │   └── schema.prisma            # Prisma data model
│   └── src/
│       ├── main.ts                  # NestJS bootstrap
│       ├── chat/
│       │   ├── chat.service.ts      # Chat fallback logic
│       │   └── chat.controller.ts   # Chat HTTP endpoints
│       ├── validation/
│       │   └── validation.service.ts # Input validation utilities
│       └── ...                      # Additional services/modules
└── ai-service/
    ├── requirements.txt             # Python dependencies
    ├── main.py                       # FastAPI entrypoint
    ├── workflow_engine.py            # Slot‑filling state machine
    ├── gemini_client.py              # Gemini API integration
    └── utils/
        └── helpers.ts                # Helper functions for AI service
```

## Features

### Citizen Services
- Complaint Registration
- Lost Mobile Complaints
- Tenant Verification
- Employee Verification
- Domestic Help Verification
- Character Certificates
- Event Permissions

### Assistance Services
- Police Station Discovery
- Emergency Helplines
- Application Tracking
- Knowledge Assistance

### AI & UI Persona Features
- **Inspector Rakku Identity**: Fully integrated official UP Police digital persona conforming to strict citizen-friendly guidelines.
- **Dynamic Avatar States**: Support for 12 conversational avatar poses (Salute, Welcome, Namaste, Idle, Thinking, Talking, Pointing, Completed, Success, Emergency, Goodbye, Error).
- **Persistent Assistant Panel**: Sticky desktop side-panel and responsive mobile header featuring large animated avatars, directional speech bubbles, and online status indicators.
- **Custom CSS Animations**: Gentle idle float, soft thinking pulse, success bounce, and pulsing emergency outline effects.
- **State Machine Sequences**: Automatically handles complex welcome experience state flows and timed auto-idle transitions.
- **Multilingual Support**: Supports English, Hindi, and Hinglish.
- **Workflow Automation & Smart Validation**: In-context slot filling and validations.

## Testing & Quality Assurance

### Master Test Framework (MTF)

Coverage Areas:
- Functional Tests
- Workflow Tests
- Database Tests
- Security Tests
- Stability Tests
- Localization Tests
- Citizen Experience Tests
- Integration Tests

**Current Target**

```
STAGING READY ≥ 90%
```

### Frontend Reliability Validation

- [ ] Verify that UI components render correctly on Desktop (1080p), Tablet (768px), and Mobile (360px).
- [ ] Ensure `useSessionPersistence` successfully retains chat history across page reloads.
- [ ] Confirm `ErrorBoundary` catches rendering errors gracefully and shows fallback UI.
- [ ] Test status badges for all states (Submitted, Under Review, Approved, Rejected, etc.) to ensure proper color coding.
- [ ] Check responsive layout on the Dashboard Quick-Actions Grid.

## Security

- Input Sanitization
- XSS Protection
- Prisma Parameterized Queries
- Session Isolation
- Audit Logging
- Reserved Command Protection

> **Disclaimer:** This prototype does not currently connect to live police databases.

## Government Integration Roadmap

### Future Integration Targets
- UP Police Citizen Portal
- UPCOP Mobile App
- CCTNS
- ICJS
- Digital Police Portal

**Status**

```
Current Stage:
Standalone Demonstration Platform
```

## Development Modes

### Local Development
```bash
npm install
npm run dev
```

### Docker Development
```bash
docker compose up --build
```

### Production Build
```bash
npm run build
```

## Project Status

**Current Phase:** DEMO READY
**Next Milestone:** STAGING READY

**Key Focus Areas:**
- Workflow Parity
- AI Behavior Testing
- Session Recovery
- Security Validation
- Performance Testing

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| v0.1 | Initial Prototype | Core Workflows |
| v0.2 | Citizen Identification | Profile Verification |
| v0.3 | Workflow Parity | FastAPI + NestJS Sync |
| v0.4 | MTF Testing Framework | QA & Stability |

## Contributing

```
Fork
Create Branch
Commit
Push
Open Pull Request
```

## License

MIT License

## Contact

Project Owner: ANURAG PANDEY
Repository: https://github.com/eowanurag/Rakku-chatbot-v1
Email: [EMAIL_ADDRESS]
