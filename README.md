# RAKKU - Version 2 (Local Development)

Responsive Assistant for Knowledge, Kiosk & Citizen Utilities
*AI-Powered Citizen Assistance Platform for Police & e-Governance Services*

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![Prisma](https://img.shields.io/badge/Prisma-6-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-compose-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Python](https://img.shields.io/badge/Python-3-blue)

---

## Executive Summary

RAKKU is an AI-powered Digital Citizen Assistance Platform designed to simplify access to police and citizen services through natural language conversations.

Starting with **Version 2**, all frontend, backend, database, and AI service components are configured for **local execution** by default to facilitate localized training, debugging, and offline capability.

---

## Architecture

```mermaid
graph TD
    A["Frontend (Next.js 15 App)"] -->|"/api/chat (Message + Coordinates)"| B["Backend Gateway (NestJS)"]
    B -->|"/api/chat (Proxy with Fallbacks)"| C["AI Service (FastAPI)"]
    B -->|Read/Write Operations| D[("Local Database (PostgreSQL via Prisma)")]
    C -->|"Vector RAG lookup"| E["Local Knowledge Base (JSON)"]
    C -->|"Structured Extraction & Text Gen"| F["Gemini API"]
```

---

## Project Setup & Services

### 1. Prerequisites
- **Node.js** (v18+)
- **Docker & Docker Desktop** (Highly recommended to orchestrate local DB & AI services)
- **Gemini API Key** (Set in `.env`)

### 2. Environment Configuration
Make sure `.env` files in root and `backend/` have:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rakku?schema=public"
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001/api"
AI_SERVICE_URL="http://localhost:8000"
```

---

## Running Rakku Locally

### Mode A: Docker Compose (Recommended)
Make sure **Docker Desktop** is open, then run:
```bash
docker compose up --build
```
This spins up:
- **Local PostgreSQL database** on port `5432`
- **FastAPI AI Service** on port `8000`
- **NestJS Backend Gateway** on port `3001`
- **Next.js Frontend Client** on port `3000`

### Mode B: Manual Execution
If running components outside of containers:

1. **Start Local PostgreSQL Database**
   Ensure your local PostgreSQL daemon is active and a database named `rakku` exists.

2. **Prisma Setup**
   ```bash
   cd backend
   npx prisma db push
   ```

3. **Start NestJS Backend**
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Start FastAPI AI Service**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   python -m uvicorn main:app --port 8000 --reload
   ```

5. **Start Next.js Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

---

## Version History

| Version | Highlights | Status |
|---------|------------|--------|
| **v1.0** | Production Ready Audit, Profile Reuse Protocol (PRP), Feedback Systems, Staging Rollout | Completed |
| **v2.0** | **Local Architecture Transition**: Restructured database (Supabase -> Local Postgres), endpoints, and client-side proxies for purely localized offline-first operations. | **In Development** |

---

## License
MIT License
