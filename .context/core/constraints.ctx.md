# Constraints — LEGAL (canadian-legal-assistant)

## Security Rules (OWASP Top 10)

- **No hardcoded secrets** — all credentials via env vars; read from config.ts
- **No PII in logs** — addresses, phone numbers, SIN, DOB, policy/account numbers must be redacted before any log write
- **Validate and sanitize at boundaries** — multer uploads, Express request bodies, query params, all user input
- **Path traversal prevention** — `fs.realpath()` validation on all file paths; sanitize stored filenames before writing
- **XSS mitigation** — DOMPurify + safeText() helper on all user-supplied content rendered in React
- **Rate limiting** — per-IP on upload routes; concurrent read cap on evidence processing
- **Disable X-Powered-By** in Express — already applied in server.ts
- Security scanning is optional and may be run on request

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
- CI: GitHub Actions in ci.yml (unit -> backend -> frontend -> E2E -> quality gate)
