# Fix Log

## Scope

This file captures two behavior failures raised in review:

1. Conversational nuance replies are repetitive and weak on practical guidance.
2. Criminal-domain guidance is over-eager, role-confused, and promotes self-representation workflow too early.

It also records what the earlier "pre-existing changes" warning actually meant after a full worktree audit.

## What "Pre-Existing Changes" Means

The working tree is not just carrying a few unrelated edits. It currently contains a large mixed implementation state across several logical workstreams:

1. Conversational readiness and model-routing work.
2. Step-by-step workflow engine and workflow routes.
3. Product surface alignment across matter workspace pages.
4. Context and steering scaffolding for Copilot, Kiro, Cursor, and local setup automation.
5. Local form-catalog assets and refresh scripts.
6. Generated and runtime artifacts.

### Observed categories

- `frontend/` has broad UI changes across intake, matter detail, evidence, documents, settings, workflow, and nuance chat.
- `backend/` has broad route and service changes across conversational, matters, export, evidence, workflow, and router code.
- `src/` has core changes in integration, action plan generation, models, templates, routing, and a new workflow engine.
- `.kiro/` has both baseline-product and conversational-readiness spec changes.
- `.context/`, `.copilot/`, `.cursor/`, `.claude/`, `.mcp.json`, and setup scripts indicate a separate tooling/context bootstrap track.
- `court-forms/`, `Ontario Forms.md`, and `scripts/refresh-court-forms.ps1` indicate a forms-catalog ingestion and validation track.
- `backend/prisma/dev.db` and `playwright-report/index.html` are runtime/generated outputs and should not be mixed into behavioral fixes.

### Practical meaning

The earlier safety warning did not mean "there are a few random local edits." It meant the repo is already carrying multiple feature-sized changes that should be split before any narrow behavioral fix is treated as isolated work.

## Findings From Conversation A: Repetitive Nuance Output

### Root causes

1. `backend/src/services/conversationalOrchestrator.ts` rebuilds from prior user turns in a way that encourages recap on every reply.
2. `backend/src/services/nuanceExtractor.ts` is built around extraction and structured recap, not delta-only action guidance.
3. `frontend/src/pages/NuanceChatPage.tsx` visually reinforces recap-first behavior through `Structured Summary`, `Likely Track`, and `Still Missing` blocks.

### Desired behavior

1. Direct answer first.
2. Two to four practical next steps for the next 24 to 72 hours.
3. Short legal-information disclaimer when legal conclusions or thresholds are mentioned.
4. Suggest professional review where risk is high.
5. Ask one targeted follow-up question only.

### Product corrections required

1. Add a delta-only conversational response contract.
2. Add repetition guard logic against the prior assistant turn.
3. Make action fields first-class in backend payloads.
4. Demote recap-heavy UI sections below direct answer and immediate actions.

## Findings From Conversation B: Criminal Guidance And Workflow Gating

### Root causes

1. `src/core/actionPlan/ActionPlanGenerator.ts` treats `criminal` as a single default posture.
2. Criminal acknowledgment text defaults to charged-person framing.
3. Criminal role text defaults to complainant/Crown-witness framing.
4. Peace bond, victim services, occurrence-number, and complainant-role outputs are surfaced too early and too broadly.
5. `frontend/src/pages/MatterDetailPage.tsx` promotes the step-by-step plan too early for users who have not yet indicated self-representation or active filing posture.

### Desired behavior

1. Distinguish between accused, reporting/complainant, victim-support, and civil-first scenarios with possible criminal allegations.
2. Ask one role-defining clarification question when posture is unclear.
3. Do not say the user is dealing with criminal charges unless they are actually the accused.
4. Do not default to peace bond, victim services, or Crown-witness framing unless supporting facts are present.
5. Do not make the step-by-step plan the primary next action until the user actually needs guided self-representation help.

## Suggested Actions

### Worktree hygiene

1. Split the current mixed working tree into separate logical commits or branches before landing narrow fixes.
2. Keep generated/runtime files out of behavior-fix work: `backend/prisma/dev.db`, `playwright-report/index.html`, and other regenerated artifacts.
3. Treat tooling/context bootstrap files as a separate infrastructure change set from product behavior work.
4. Treat forms-catalog ingestion and workflow-engine additions as separate product tracks from conversational behavior fixes.

### Conversational behavior

1. Add a response schema with `directAnswer`, `immediateActions`, `escalationCriteria`, `singleNextQuestion`, and `conciseDisclaimer`.
2. Add a repetition guard that suppresses unchanged recap when overlap with the previous assistant turn is high.
3. Limit follow-up to one targeted question tied to the main unresolved fact.
4. Render action-first content before structured recap sections.

### Criminal and workflow behavior

1. Add criminal context modes before action-plan generation.
2. Gate peace bond, victim services, occurrence-number, and complainant-role guidance behind explicit factual triggers.
3. Make the step-by-step plan secondary by default in first-run matter views.
4. Promote workflow only when the user signals self-representation, filing readiness, or explicitly requests procedural guidance.

## Documentation Follow-Through

These findings should be reflected in two spec stacks:

1. `agentic-conversational-readiness`: delta-first response behavior, repetition guards, and action-oriented nuance payloads.
2. `canadian-legal-assistant`: criminal-context safeguards and progressive gating of the step-by-step plan.