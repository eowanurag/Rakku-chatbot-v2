# ADR-003: Metadata-Driven Service Mapping Registry

## Status
Accepted

## Context
Hardcoded conditional switches to resolve which workflow should launch based on an AI intent or recommended service key are anti-patterns. They restrict configuration changes (such as disabling a workflow, pointing it to a new service, or changing localized labels) and require code changes for basic routing shifts.

## Decision
We store all intent-to-workflow mapping relationships in a JSON configuration file `shared/copilot/service-mappings.json`. We enforce completeness validation at backend startup: the `WorkflowRegistryValidator` loads both `intents.json` and `service-mappings.json`, asserting that every possible intent maps to a valid workflow. If any intent mapping is missing or references a non-existent workflow, the application fails to start.

## Consequences
- Configuration-first workflow routing.
- Compilation/startup safety: invalid configurations are caught immediately before entering runtime.
