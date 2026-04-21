# Active Goal — Session March 31, 2026

## Project Health

- Unit tests: 558/627 passing (69 failing — all in agent/kit layer from Task 26.7 interface drift)
- E2E tests: 5/5 passing
- Backend build: 0 TypeScript errors
- Security: Background scanner available (non-blocking)

## Open Tasks (Priority Order)

### 1. Task 26.7 — Agent/Kit Interface Alignment

Fix 69 failing tests caused by interface drift in the Phase 3 agent/kit layer.

**26.7.1 — GuidanceAgent (46 failures)**  
File: GuidanceAgent.ts  
- Fee waiver API: tests check `feeWaiver.eligible` boolean but `assessFeeWaiver()` returns object without `.eligible`  
- Cost calculator: code accesses `costEstimate.serviceProcessing` and `.other` but calculator returns `additionalCosts[]` array  
- FormattedResource imported from wrong location  
Test file: guidanceAgent.test.ts

**26.7.2 — IntakeAgent (1 failure)**  
File: IntakeAgent.ts  
- References `ClassificationInput` interface that does not exist — refactor to use `MatterClassification` directly  
Test file: intakeAgent.test.ts

**26.7.3 — Domain module tests (10 failures)**  
- civilNegligenceDomainModule.test.ts (6) — template rendering and draft structure  
- criminalDomainModule.test.ts (3) — not generating all 6 expected documents  
- legalMalpracticeDomainModule.test.ts (1) — expert instruction template variable substitution

**26.7.4 — AnalysisAgent + DocumentAgent (11 failures)**  
Partially fixed: evidenceIndex.items, output.drafts, civil-negligence domain strings.  
Test files: analysisAgent.test.ts, documentAgent.test.ts

**26.7.5 — Kit interfaces (across 5 kit files)**  
- `classification.pillar` removed from MatterClassification — ~8 access sites in kits  
- `KitExecutionContext.userId` missing from interface  
- `FormMappingRegistry.getFormByTitle()` does not exist — use `getFormMapping(formId)`

**26.7.6 — Re-enable kit integration (final step)**  
After all tests pass:  
- Uncomment IntegrationAPI kit imports, fields, interfaces, methods  
- Rename `backend/src/routes/kits.ts.disabled` to `kits.ts`  
- Uncomment kitsRouter in server.ts  
- Uncomment agent/kit exports in index.ts  
- Verify: `cd backend && npm run build` = 0 errors, `npm test` = 627/627

---

### 2. Phase 3a — Model Router Abstraction

Replace the single optional OpenAI fetch in nuanceExtractor.ts with a multi-provider router.

**Create:**
- `src/services/ModelRouter.ts` — unified request/response interfaces, routing policy, provider registry
- `src/services/adapters/AnthropicAdapter.ts` — Claude (legal research + drafting)
- `src/services/adapters/OpenAIAdapter.ts` — wraps existing fetch logic
- `src/services/adapters/FallbackAdapter.ts` — deterministic local path (current fallback)
- `tests/modelRouter.test.ts` — mock adapters, routing decisions, fallback on provider error

**Modify:**
- nuanceExtractor.ts — delegate all LLM calls to ModelRouter
- config.ts — add ANTHROPIC_API_KEY, ROUTER_POLICY env vars

**Routing policy v1 (rule-based):**
- task_type=legal_research + sensitivity=high -> Claude
- task_type=classification -> FallbackAdapter
- task_type=drafting + max_latency_ms<3000 -> OpenAI
- default -> FallbackAdapter

---

### 3. Phase 3b — Conversational Orchestrator Session Persistence

Upgrade `ConversationalOrchestrator` with Prisma-backed sessions and HITL review gate.

**Add to Prisma schema:**
- ConversationSession (id, status, seedDraftJson, latestClassificationJson, importedMatterId)
- ConversationTurn (id, sessionId, role, content, metadataJson)
- ConversationImportArtifact (id, sessionId, source, importPayloadJson, readyToImport)

**Add services:**
- HITL review gate: allow | needs-user-confirmation | needs-human-review
- SSE streaming endpoint for long-running guidance responses
- Eval harness: golden transcripts, schema validation, confidence calibration

---

## Run Commands

```
npm test                                          # all unit tests from root
npx vitest run guidanceAgent.test.ts        # target failing agent tests
npx playwright test --config playwright.config.ts # E2E
cd backend && npm run build                       # backend type check
```

## Definition of Done (Task 26.7)

- npm test from root: 627/627 passing
- cd backend && npm run build: 0 TypeScript errors
- GET /api/kits returns kit list
- POST /api/kits/:kitId/execute executes a kit end-to-end
- All 5 Playwright E2E specs still passing
