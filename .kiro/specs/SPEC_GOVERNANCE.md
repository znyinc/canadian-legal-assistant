# Spec Governance

This repository has two active spec stacks:

- `canadian-legal-assistant` (canonical product foundation)
- `agentic-conversational-readiness` (conversational orchestration extension)

To prevent drift, use the following rules.

## Canonical Source of Truth

1. Core mission, UPL boundaries, Ontario-first scope, legal-domain coverage, and baseline product behavior are defined in `canadian-legal-assistant`.
2. Conversational orchestration hardening and agentic workflow upgrades are defined in `agentic-conversational-readiness`.
3. If a requirement conflicts across stacks, `canadian-legal-assistant` is authoritative unless an explicit override note is added in both stacks.

## Change Rules

1. Do not duplicate baseline requirements into `agentic-conversational-readiness`.
2. Put extension-only requirements in `agentic-conversational-readiness` and reference baseline behavior instead of restating it.
3. For shared concerns (UPL, auditability, source grounding), update both stacks in the same PR with cross-links.

## Task Governance

1. Baseline feature tasks belong in `canadian-legal-assistant/tasks.md`.
2. Conversational orchestration/model-routing/session-memory tasks belong in `agentic-conversational-readiness/tasks.md`.
3. Cross-stack tasks must include explicit dependency links to the other stack.

## Review Checklist

Before merging spec changes, confirm:

- No duplicated requirement text across stacks unless intentional.
- Conflicts are resolved with explicit override notes.
- Affected tasks are updated in the correct stack.
- Cross-links are present when a change spans both stacks.
