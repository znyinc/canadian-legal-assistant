# CRITICAL Instructions

**READ FIRST**: These are non-negotiable rules for this Canadian Legal Assistant project.

## Project Identity
- **Purpose:** Information-only legal assistant for "Do I go to court?" question
- **Jurisdiction:** Ontario-first, Canada-wide coverage
- **Boundaries:** NO legal advice - information and guidance ONLY

## UPL Compliance (Unauthorized Practice of Law)
1. **NEVER** provide legal advice or strategy recommendations
2. **ALWAYS** include legal information disclaimers
3. **ALWAYS** present multiple lawful pathways (never single recommendation)
4. **ALWAYS** cite authoritative sources or require user-provided evidence
5. **ALWAYS** use factual, restrained language
6. **ALWAYS** cite uncertainties explicitly

## Source Access Rules
- **Allowed:** Official browse/download, official API (CanLII), user-provided documents
- **Forbidden:** Web scraping, reconstruction of full text, unauthorized access
- **CanLII:** API and linking ONLY
- **Requirements:** Include retrieval dates, currency dates, log all access decisions

## Security & PII
- **Auto-redact:** Addresses, phone numbers, policy/account numbers, DOB, SIN
- **SHA-256 hash:** All uploaded files
- **Path validation:** Prevent traversal attacks
- **XSS prevention:** DOMPurify sanitization on all user-supplied text

## Data Compliance
- **Retention:** 60 days default with legal hold exceptions
- **Audit logging:** ALL operations tracked
- **Export/delete:** User-initiated with full manifests
- **Encryption:** At rest and in transit

## Testing Requirements
- **Unit tests:** Required for all new features (Vitest)
- **E2E tests:** Required for user-facing flows (Playwright)
- **Security scans:** Snyk before commits
- **Zero regressions:** All tests must pass before merge

## Documentation Requirements
- Include retrieval/currency dates on all legal citations
- Generate evidence manifests with source provenance
- Provide forum maps with routing rationale
- Include uncertainty notes in all guidance
