# Canonical Flow Consolidation Plan

**Status:** Review Draft  
**Date:** April 5, 2026  
**Owner:** Product surface alignment follow-up

## Why This Plan Exists

The current product does not mainly suffer from missing capability. It suffers from **interaction fragmentation**.

The repository now contains several strong but competing UX models:

1. Conversational intake
2. Flowing narrative guidance
3. Action-first matter overview
4. Step-by-step workflow engine
5. Nuance extraction workspace
6. Decision-support kits

Each of these was directionally valid. The problem is that they were added serially without a final consolidation pass. The result is a product that explains well, classifies well, and generates well, but does not yet move the user through a single dominant experience from uncertainty to action.

## Core Diagnosis

### 1. The intake promise breaks at the first handoff

The user is told they are ready to "explore options," but the current `/matters/new` flow creates a matter and redirects straight into the workspace instead of completing the promised guided guidance stage.

**Impact:** The user experiences a discontinuity between the emotional promise of the intake and the flatter workspace that follows.

### 2. Strong surfaces exist but are not canonical

The repo contains valuable surfaces such as `GuidanceNarrative`, `OverviewTab`, `NuanceChatPage`, and kit UI components, but they are not all wired into one continuous journey.

**Impact:** Interaction quality is diluted by unused, bypassed, or parallel surfaces.

### 3. The workspace is still summary-first rather than progression-first

The matter detail experience currently asks the user to choose among Overview, Evidence, Documents, Workflow, and Settings, rather than carrying them through one ordered path with one primary next action at a time.

**Impact:** The product feels informative but static.

### 4. Multiple product truths now coexist

The repo simultaneously describes the product as:

- conversational
- narrative
- action-first
- workflow-driven
- kit-driven
- strategic briefing-driven

**Impact:** New work adds more surfaces instead of increasing momentum inside one surface.

## Product Decision

The app should adopt one canonical user spine:

1. **Conversational intake** to understand the matter
2. **Immediate guided handoff** into a persistent matter workspace
3. **Action-first overview** that names the situation, urgency, and next move
4. **Step-by-step plan** as the operational backbone for doing the work
5. **Evidence strategy** and **document generation** as embedded execution steps
6. **Trust, audit, export, and governance** as contextual supports, not competing destinations

This means the product should behave less like a tool shelf and more like a guided case conductor.

## Canonical Flow

### Phase A: Intake

- User enters through `/matters/new`
- System asks adaptive conversational questions
- System captures evidence and unresolved signals
- System determines whether the matter is ready for import or needs clarification

### Phase B: Guided Handoff

- When the intake reaches sufficient confidence, the system creates the matter
- The user is not dropped into a generic summary
- The user lands in a **first-run guided overview** that preserves the conversational context
- The first screen must answer:
  - What is this matter?
  - What is urgent?
  - What should I do next?
  - What can the app do for me right now?

### Phase C: Guided Execution

- The step-by-step plan becomes the operational center
- Evidence, research, and documents are entered from the plan and reflected back into it
- The plan owns progress, readiness, and escalation

### Phase D: Packaging and Governance

- Document packages, export, audit, and data controls remain available
- They appear as supporting trust functions, not as primary product modes

## Keep, Integrate, Retire

### Keep as core

- `ConversationalIntake`
- persistent matter creation and workspace model
- `WorkflowPage` and workflow backend
- evidence strategy page and timeline logic
- document generation and package download system
- trust and governance surfacing
- `OverviewTab` action-first structure as the preferred overview model

### Integrate into the canonical path

- `GuidanceNarrative`
  - Use as the first-run handoff experience inside the matter workspace or immediately before the workspace settles into normal mode
- `NuanceChatPage`
  - Re-home as an optional "deepen this intake" branch from intake or first-run review, not as a separate product island
- strategic briefing output
  - Reframe as supporting context for review, not a parallel destination
- kit concepts
  - Re-home as guided accelerators inside the step-by-step plan where appropriate

### Retire or demote from primary status

- `AdvisorResponseView` as the main matter overview renderer
- disconnected explanation-heavy overview patterns that do not advance the user
- any top-level experience that duplicates workflow ownership
- any UI that creates a new interaction model without becoming the primary one

## Implementation Plan

### 38.1 Define surface ownership and remove ambiguity

**Goal:** Assign one owner to each major step in the user journey.

**Actions:**

- Define the canonical route map for intake, first-run matter view, ongoing matter view, workflow, evidence, and documents
- Declare which component owns first-run guidance
- Declare which component owns ongoing overview
- Declare which features are supporting surfaces rather than primary surfaces

**Acceptance criteria:**

- Every user-facing route has one clear product purpose
- There is no duplicate "main overview" concept

### 38.2 Replace the current matter overview renderer

**Goal:** Make the matter workspace action-first by default.

**Actions:**

- Replace `AdvisorResponseView` as the default overview renderer
- Promote `OverviewTab` concepts into the actual matter detail experience
- Preserve plain-language explanation, deadlines, options, and document actions
- Keep supporting information collapsed by default

**Acceptance criteria:**

- The overview foregrounds urgency, next actions, and pathway choice
- The user can understand what to do next without opening another tab

### 38.3 Restore the missing guided handoff

**Goal:** Deliver the experience the intake currently promises.

**Actions:**

- Add a first-run handoff state after intake completion
- Carry conversation summary, urgency, likely route, and unresolved questions into the matter workspace
- Render `GuidanceNarrative` or an equivalent first-run guidance module before normal overview mode
- Ensure this guidance can directly launch workflow, evidence, or document actions

**Acceptance criteria:**

- "See my options" results in an actual guided options experience
- The emotional and informational tone of intake carries into the workspace

### 38.4 Fold nuance extraction into intake instead of leaving it orphaned

**Goal:** Keep the strongest deepening behavior available without splitting the product.

**Actions:**

- Route nuance extraction from intake as an optional "clarify this before import" mode
- Preserve `NuanceChatPage` capabilities, but stop treating it as a standalone island
- Ensure import back into intake or matter creation is seamless and actually wired

**Acceptance criteria:**

- The user can deepen ambiguous matters without leaving the canonical flow
- There is no dead-end specialist workspace in the main experience

### 38.5 Re-home kit functionality under workflow ownership

**Goal:** Stop maintaining kits as a parallel product architecture.

**Actions:**

- Audit each existing kit for unique value versus workflow duplication
- Convert useful kit logic into plan accelerators, templates, or workflow steps
- Remove or demote UI that implies a separate primary product mode

**Acceptance criteria:**

- Kits no longer compete with workflow as the execution model
- Any retained kit functionality appears where the user already is

### 38.6 Tighten navigation around progression

**Goal:** Reduce the feeling of a tool shelf.

**Actions:**

- Make one primary next action visible on matter pages
- Reorder tabs and calls to action based on likely user sequence
- Use evidence and documents as execution destinations, not sibling abstractions
- Keep trust and settings available but visually secondary

**Acceptance criteria:**

- Users are guided forward instead of browsing for what matters
- The main matter flow feels sequential even when tabs remain available

### 38.7 Add review instrumentation for consolidation success

**Goal:** Make the next iteration measurable.

**Actions:**

- Instrument intake completion, handoff completion, workflow start, evidence upload after intake, and document generation after handoff
- Measure drop-off between intake completion and first meaningful action
- Track whether users reach workflow or evidence strategy from the first-run workspace

**Acceptance criteria:**

- Product review can evaluate the new flow using behavior, not intuition alone

## Sequence Recommendation

Implementation should proceed in this order:

1. `38.1` surface ownership
2. `38.2` replace main overview renderer
3. `38.3` restore guided handoff
4. `38.4` fold nuance extraction into intake
5. `38.5` re-home kits
6. `38.6` tighten navigation
7. `38.7` instrument review signals

This order keeps the main user spine stable before touching peripheral surfaces.

## Review Questions

This plan should be reviewed against the following decisions:

1. Should `OverviewTab` become the canonical matter overview base?
2. Should `GuidanceNarrative` be restored as a first-run matter handoff?
3. Should `NuanceChatPage` be folded into intake rather than routed independently?
4. Should kit UI remain visible as a primary concept, or be absorbed into workflow?
5. Is the product willing to deprecate `AdvisorResponseView` as the primary overview surface?

## Definition of Done

This consolidation work is complete when:

- the app has one dominant intake-to-action journey
- the first-run handoff feels continuous rather than abrupt
- the matter overview is action-first by default
- workflow owns execution
- evidence and documents reinforce the workflow instead of competing with it
- orphaned interaction models are removed, merged, or clearly demoted

## Proposed Next Step

Approve or revise this plan before implementation starts. Once approved, implementation should begin with `38.1` and `38.2` together, because surface ownership and overview replacement are the minimum changes needed to make the product feel materially different.
