# ADR 005: Scenario-Hint Driven Reasoning Architecture (V2.7.5 RC-1)

## Status
Accepted / Frozen

## Context
In previous versions (v2.6 and earlier), the Situation Assessment Engine (SAE) acted as a final decision classifier, mapping user inputs to target workflows directly. This architecture lacked flexibility, determinism when combining multiple classifiers (Rules, Patterns, AI), and a unified decision authority. 

## Decision
We implemented a clean transition to **Scenario-Hint Driven Reasoning (V2.7.5)**:
1. **Citizen Understanding Layer (CUE)**: Handles dialect and Hinglish vocabulary normalization into dictionary terms.
2. **SAE Hint Separation**: SAE is demoted to a pure hint generator (cannot make final workflow decisions) consisting of Rule, Pattern, and AI providers.
3. **Consensus Engine (HintConsensusEngine)**: A deterministic resolver that combines multiple hint provider arrays into unified consensus hints without randomness.
4. **SRE Decision Authority**: The SRE is promoted to the primary decision authority. SRE accepts consensus hints, performs seeded traversal over the scenario graphs, checks active status, recovers state from session `activeScenarioPath`, manages cache queries, evaluates risks, and routes outcomes.
5. **Standardized Resolution Quality**: Replaces unstructured logs with a standardized quality mapping (`FAST_PATH`, `HIGH_CONFIDENCE`, `CLARIFIED`, `OFFICER_REVIEW`, `FALLBACK`).

## Consequences
- **Positive**: Complete separation of language understanding (CUE), hint generation (SAE), and authority routing (SRE).
- **Positive**: Strict determinism via consensus rules and bounded caching.
- **Positive**: Session state recovery and fast-path rules are reliable and fully test-covered.
- **Negative**: Requires maintaining adapter mappings (`LegacyIntentAdapter`) for backward compatibility with classic V1/V2 endpoints.
