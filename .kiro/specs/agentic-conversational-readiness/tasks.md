# Implementation Plan: Agentic Conversational Readiness

## Consolidation Status

This task file tracks extension work only.

- Canonical baseline tasks live in `../canadian-legal-assistant/tasks.md`.
- Do not duplicate baseline tasks here.
- If a task changes baseline behavior, add a linked dependency note in both stacks.

## Phase 0: Baseline Proof and Scorecard

- [x] 1. Create the YC signal scorecard and evidence inventory
  - [x] 1.1 Evaluate all 10 YC signals using live code seams and tests
  - [x] 1.2 Mark each signal as `implemented`, `partial`, or `missing`
  - [x] 1.3 Record file-backed evidence and concrete gaps for each signal
  - [x] 1.4 Produce a ranked backlog with `P0/P1/P2`, effort, dependencies, and acceptance criteria

- [x] 2. Validate the current conversational product path end-to-end
  - [x] 2.1 Add end-to-end coverage for `/matters/new`
  - [x] 2.2 Add end-to-end coverage for `/matters/new/chat`
  - [x] 2.3 Verify import-back, matter creation, classification, guidance, and audit event creation
  - [x] 2.4 Verify fallback mode when `NUANCE_LLM_ENABLED=false`

## Phase 1: P0 Workflow Hardening

- [ ] 3. Refactor conversational routes behind a single orchestrator
  - [x] 3.1 Create a backend conversational orchestration service
  - [ ] 3.2 Move question generation, confidence scoring, and evidence requirements to the orchestration layer
  - [x] 3.3 Reuse `IntakeAgent` for intake logic instead of duplicating branching in `backend/src/routes/conversational.ts`
  - [ ] 3.4 Keep route handlers as thin transport adapters

- [ ] 4. Add persistent conversation memory
  - [ ] 4.1 Extend Prisma schema with session and turn models
  - [ ] 4.2 Create persistence services for session lookup, turn append, import artifact storage, and resume
  - [ ] 4.3 Restore conversation state on reload and import-back flows
  - [ ] 4.4 Add audit logging for import, review, and session transitions

- [ ] 5. Add explicit HITL boundaries
  - [ ] 5.1 Implement a review-gate service for low confidence, ambiguity, and irreversible actions
  - [ ] 5.2 Surface review state through conversational APIs and UI
  - [ ] 5.3 Require confirmation or human review before unsafe import transitions

## Phase 2: P1 Agentic Readiness

- [ ] 6. Implement provider/model routing
  - [ ] 6.1 Create a model-router abstraction with `fast-extract`, `deep-reason`, and `fallback-local` lanes
  - [ ] 6.2 Refactor `NuanceExtractor` into a provider adapter or router consumer
  - [ ] 6.3 Add config support for multiple providers/models and routing policies
  - [ ] 6.4 Log route decisions and fallback causes

- [ ] 7. Add typed eval loops and observability
  - [ ] 7.1 Create golden conversational fixtures and expected outputs
  - [ ] 7.2 Add schema-validity tests for nuance and import payloads
  - [ ] 7.3 Add confidence-calibration and fallback-rate metrics
  - [ ] 7.4 Add CI regression checks for conversational readiness

## Phase 3: P2 UX and Platform Refinement

- [x] 8. Add streaming conversational responses
  - [x] 8.1 Implement SSE or equivalent streaming endpoint
  - [x] 8.2 Update frontend chat rendering for partial responses and loading state
  - [x] 8.3 Preserve import-readiness and review state during streaming

- [x] 9. Refine retrieval and long-term memory boundaries
  - [x] 9.1 Separate short-term session state from long-term retrieval artifacts
  - [x] 9.2 Define artifact retention, redaction, and export behavior
  - [x] 9.3 Document how retrieval memory will integrate later without bloating session storage

- [x] 10. Document deferred distribution-loop work
  - [x] 10.1 Record which distribution-loop signals remain out of scope for workflow hardening
  - [x] 10.2 Define what telemetry or product hooks would be needed later

## Verification Gates

- [ ] A. Scorecard published with evidence-backed statuses for all 10 YC signals
- [ ] B. Conversational end-to-end tests pass for normal and LLM-disabled fallback paths
- [ ] C. Backend orchestration owns confidence, follow-ups, review gates, and import-readiness logic
- [ ] D. Session persistence survives reload and import-back flows
- [ ] E. Model-router, eval loop, and audit outputs are visible and testable

## Recommended Priority Labels

### P0

- baseline scorecard
- conversational end-to-end validation
- orchestrator refactor
- persistent session memory
- HITL review gate

### P1

- model router
- eval loops and metrics
- CI regression coverage

### P2

- streaming
- retrieval-memory refinement
- distribution-loop planning only
