# ADR 004: Scenario Reasoning Engine (SRE) v1.0

## Status
Accepted

## Context
As Rakku evolved, a direct pipeline from Situation Assessment Engine (SAE) to Workflow execution proved too rigid. We needed a reasoning layer to bridge intent and action, handle clarification dynamically, and manage multi-turn session states without hardcoding logic for every edge case.

## Decision
We implemented the Scenario Reasoning Engine (SRE) v1.0, consisting of:
1. **Scenario Graph & Knowledge Layer (SKL)**: Versioned JSON graphs and immutable fact stores for scenarios.
2. **Dynamic Engines**: Risk Engine, Information Gain Planner (budgeted to 3 questions), Explanation Engine, and Outcome Engine.
3. **Session State Manager**: Tracks `ScenarioSession` to prevent infinite loops and handles confidence decay across versions.
4. **Governance Validators**: A strict validation layer that runs on application startup, forcing the application to crash if configurations (graphs, playbooks, SKL) are invalid.
5. **Learning Engine Safety**: The engine can only emit `LEARNING_SUGGESTION` telemetry and is strictly barred from mutating rules at runtime.

## Consequences
- **Positive**: High explainability and auditable reasoning paths stored in `ScenarioAssessment`.
- **Positive**: Strict governance prevents architectural drift and unhandled nodes.
- **Positive**: Telemetry is properly separated from logic.
- **Negative**: Adds operational overhead as new scenarios require corresponding Graph, Knowledge, Playbook, Risk, and Outcome definitions.
