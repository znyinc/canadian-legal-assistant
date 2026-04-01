# AI Coding Instructions
<!-- Auto-generated 2026-03-31 � DO NOT EDIT -->

# Core Principles — LEGAL (canadian-legal-assistant)

## Mission

An information-only legal assistant that answers "Do I go to court?" — Ontario-first, Canada-wide coverage. This is a compassionate navigator for legal newcomers, not a tool for lawyers.

## Non-Negotiable Design Values

1. **Assume Zero Legal Knowledge** — every user is a first-timer; no jargon without definition
2. **Reduce Anxiety, Not Just Complexity** — acknowledge emotional reality before procedural steps
3. **One Step at a Time** — progressive disclosure; never dump everything at once
4. **Always Explain the WHY** — users who understand the reason follow guidance better
5. **Safe Harbor Over Speed** — when uncertain, recommend a professional; never rush into advice

## UPL Boundary (Hard Rules)

- The system provides **legal information**, never **legal advice**
- Every output touching a legal conclusion must carry a disclaimer
- Present **multiple lawful pathways** — never a single recommendation
- Refuse uncited legal statements — cite the source or flag uncertainty explicitly
- When a user asks for advice, switch to options-based guidance

## AI / LLM Principles

- The LLM layer is **optional** — the system must work fully without it using deterministic fallback
- LLM outputs are **not authoritative** — they are drafts subject to user confirmation
- All factual claims in generated documents must trace to user-provided evidence or confirmed facts
- Hallucinated citations must be caught at the `CitationEnforcer` boundary before reaching templates
- Model routing decisions must be logged (provider, model, latency, tokens) without logging PII or raw legal content

## Code Principles

- **Explicit over implicit** — no magic, no convention-over-config surprises
- **Functions do one thing well** — single responsibility from module to method
- **Meaningful names over comments** — code reads like prose
- **No magic numbers** — every threshold, limit, or constant lives in a named export or config value
- **Fail fast with clear error messages** — surface problems at the boundary, not buried in logic
- **Evidence-grounded outputs** — every factual claim traces to evidence index entries, not assumptions

## Testing Philosophy

- Unit tests for all business logic in `src/core/**`
- Integration tests for all API boundaries in `backend/src/routes/**`
- E2E (Playwright) for the full user journey — 5 specs: golden-path, journey, pillar, pillar-ambiguous, action-plan
- Mock all external services (CanLII API, LLM APIs) in tests — never call live endpoints in CI
- All tests must be green before a task is marked complete


---

# Tech Stack — LEGAL (canadian-legal-assistant)

## Repository Layout (Monorepo)

```
canadian-legal-assistant/
├── src/                        # Core library (TypeScript, no framework)
│   ├── api/                    # IntegrationAPI — single entry point for all core logic
│   ├── core/
│   │   ├── agents/             # IntakeAgent, AnalysisAgent, DocumentAgent, GuidanceAgent
│   │   ├── actionPlan/         # ActionPlanGenerator
│   │   ├── cost/               # CostCalculator (filing fees, fee waiver, risk)
│   │   ├── documents/          # DocumentDraftingEngine, DocumentPackager, PDFSummaryGenerator
│   │   ├── domains/            # 11 domain modules (Criminal, LTB, Employment, etc.)
│   │   ├── evidence/           # EvidenceProcessor, EvidenceIndexer
│   │   ├── kits/               # BaseKit + KitOrchestrator + 5 decision-support kits
│   │   ├── language/           # TermDictionary, ReadabilityScorer
│   │   ├── limitation/         # LimitationPeriodsEngine (12 Ontario periods)
│   │   ├── models/             # Shared TypeScript interfaces
│   │   ├── ocpp/               # OCPPValidator (PDF/A compliance)
│   │   ├── templates/          # TemplateLibrary, FormMappingRegistry (4 Ontario forms)
│   │   └── triage/             # MatterClassifier, ForumRouter, TimelineAssessor
│   └── data/                   # authorities.ts — seeded authority registry
├── backend/                    # Express API server (port 3001)
│   ├── src/
│   │   ├── config.ts           # All env vars (port, LLM keys, upload dir, CanLII key)
│   │   ├── server.ts           # App bootstrap, domain module registration
│   │   ├── routes/             # matters, evidence, documents, audit, caselaw, export, conversational
│   │   └── services/           # ConversationalOrchestrator, NuanceExtractor
│   └── prisma/                 # schema.prisma — Matter, Evidence, Document, AuditEvent
├── frontend/                   # React 18 + Vite + Tailwind CSS (port 5173)
│   └── src/
│       ├── pages/              # 9 pages including ConversationalGuidancePage
│       ├── components/         # 20+ components (OverviewTab, ImmediateActionsCard, etc.)
│       └── services/api.ts     # Typed fetch wrappers for all backend endpoints
└── tests/
    ├── *.test.ts               # Vitest unit tests
    └── e2e/                    # Playwright E2E specs (5 specs)
```

## Runtime Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Core library | TypeScript ES2022 ESM | Zero runtime framework — pure logic |
| Backend | Express 4 + TypeScript | ESM modules (`type: "module"`) |
| ORM / DB | Prisma + SQLite (dev) | schema.prisma |
| File uploads | multer 2.0.2 | Path traversal hardened, per-IP rate limited |
| Archive/export | archiver 7.0.0 | ZIP export of matter data |
| Frontend | React 18 + Vite + Tailwind CSS | Mobile-first, WCAG 2.1 AA |
| Icons | lucide-react | Used in action plan and kit UI components |
| HTML sanitation | DOMPurify | All user-supplied React-rendered content |
| Testing (unit) | Vitest | Root vitest.config.ts + vitest.config.ts |
| Testing (E2E) | Playwright | playwright.config.ts at root |
| CI | GitHub Actions | ci.yml |
| Security scan | Snyk | Runs on every PR |
| Package manager | npm | package-lock.json present |

## LLM / AI Layer (Current)

| Config Key | Env Var | Default | Purpose |
|-----------|---------|---------|--------|
| nuanceLlmEnabled | NUANCE_LLM_ENABLED | false | Feature flag — opt-in LLM path |
| nuanceLlmApiKey | NUANCE_LLM_API_KEY or OPENAI_API_KEY | — | Bearer token |
| nuanceLlmBaseUrl | NUANCE_LLM_BASE_URL | https://api.openai.com/v1 | OpenAI-compatible endpoint |
| nuanceLlmModel | NUANCE_LLM_MODEL | gpt-5.4-mini | Model name passed to provider |

Current: single optional fetch in nuanceExtractor.ts.  
Planned: replace with ModelRouter supporting Claude, Gemini, Llama adapters.

## Conversational Endpoints

- `POST /api/conversational/intake/process` — classify input, return follow-up questions
- `POST /api/conversational/nuance/respond` — LLM-optional structured nuance extraction
- `POST /api/conversational/guidance/generate` — generate 6-section guidance narrative

## Key Domain Types (src/core/models/index.ts)

- `Domain` — 'insurance' | 'landlordTenant' | 'employment' | 'criminal' | 'civil-negligence' | 'legalMalpractice' | 'consumerProtection' | 'municipalPropertyDamage' | 'ocppFiling' | 'humanRights' | 'other'
- `MatterClassification` — domain, jurisdiction, urgency, notes, tags
- `ForumMap` — primaryForum, alternativeForums, routingRationale
- `EvidenceIndex` — items[], compiledAt, sourceManifest
- `ActionPlan` — acknowledgment, immediateActions, roleExplanation, settlementPathways, whatToAvoid, nextStepOffers
- `DeadlineAlert` — periodId, label, daysRemaining, urgency, message, consequences


---

# Constraints — LEGAL (canadian-legal-assistant)

## Security Rules (OWASP Top 10)

- **No hardcoded secrets** — all credentials via env vars; read from config.ts
- **No PII in logs** — addresses, phone numbers, SIN, DOB, policy/account numbers must be redacted before any log write
- **Validate and sanitize at boundaries** — multer uploads, Express request bodies, query params, all user input
- **Path traversal prevention** — `fs.realpath()` validation on all file paths; sanitize stored filenames before writing
- **XSS mitigation** — DOMPurify + safeText() helper on all user-supplied content rendered in React
- **Rate limiting** — per-IP on upload routes; concurrent read cap on evidence processing
- **Disable X-Powered-By** in Express — already applied in server.ts
- **Snyk scan must pass** before any merge to main

## Source Access Rules

- **CanLII**: API + linking only — no scraping, no full-text reconstruction from metadata
- **e-Laws / Justice Laws**: include currency/retrieval dates on every citation
- **User uploads**: SHA-256 hash on ingest; stored under `./backend/uploads/:matterId/`; deleted with matter
- **Default-deny** for any source access method that is unclear — require explicit permit in SourceAccessController

## Anti-Patterns (Never Do)

- No `console.log` in production — use structured audit logging via AuditLogger
- No synchronous blocking in async contexts — all file I/O, DB, and LLM calls must be awaited
- No silently swallowed errors — every catch must rethrow, log with context, or return a typed error response
- No `any` types in TypeScript unless a comment explains why the exception is necessary
- No uncited legal statements in generated content
- No `git add .` — always stage specific files
- No force-push to main

## UPL Compliance Constraints

- DisclaimerService must be called on every output referencing a legal conclusion
- CitationEnforcer must reject uncited claims before they reach document templates
- Multi-pathway presentation is mandatory — never produce a single "you should do X" directive
- Factual language only in templates: "Under Rule 30.03, parties must produce..." not "You should produce..."

## Operational Limits

- Max upload file size: MAX_FILE_SIZE env var (default 10 MB)
- Accepted mime types: PDF, PNG, JPG, EML, MSG, TXT only
- Data retention default: 60 days; legal hold exceptions supported
- Ontario Small Claims monetary limit: $35,000 (verify against e-Laws before citing)
- OCPP PDF/A requirements: PDF/A-1b or PDF/A-2b, max 20 MB, 8.5x11 pages

## Build Constraints

- Package manager: **npm** (package-lock.json present — do not use yarn or pnpm)
- Root tsconfig.json for core library; tsconfig.json with `rootDir: "../"` for monorepo imports
- Backend must compile with 0 TypeScript errors before any commit
- Frontend: Vite + React; tsconfig.json separate
- Test runner: Vitest (unit), Playwright (E2E at e2e)
- CI: GitHub Actions in ci.yml (unit -> backend -> frontend -> E2E -> Snyk -> quality gate)


---

# Domain Context — Legal / Compliance

## Regulatory Context
- Solicitor-client privilege preservation
- Ontario Law Society guidelines (LSUC)

## Data Handling
- Confidential documents: encrypted storage only
- No third-party API calls with client data
- Immutable audit trails for all document access

---

# Active Goal — Session March 31, 2026

## Project Health

- Unit tests: 558/627 passing (69 failing — all in agent/kit layer from Task 26.7 interface drift)
- E2E tests: 5/5 passing
- Backend build: 0 TypeScript errors
- Security: Snyk clean

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


---

# Decisions Log

<!-- Append-only. Newest entries at top. -->

## 2026-03-31
- (add decisions as they are made)

---

# Learned Rules — LEGAL

<!-- Auto-updated by absorb-learnings.py. Do not edit manually. -->
<!-- Each entry = one distilled rule from a real session correction. -->

<!-- Rules appear here after your first capture + absorb cycle -->

---

