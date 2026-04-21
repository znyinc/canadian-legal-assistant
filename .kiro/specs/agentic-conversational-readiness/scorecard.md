# Agentic Conversational YC Scorecard

## Purpose

This scorecard baselines the current repository against 10 YC-style agentic product signals using file-backed evidence from active code paths.

Scale:
- `implemented`
- `partial`
- `missing`

Date: 2026-03-27

## Signal Scorecard

| Signal | Status | Evidence | Gap Summary |
|---|---|---|---|
| Own the workflow | partial | `frontend/src/App.tsx`, `frontend/src/pages/ConversationalGuidancePage.tsx`, `backend/src/routes/conversational.ts` | Core conversational flow is wired and creates/classifies matters, but product-path automation coverage and persistent session continuity are incomplete. |
| AI as control plane | partial | `backend/src/routes/conversational.ts`, `src/core/agents/IntakeAgent.ts` | Route layer still contains handcrafted branching and confidence handling instead of unified agent orchestration. |
| Structured outputs | partial | `backend/src/services/nuanceExtractor.ts`, `frontend/src/services/api.ts` | Nuance output is structured, but schema governance and strict validation/eval gates are not yet formalized across all conversational transitions. |
| Retrieval + memory | partial | `frontend/src/components/ConversationalIntake.tsx`, `backend/prisma/schema.prisma` | Conversation state is largely transient in UI/request payloads; no dedicated persisted conversation session/turn model yet. |
| HITL boundaries | partial | `src/api/IntegrationAPI.ts`, `backend/src/routes/conversational.ts` | UPL boundaries exist broadly, but explicit conversational review gates for low confidence/ambiguous/irreversible actions are not first-class. |
| Latency + streaming | missing | `frontend/src/components/ConversationalIntake.tsx`, `backend/src/routes/conversational.ts` | UX is request/response only; no SSE/WebSocket progressive stream path for conversational turns. |
| Multi-model routing | missing | `backend/src/config.ts`, `backend/src/services/nuanceExtractor.ts`, `backend/.env` | Only single optional OpenAI-compatible model is configured; no lane/provider router (`fast-extract`, `deep-reason`, `fallback-local`). |
| Eval loops | missing | `tests/`, `tests/intakeAgent.test.ts` | Agent unit tests exist, but no typed conversational golden-suite with calibration, schema-validity, fallback-rate, and regression gates. |
| Distribution loops | missing | repo-wide | No explicit conversational growth/distribution telemetry loops connected to product iteration workflows. |
| Thin UI, thick backend | implemented | `backend/src/server.ts`, `backend/src/routes/conversational.ts`, `frontend/src/pages/ConversationalGuidancePage.tsx` | Backend already owns key routing and generation endpoints; frontend mostly orchestrates UI state and endpoint calls. |

## Evidence Inventory (Primary Seams)

- `frontend/src/App.tsx`
- `frontend/src/components/ConversationalIntake.tsx`
- `frontend/src/pages/ConversationalGuidancePage.tsx`
- `frontend/src/pages/NuanceChatPage.tsx`
- `frontend/src/services/api.ts`
- `backend/src/server.ts`
- `backend/src/routes/conversational.ts`
- `backend/src/services/nuanceExtractor.ts`
- `backend/src/config.ts`
- `backend/.env`
- `backend/prisma/schema.prisma`
- `src/core/agents/IntakeAgent.ts`
- `tests/intakeAgent.test.ts`
- `tests/e2e/`

## Ranked Improvement Backlog

| Priority | Item | Effort | Depends On | Acceptance Criteria |
|---|---|---|---|---|
| P0 | Conversational end-to-end validation suite | M | none | Automated tests cover `/matters/new` and `/matters/new/chat`, including import-back, matter create/classify, guidance, audit event, and LLM-disabled fallback. |
| P0 | Unified conversational orchestrator | M-L | none | `backend/src/routes/conversational.ts` becomes thin adapter; questioning/confidence/evidence branching delegated to orchestrator using `IntakeAgent`. |
| P0 | Persistent conversation memory | M | orchestrator contract | Prisma session + turn persistence supports reload/resume and import continuity. |
| P0 | Explicit conversational HITL review gate | M | orchestrator + persistence | Low-confidence, ambiguity, or irreversible-action states trigger review/confirmation with auditable reason codes. |
| P1 | Provider/model router lanes | M | orchestrator | Router supports `fast-extract`, `deep-reason`, `fallback-local`, with decision logs and graceful degradation. |
| P1 | Typed eval harness and metrics | M | orchestrator + router | Golden fixtures, schema checks, confidence calibration, fallback-rate metrics, and CI regression gates run reliably. |
| P2 | Streaming conversational responses | M | orchestrator + session state | SSE (or equivalent) streams assistant output while preserving import and review state semantics. |
| P2 | Retrieval-memory boundary hardening | S-M | persistence | Short-term thread memory and longer-term retrieval/eval artifacts are clearly separated and lifecycle-managed. |
| P2 | Distribution-loop instrumentation | S-M | eval metrics | Product telemetry for conversion/drop-off and quality trends is documented and captured for future iteration cycles. |

## Notes

- This scorecard intentionally reflects current code behavior, not aspirational docs.
- The shortest path to an agentic workflow engine is P0-first: validate flow, centralize orchestration, persist state, and add review gates.