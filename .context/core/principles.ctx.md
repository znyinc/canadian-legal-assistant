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
