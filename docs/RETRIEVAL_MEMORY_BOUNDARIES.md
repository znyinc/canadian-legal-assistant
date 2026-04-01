# Retrieval and Memory Boundaries (P2)

## Goal
Separate short-lived conversational state from long-lived retrieval and evaluation artifacts so the chat flow stays lightweight, auditable, and privacy-safe.

## Boundary Model
1. Short-term session state:
- Purpose: drive active conversation and import readiness.
- Location: conversational session store (current and recent turns).
- Retention: default 30 days unless legal hold applies.
- Allowed content: user prompts, assistant responses, confidence metadata, review/import state.

2. Long-term retrieval artifacts:
- Purpose: reusable non-PII knowledge and evaluation traces.
- Location: retrieval/eval artifact store (separate from session turns).
- Retention: default 180 days for evaluation artifacts, configurable by environment.
- Allowed content: normalized facts, redacted snippets, schema-valid eval outputs, routing metrics.

## Redaction Requirements
1. Before persisting retrieval artifacts:
- Remove direct identifiers (names, phone numbers, email, addresses, IDs, account numbers).
- Hash case identifiers when cross-linking to internal records.
- Strip raw uploads and full free-form narratives from long-term artifacts.

2. Session exports:
- Include only the selected matter/session scope.
- Exclude unrelated sessions and model telemetry internals.
- Preserve disclaimer/review metadata in exported audit-friendly form.

## Export Behavior
1. Session export:
- Includes turn history, review state transitions, and import decisions.
- Includes timestamps and source labels (fallback/llm) for explainability.

2. Retrieval artifact export:
- Includes only redacted and schema-valid artifact rows.
- Never includes raw attachment binaries or unredacted user text.

## Integration Path (Later)
1. Retrieval integration should consume redacted artifact summaries, not full session payloads.
2. Session storage should remain optimized for conversation replay and import workflows.
3. Any cross-link between session and retrieval layers must use stable internal IDs plus access checks.

## Operational Guardrails
1. Keep session payloads small to avoid chat latency regressions.
2. Keep retrieval artifacts append-only where possible for auditability.
3. Apply retention jobs separately for session and retrieval stores.
4. Enforce UPL and citation boundaries at generation time, not only at export time.
