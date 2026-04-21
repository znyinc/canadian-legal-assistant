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
| Security scan | Optional/background | Run on request or separately configured CI |
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
