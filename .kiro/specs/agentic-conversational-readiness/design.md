# Design Document

## Consolidation Status

This design is an extension overlay for conversational readiness.

- Canonical baseline architecture: `../canadian-legal-assistant/design.md`
- This file only defines incremental architecture for conversational orchestration and agentic readiness.
- Cross-stack governance: `../SPEC_GOVERNANCE.md`

## Overview

The current conversational experience is real but fragmented. The frontend actively serves `/matters/new` and `/matters/new/chat`, the backend registers `/api/conversational`, and the route handlers perform intake classification, nuance response generation, and guidance generation.

The main weaknesses are architectural duplication and missing proof: route-level follow-up logic duplicates agent capabilities, conversation state is transient, the optional LLM path is single-model only, and there is no typed eval loop or complete product-path test coverage.

This design defines a target architecture that preserves the existing user flow while moving orchestration, memory, routing, and safety controls into backend services.

## Current State Summary

### Confirmed Live Seams

- Frontend routes are active in `frontend/src/App.tsx`.
- The conversational intake component calls `/api/conversational/intake/process` in `frontend/src/components/ConversationalIntake.tsx`.
- The guidance page calls `/api/conversational/guidance/generate`, then creates and classifies a matter in `frontend/src/pages/ConversationalGuidancePage.tsx`.
- Backend conversational endpoints exist in `backend/src/routes/conversational.ts`.
- The optional nuance path uses a single OpenAI-compatible `/chat/completions` call in `backend/src/services/nuanceExtractor.ts`.
- `IntakeAgent` supports question generation, confidence scoring, evidence requirements, and multi-turn analysis in `src/core/agents/IntakeAgent.ts`.

### Current Issues

- Route-level conversational logic duplicates agent-level question and confidence logic.
- Conversation history exists in frontend state and per-request payloads, but not in persistent storage.
- The LLM layer is one optional model, not a routing system.
- There are no dedicated backend route tests or end-to-end tests for the conversational product path.
- HITL, eval loops, and streaming are either missing or weak.

## Architecture

### 1. Conversational Orchestrator

Create a backend orchestration service behind conversational routes and make it the single policy engine for:

- session lookup and persistence
- question generation
- confidence scoring
- evidence requirement synthesis
- import-readiness decisions
- review/HITL decisions
- model-routing decisions

The route layer should become a transport adapter only.

### 2. Session Store

Add Prisma-backed persistence for:

- `ConversationSession`
- `ConversationTurn`
- `ConversationImportArtifact`
- optional `ConversationReviewDecision`

`Matter` remains the eventual durable legal record, but conversational session state should exist before matter creation so users can resume work and the system can audit pre-import decisions.

### 3. Agent Reuse Layer

Use `IntakeAgent` as the primary abstraction for intake and follow-up logic. If route-specific nuance is needed, wrap it in orchestrator-level adapters instead of duplicating branching in `backend/src/routes/conversational.ts`.

### 4. Model Router

Replace the current single-model nuance call with a router and provider abstraction:

- `fallback-local`: deterministic local path
- `fast-extract`: low-cost extraction lane
- `deep-reason`: slower but stronger reasoning lane

Route selection inputs:

- confidence from `IntakeAgent` or previous turn
- urgency
- ambiguity or multi-domain uncertainty
- cost policy
- remote-model availability

The router should emit a typed `ModelRouteDecision` containing lane, provider, model, reason, and fallback result.

### 5. HITL Review Gate

Introduce a review-gate service that evaluates orchestration results and returns one of:

- `allow`
- `needs-user-confirmation`
- `needs-human-review`

Review should trigger on:

- low confidence
- ambiguous domain or pathway
- irreversible next step
- unsafe import payload

### 6. Eval Harness

Add typed eval infrastructure for conversational flows:

- golden transcripts and expected classification/import state
- schema validation for nuance responses
- confidence calibration expectations
- fallback-rate and router-selection metrics
- regression tests for import-back readiness

### 7. Streaming Transport

Add a streaming endpoint for longer-running nuance or guidance responses, preferably SSE for compatibility with the current stack. The frontend should render partial assistant output while preserving import state and review status.

## Data Model Sketch

### ConversationSession

- id
- createdAt
- updatedAt
- status (`active`, `readyToImport`, `imported`, `needsReview`, `closed`)
- seedDraftJson
- latestClassificationJson
- latestContextJson
- latestReviewDecisionJson
- importedMatterId

### ConversationTurn

- id
- sessionId
- role (`system`, `user`, `assistant`)
- content
- metadataJson
- createdAt

### ConversationImportArtifact

- id
- sessionId
- source (`llm`, `fallback`, `manual`)
- importPayloadJson
- evidenceChecklistJson
- readyToImport
- createdAt

### ModelRouteDecision

- lane
- provider
- model
- rationale
- confidenceAtDecision
- fallbackUsed

## API Changes

### Existing Routes to Keep (Thin)

- `POST /api/conversational/intake/process`
- `POST /api/conversational/nuance/respond`
- `POST /api/conversational/guidance/generate`

### New Supporting Routes

- `POST /api/conversational/sessions`
- `GET /api/conversational/sessions/:sessionId`
- `POST /api/conversational/sessions/:sessionId/turn`
- `GET /api/conversational/sessions/:sessionId/stream`
- `POST /api/conversational/sessions/:sessionId/import`
- `GET /api/conversational/sessions/:sessionId/review`

## Frontend Responsibilities

The frontend should:

- start and resume sessions
- send user turns
- render backend-provided questions, confidence, evidence checklist, and review state
- handle streaming updates
- trigger import and navigation

The frontend should not:

- compute legal branching policy
- own confidence thresholds
- rebuild evidence or review heuristics
- infer model-routing choices

## Verification Strategy

### Automated

- route tests for conversational endpoints
- unit tests for orchestrator, router, session store, and review gate
- end-to-end tests for `/matters/new` and `/matters/new/chat`
- fixture-based eval suite for import readiness and fallback behavior

### Manual

- reload and resume session
- disable remote model and verify fallback
- force low confidence and verify review gate
- verify audit event creation on import

## Scope Boundaries

### In Scope

- scorecard and backlog
- conversational product-path validation
- route-to-agent orchestration refactor
- session persistence
- model routing abstraction
- eval loops
- streaming and HITL design

### Out of Scope for First Implementation Pass

- full retrieval-augmented long-term memory
- growth or distribution automation loops beyond scorecard/backlog definition
- replacing the matter workspace or evidence system

## Domain-Agnostic Strategic Triage Architecture

### Triage Envelope Contract

All conversational intake responses should support a shared envelope regardless of legal domain:

- `assumption: string`
- `whatMattersLegally: string[]`
- `issueBuckets: string[]`
- `pivotalQuestion: string`
- `practicalOptions: { title: string; whenItFits: string; tradeoff: string }[]`
- `nextSteps24to72h: string[]`
- `uncertainty: string[]`

The envelope is emitted before completion gating and remains available even when additional clarifications are required.

### Route Decision Contract

Nuance and triage generation should include explicit route metadata:

- `lane: 'fast-extract' | 'deep-reason' | 'fallback-local'`
- `provider: string`
- `model: string`
- `decisionReason: string`
- `fallbackCause?: string`
- `confidenceAtDecision?: number`
- `latencyMs?: number`

Lane policy should be deterministic in v1:

- low ambiguity + time-sensitive -> `fast-extract`
- high ambiguity, high-stakes, or cross-domain conflict -> `deep-reason`
- unavailable/disabled model or routing failure -> `fallback-local`

### Citation Gate Boundary

`CitationEnforcer` is applied after model output and before import-ready/final guidance flags. Outputs that contain legal claims (statute names, deadlines, entitlement thresholds, filing rights) must pass citation validation.

If citation gate fails:

1. downgrade legal certainty language,
2. preserve route and validation result in audit metadata,
3. request user confirmation or human review for high-risk guidance.

### Orchestration Placement

`ConversationalOrchestrator` should own:

- envelope composition,
- lane selection invocation and metadata propagation,
- pivotal unknown extraction for targeted follow-up questions,
- review state and import readiness.

`backend/src/routes/conversational.ts` should remain a transport adapter and avoid policy duplication.

### Frontend Presentation and Report Export

`ConversationalIntake` renders triage envelope segments as infographic cards in this order:

1. assumption
2. legal framework
3. issue buckets
4. pivotal question
5. options matrix
6. next 24-72h actions
7. uncertainty to resolve

The same envelope is used for downloadable artifacts:

- strategic briefing report (markdown/pdf-ready),
- action checklist,
- optional document generation handoff metadata.

## Response Discipline and Delta-Only Guidance

### Action-First Nuance Contract

Nuance and conversational refinement replies should stop centering recap-heavy summaries. The backend contract should emit an action-first payload with these fields:

- `directAnswer: string`
- `immediateActions: string[]`
- `escalationCriteria: string[]`
- `singleNextQuestion: string`
- `conciseDisclaimer: string`
- optional `deltaSummary: string[]`

`directAnswer` and `immediateActions` are rendered first. Structured recap sections such as summary, likely track, and missing facts become supporting panels rather than the primary reply body.

### Repetition Guard

`ConversationalOrchestrator` should persist the previous assistant response shape in session context and evaluate overlap before returning a new reply.

If overlap with the prior assistant turn exceeds the configured threshold:

1. suppress unchanged recap,
2. keep only changed facts or unresolved unknowns,
3. emit one targeted follow-up question,
4. preserve disclaimers and escalation cues.

This keeps multi-turn chat from collapsing into repeated summaries of the same narrative.

### Practical Guidance Ordering

The reply order for nuance chat should be:

1. direct answer,
2. immediate next steps,
3. escalation or professional-review criteria,
4. one targeted follow-up question,
5. concise legal-information disclaimer.

The UI may still expose structured summary artifacts, but only as secondary review surfaces.
