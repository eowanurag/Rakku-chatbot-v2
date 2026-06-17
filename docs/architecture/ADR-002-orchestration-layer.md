# ADR-002: Orchestration Layer Introduction

## Status
Accepted

## Context
Decoupling the intelligence layer (Copilot) from the execution layer (Workflows) requires a broker/coordinator. Direct calls or inline mapping inside controllers or the chat loop lead to code replication and brittle architectures.

## Decision
We introduce an **Orchestration Layer** (`backend/src/orchestration/`) consisting of:
1. **Workflow Registry Service**: Loads dynamic configuration mappings.
2. **Recommendation Router Service**: Translates classification intents/recommended services into workflow launch signals.
3. **Workflow Launcher Service**: Decoupled event broker that emits `workflow.launch` events using `EventEmitter2`.

Workflow triggers must occur exclusively by emitting launch events via this orchestration module.

## Consequences
- Single source of truth for workflow routing.
- Event-driven system flow that allows audit tracing, logging, or metric capturing to hook into launches transparently without refactoring business logic.
