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
  - [x] 3.2 Move question generation, confidence scoring, and evidence requirements to the orchestration layer
  - [x] 3.3 Reuse `IntakeAgent` for intake logic instead of duplicating branching in `backend/src/routes/conversational.ts`
  - [x] 3.4 Keep route handlers as thin transport adapters

- [ ] 4. Add persistent conversation memory
  - [x] 4.1 Extend Prisma schema with session and turn models
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

## Phase 4: Domain-Agnostic Triage and Lane Routing

- [ ] 11. Implement strategic triage envelope across all legal domains
  - [ ] 11.1 Define `TriageEnvelope` schema in backend orchestration contracts
  - [ ] 11.2 Compose envelope in intake responses regardless of confidence state
  - [ ] 11.3 Restrict follow-up prompts to pivotal unknowns only
  - [ ] 11.4 Add integration tests for employment, landlord/tenant, criminal, insurance, and consumer scenarios

- [ ] 12. Implement explicit lane selection metadata for nuance extraction
  - [ ] 12.1 Add lane selection API to model router (`fast-extract`, `deep-reason`, `fallback-local`)
  - [ ] 12.2 Return route decision metadata with provider/model/rationale
  - [ ] 12.3 Persist route decision details to audit events
  - [ ] 12.4 Add fallback-path tests when remote models are disabled/unavailable

- [ ] 13. Enforce citation/source validation on legal claims
  - [ ] 13.1 Integrate `CitationEnforcer` in nuance and guidance response finalization
  - [ ] 13.2 Downgrade or gate outputs with missing/invalid citations
  - [ ] 13.3 Add tests for statute/deadline outputs failing citation checks
  - [ ] 13.4 Surface citation-gate status in API payloads and logs

## Phase 5: UX Segmentation and Downloadable Reports

- [ ] 14. Upgrade conversational intake UI to infographic segmentation
  - [ ] 14.1 Render triage envelope as ordered visual cards
  - [ ] 14.2 Preserve quick follow-up interaction for unresolved pivotal facts
  - [ ] 14.3 Validate readability and mobile behavior for segmented cards

- [ ] 15. Add strategic report and action-checklist exports
  - [ ] 15.1 Generate downloadable strategic briefing from triage envelope
  - [ ] 15.2 Include disclaimers and citation/review status in exported artifacts
  - [ ] 15.3 Add tests for report content completeness and schema consistency

## Phase 6: Response Discipline and Practical Guidance

- [ ] 16. Add a delta-first conversational response contract
  - [ ] 16.1 Extend nuance and orchestration payloads with `directAnswer`, `immediateActions`, `escalationCriteria`, `singleNextQuestion`, and `conciseDisclaimer`
  - [ ] 16.2 Limit immediate actions to the next 24 to 72 hours and cap them at 4 items
  - [ ] 16.3 Ensure disclaimers remain concise but mandatory when legal thresholds or consequences are discussed

- [ ] 17. Add repetition guards and action-first rendering
  - [ ] 17.1 Persist prior assistant response state in conversational sessions for overlap comparison
  - [ ] 17.2 Suppress unchanged recap when overlap exceeds the configured threshold
  - [ ] 17.3 Update `NuanceChatPage` to render direct answer and immediate actions before summary panels
  - [ ] 17.4 Add tests proving repeated user turns do not produce repeated assistant summaries

## Expanded Verification Gates

- [ ] F. Triage envelope is present and valid for all major legal domains
- [ ] G. Lane routing metadata is emitted and auditable for nuance calls
- [ ] H. Citation gate blocks or downgrades uncited legal claims
- [ ] I. Infographic intake view and strategic report export function end-to-end
- [ ] J. Conversational refinement replies are delta-first, action-first, and non-repetitive across multi-turn sessions
