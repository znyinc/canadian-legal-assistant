# Requirements Document

## Consolidation Status

This is an extension spec stack, not the canonical baseline.

- Canonical baseline: `../canadian-legal-assistant/requirements.md`
- Extension scope: conversational orchestration hardening, model routing, session persistence, HITL, eval loops, and streaming
- Governance rules: `../SPEC_GOVERNANCE.md`

## Introduction

This specification defines how the Canadian Legal Assistant conversational workflow should be evaluated and upgraded from a partially validated intake experience into a measured, backend-orchestrated, agentic workflow.

The objective is to produce a file-backed readiness scorecard against 10 YC signals, validate the conversational product path end-to-end, and define the shortest implementation path to a production-grade workflow engine with orchestration, persistence, model routing, typed evaluation loops, streaming, and human-in-the-loop controls.

This spec remains Ontario-first, information-only, and must preserve UPL boundaries, evidence grounding, auditability, and restrained legal-information language.

## Requirements

### Requirement 1: YC Signal Scorecard

**User Story:** As a product and engineering team, I want a file-backed scorecard against the 10 YC signals, so that we can assess readiness without relying on summary docs or assumptions.

#### Acceptance Criteria

1. WHEN the scorecard is generated, THE SYSTEM SHALL evaluate all 10 YC signals using the statuses `implemented`, `partial`, or `missing`.
2. WHEN a scorecard item is marked, THE SYSTEM SHALL cite concrete code or test evidence from the live repository.
3. WHEN a scorecard item is marked `partial` or `missing`, THE SYSTEM SHALL record the specific gap and affected code seam.
4. WHEN the scorecard is published, THE SYSTEM SHALL include a ranked backlog entry for each non-implemented signal.

### Requirement 2: End-to-End Conversational Path Validation

**User Story:** As a product team, I want proof that the conversational path works end-to-end, so that we can distinguish implemented behavior from partially wired behavior.

#### Acceptance Criteria

1. WHEN validating `/matters/new`, THE SYSTEM SHALL test intake, follow-up handling, matter creation, classification, and guidance generation as one product path.
2. WHEN validating `/matters/new/chat`, THE SYSTEM SHALL test nuance chat, import-back flow, and handoff into matter creation and guidance.
3. WHEN LLM support is disabled, THE SYSTEM SHALL prove the fallback path still produces import-ready context.
4. WHEN conversational flow finishes, THE SYSTEM SHALL verify the related audit event is created.

### Requirement 3: Unified Conversational Orchestration

**User Story:** As an engineering team, I want conversational routing logic to use the existing agent abstraction, so that question generation, confidence scoring, and evidence requirements are not duplicated across layers.

#### Acceptance Criteria

1. WHEN conversational intake is processed, THE SYSTEM SHALL delegate question generation and confidence logic to `IntakeAgent` or a backend orchestration service built on it.
2. WHEN follow-up questions are generated, THE SYSTEM SHALL use one source of truth for domain-specific branching.
3. WHEN orchestration decisions are made, THE SYSTEM SHALL keep the route layer thin and policy-free.
4. WHEN agent confidence is insufficient, THE SYSTEM SHALL return targeted follow-up prompts rather than silently importing incomplete data.

### Requirement 4: Conversation Memory and Session Persistence

**User Story:** As a user, I want my conversational context to survive page reloads and multi-step handoffs, so that I do not lose progress or need to re-enter the same facts.

#### Acceptance Criteria

1. WHEN a conversational session starts, THE SYSTEM SHALL create a persistent session record.
2. WHEN a user sends or receives a conversational turn, THE SYSTEM SHALL persist the turn with timestamp and role.
3. WHEN the user returns to the same session, THE SYSTEM SHALL restore the latest thread state and import-ready context.
4. WHEN conversation data is stored, THE SYSTEM SHALL separate short-term session state from long-term retrieval or evaluation artifacts.

### Requirement 5: Model Routing and Provider Abstraction

**User Story:** As a platform team, I want a provider-agnostic model router, so that the system can select the right inference lane by urgency, confidence, and cost.

#### Acceptance Criteria

1. WHEN the system uses an LLM for nuance extraction or conversational reasoning, THE SYSTEM SHALL route through a model-router abstraction rather than a hardcoded single-model call.
2. WHEN routing is evaluated, THE SYSTEM SHALL support at least the lanes `fast-extract`, `deep-reason`, and `fallback-local`.
3. WHEN a route is selected, THE SYSTEM SHALL log the provider, model, lane, and routing rationale.
4. IF no remote model is enabled or available, THEN THE SYSTEM SHALL degrade to deterministic local fallback without breaking the user flow.

### Requirement 6: Typed Evaluation Loops

**User Story:** As an engineering team, I want typed evaluation loops for conversational intake and nuance extraction, so that regressions are visible and confidence thresholds can be tuned.

#### Acceptance Criteria

1. WHEN conversational logic changes, THE SYSTEM SHALL run golden conversational fixtures through automated tests.
2. WHEN a conversational response is produced, THE SYSTEM SHALL validate required schema fields before marking the result import-ready.
3. WHEN confidence scores are emitted, THE SYSTEM SHALL support calibration checks against fixture expectations.
4. WHEN fallback paths execute, THE SYSTEM SHALL expose fallback-rate metrics for regression tracking.

### Requirement 7: Streaming and Latency Handling

**User Story:** As a user, I want conversational responses to feel responsive, so that the system does not appear stalled during longer reasoning steps.

#### Acceptance Criteria

1. WHEN a conversational response requires longer processing, THE SYSTEM SHALL support a streaming transport or equivalent progressive-response channel.
2. WHEN streaming is unavailable, THE SYSTEM SHALL degrade gracefully to request/response behavior.
3. WHEN streaming is active, THE SYSTEM SHALL preserve UPL disclaimers and review-gate behavior.

### Requirement 8: Human-in-the-Loop Boundaries

**User Story:** As a compliance-conscious product team, I want explicit review gates, so that ambiguous or high-risk cases do not move forward without human review.

#### Acceptance Criteria

1. WHEN confidence is below the configured threshold, THE SYSTEM SHALL trigger a review state.
2. WHEN a domain is ambiguous or multi-pathway uncertainty is high, THE SYSTEM SHALL trigger a review state.
3. WHEN an action is irreversible or legally sensitive, THE SYSTEM SHALL require explicit user confirmation or human review.
4. WHEN review is triggered, THE SYSTEM SHALL log the reason and preserve the supporting transcript.

### Requirement 9: Thin UI, Thick Backend

**User Story:** As an engineering team, I want orchestration logic to live on the backend, so that the frontend remains a renderer and state client rather than a policy engine.

#### Acceptance Criteria

1. WHEN conversational state is computed, THE SYSTEM SHALL centralize orchestration, confidence, routing, and review policy on the backend.
2. WHEN the frontend renders conversational guidance, THE SYSTEM SHALL consume typed API responses rather than rebuild legal workflow logic client-side.
3. WHEN new workflow capabilities are added, THE SYSTEM SHALL expose them through stable backend contracts.

### Requirement 10: Compliance, Auditability, and Safety

**User Story:** As a compliance officer, I want all conversational enhancements to preserve legal-information boundaries and auditability, so that the system remains safe while becoming more agentic.

#### Acceptance Criteria

1. WHEN conversational responses are generated, THE SYSTEM SHALL preserve legal-information disclaimers and UPL boundaries.
2. WHEN transcripts, evals, or routing telemetry are stored, THE SYSTEM SHALL avoid leaking redacted personal information beyond approved storage scopes.
3. WHEN audit events are created, THE SYSTEM SHALL capture conversational imports, review decisions, and model-routing decisions.
4. WHEN authoritative legal claims are surfaced through conversational guidance, THE SYSTEM SHALL remain evidence-grounded and cite approved sources where required.

### Requirement 11: Domain-Agnostic Strategic Triage Envelope

**User Story:** As a user in any legal category, I want the assistant to provide a structured strategic triage output immediately, so that I can understand the legal forks before answering more clarifying questions.

#### Acceptance Criteria

1. WHEN intake receives a user narrative, THE SYSTEM SHALL return a domain-agnostic triage envelope with the sections `assumption`, `whatMattersLegally`, `issueBuckets`, `pivotalQuestion`, `practicalOptions`, `nextSteps24to72h`, and `uncertainty`.
2. WHEN intake confidence is low, THE SYSTEM SHALL still return the triage envelope and then ask only clarifying questions tied to the pivotal unknowns.
3. WHEN the domain is not employment, THE SYSTEM SHALL still use the same envelope structure and legal-issue mapping pattern.
4. WHEN ambiguity exists across multiple domains, THE SYSTEM SHALL preserve multiple lawful pathways and avoid premature single-route conclusions.
5. WHEN intake responses are serialized for UI consumption, THE SYSTEM SHALL emit prompt-aligned headings `Assumption`, `WhatMattersLegally`, `LikelyIssueBuckets`, `MyPracticalOptions`, `WhatToDoNow`, `WhereUncertaintyRemains`, and `KeyDeadlineForum`.

### Requirement 12: Explicit Lane-Based Model Decisioning

**User Story:** As a platform operator, I want transparent model lane selection, so that I can control cost, speed, and depth while preserving legal-output quality.

#### Acceptance Criteria

1. WHEN nuance extraction runs, THE SYSTEM SHALL select one lane from `fast-extract`, `deep-reason`, or `fallback-local`.
2. WHEN a lane is selected, THE SYSTEM SHALL expose route metadata including lane, provider, model, rationale, and fallback cause if any.
3. WHEN model availability changes, THE SYSTEM SHALL degrade without breaking intake flow and SHALL keep response schema stable.
4. WHEN latency-sensitive interactions occur, THE SYSTEM SHALL prefer `fast-extract` unless ambiguity/risk requires `deep-reason`.

### Requirement 13: Citation Gate for Legal Claims

**User Story:** As a compliance lead, I want all legal assertions about statutes, deadlines, or entitlements to pass citation checks, so that hallucinated legal claims are blocked.

#### Acceptance Criteria

1. WHEN a response includes legal-statute, deadline, or entitlement language, THE SYSTEM SHALL validate citations through `CitationEnforcer` (or equivalent citation gate) before marking output ready.
2. IF required citations are missing or invalid, THEN THE SYSTEM SHALL downgrade the output to non-authoritative wording and request verification or human review.
3. WHEN citation validation runs, THE SYSTEM SHALL preserve audit evidence of validation outcome.
4. WHEN citation validation fails repeatedly, THE SYSTEM SHALL not silently promote the response as final legal guidance.

### Requirement 14: Infographic Walkthrough and Downloadable Strategy Report

**User Story:** As a user, I want a visual segmented walkthrough and downloadable report, so that I can understand and retain the strategy without reading dense prose.

#### Acceptance Criteria

1. WHEN the triage envelope is produced, THE SYSTEM SHALL render each segment as a discrete visual card/step in the UI.
2. WHEN the user requests a report, THE SYSTEM SHALL generate a downloadable strategic briefing artifact containing triage sections, options matrix, and next-step checklist.
3. WHEN report export is generated, THE SYSTEM SHALL include the legal-information-only disclaimer and review/citation status.
4. WHEN actionable documents are requested, THE SYSTEM SHALL support structured output generation from the same triage envelope.

### Requirement 15: Delta-First Conversational Guidance

**User Story:** As a user refining a legal situation in chat, I want each assistant reply to move the matter forward instead of repeating the same summary, so that I get practical next steps quickly.

#### Acceptance Criteria

1. WHEN a conversational refinement reply is generated, THE SYSTEM SHALL begin with a direct answer or assessment sentence before any recap.
2. WHEN the prior turns already establish the core facts, THE SYSTEM SHALL surface only changed facts, unresolved unknowns, or next actions rather than restating unchanged history.
3. WHEN the system returns actionable guidance, THE SYSTEM SHALL emit structured fields `directAnswer`, `immediateActions`, `escalationCriteria`, `singleNextQuestion`, and `conciseDisclaimer`.
4. WHEN practical guidance is available, THE SYSTEM SHALL provide 2 to 4 immediate actions oriented to the next 24 to 72 hours.
5. WHEN legal thresholds, criminal exposure, or forum-sensitive consequences are discussed, THE SYSTEM SHALL include a brief legal-information disclaimer and a professional-review trigger where risk is high.
6. WHEN overlap with the previous assistant reply exceeds the configured threshold, THE SYSTEM SHALL suppress repetitive narrative and return only delta content plus one targeted follow-up question.
