# Distribution Loop Deferred Plan (P2)

## Scope Status
This repository defers full distribution-loop instrumentation in the current workflow hardening phase.

## Out of Scope Now
1. Product growth funnels (signup-to-matter conversion tracking).
2. Marketing attribution and campaign-level telemetry.
3. Cohort retention dashboards by acquisition source.
4. Automated prompt/model optimization driven by user conversion outcomes.

## Required Hooks for Future Enablement
1. Conversational funnel milestones:
- intake_started
- intake_clarification_requested
- intake_ready_for_import
- import_completed
- guidance_generated

2. Quality and trust signals:
- fallback_rate_by_route
- review_gate_trigger_rate
- confidence_distribution_by_domain
- correction_or_rephrase_rate

3. Outcome signals:
- document_generation_started/completed
- evidence_upload_started/completed
- user_dropoff_stage

## Telemetry Design Constraints
1. No PII in telemetry payloads.
2. Use stable anonymous session IDs and matter IDs.
3. Keep legal content out of analytics events; log only typed metadata.
4. Respect retention and deletion policies for analytics stores.

## Suggested Event Shape
- eventName: string
- timestamp: ISO string
- sessionId: string
- matterId: string | null
- route: string
- source: fallback | llm
- confidence: number | null
- reviewState: needs-clarification | ready-for-import | needs-human-review | null

## Adoption Plan
1. Add event emitters in conversational intake/guidance routes.
2. Add a backend telemetry adapter interface with no-op default.
3. Add tests for event emission contracts (without external analytics dependency).
4. Wire provider-specific analytics only after privacy review and legal sign-off.
