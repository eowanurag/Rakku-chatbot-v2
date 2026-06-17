# ADR-001: Copilot and Workflow Package Separation

## Status
Accepted

## Context
In Rakku V2, the AI-driven Copilot Intelligence Layer (SAE, CIE) has grown tightly coupled with the Workflow Execution Layer (V1 legacy scripts). This coupling prevents clean development cycles, testing separation, and future scaling of specialized AI assistants.

## Decision
We enforce a strict boundary separation between:
1. **Copilot Layer** (`backend/src/copilot/`): Houses intelligence services, classifications (rules, pattern-matching, AI fallback), and is completely agnostic of workflow states, transitions, or specific schemas.
2. **Workflow Layer** (`backend/src/workflows/`): Houses step-by-step stateful citizen-facing workflows (complaint, certificate, verification, event, tracking). No direct references or imports to Copilot layer files are permitted here.

## Consequences
- 100% decoupling of intelligence from state.
- Faster, unit-testable classification logic.
- Absolute prevention of circular dependencies between classification services and workflow execution logic.
