# Implementation Plan

- [x] 1. Set up project structure and core interfaces
  - ✅ Create directory structure for core services, domain modules, and data access layers
  - ✅ Define TypeScript interfaces for core data models (MatterClassification, ForumMap, EvidenceIndex, etc.)
  - ✅ Configure project dependencies and build system
  - ✅ Set up basic unit testing framework (defer property-based testing setup)
  - _Requirements: 1.1, 1.2, 9.3_

- [x] 2. Implement Authority Registry and Source Access Control
  - [x] 2.1 Create Authority Registry data model and storage
    - ✅ Implement Authority interface with versioning support
    - ✅ Create registry storage with update cadence tracking
    - ✅ Build authority lookup and escalation route methods
    - _Requirements: 4.4, 4.5_

  - [x] 2.2 Implement Source Access Controller
    - ✅ Create access method validation logic
    - ✅ Implement enforcement rules for CanLII, e-Laws, Justice Laws
    - ✅ Build access logging and blocking mechanisms
    - _Requirements: 4.1, 4.2, 4.6, 4.7_

  - [x] 2.3 Populate initial authority registry data (Ontario + key federal)
    - ✅ Add Ontario courts, tribunals, LTB, HRTO, key regulators
    - ✅ Include essential federal authorities (Federal Court, Tax Court)
    - ✅ Set up update cadence and versioning
    - _Requirements: 4.4_

- [ ] 3. Build Evidence Processing System
  - [x] 3.1 Implement evidence ingestion and metadata extraction
    - ✅ Create file format validation for PDF, PNG, JPG, EML, MSG, TXT
    - ✅ Build metadata extraction for each file type (baseline for EML/TXT; minimal for binaries)
    - ✅ Implement automatic PII redaction
    - _Requirements: 5.1, 5.2, 5.7_

  - [x] 3.2 Create evidence indexing and credibility scoring
    - ✅ Build evidence index generation with all required fields
    - ✅ Implement credibility score calculation based on provenance and metadata
    - ✅ Create cryptographic hashing (SHA-256) for integrity verification
    - _Requirements: 5.3, 5.6, 6.3_

  - [x] 3.3 Implement timeline generation and gap detection
    - ✅ Create chronological timeline generation from evidence
    - ✅ Build missing evidence detection logic
    - ✅ Implement screenshot handling with EML/MSG recommendations
    - _Requirements: 5.4, 5.5_
- [x] 3. Build Evidence Processing System

 - [x] 4. Develop Triage Engine and Forum Router
  - ✅ 4.1 Create matter classification system
    - ✅ Implement domain classification logic for supported legal areas
    - ✅ Build parameter collection for jurisdiction, parties, timeline, urgency, dispute amount
    - ✅ Create targeted question generation for incomplete classifications (baseline heuristics)
    - _Requirements: 1.1, 1.2, 1.10_

  - ✅ 4.2 Implement forum routing logic
    - ✅ Create court level determination using claim value, subject matter, relief sought
    - ✅ Build statutory tribunal prioritization logic
    - ✅ Implement appeal vs judicial review distinction
    - ✅ Add venue and location fact collection (baseline via jurisdiction hints)
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - ✅ 4.3 Create time sensitivity assessment
    - ✅ Implement deadline risk flagging based on provided dates
    - ✅ Build uncertainty handling for unverifiable deadlines
    - ✅ Create prompts for limitation and appeal timeline verification
    - _Requirements: 1.7, 1.8_

- [x] 5. Build UPL Compliance System (moved up for MVP)
  - [x] 5.1 Implement disclaimer and boundary enforcement
    - ✅ Create legal information disclaimer generation
    - ✅ Build multi-pathway presentation logic
    - ✅ Implement advice request redirection to options-based guidance
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 5.2 Create citation requirement enforcement
    - ✅ Implement uncited legal statement refusal
    - ✅ Build verification failure handling with next steps
    - ✅ Create factual, restrained language enforcement for documents
    - _Requirements: 7.3, 7.4, 7.6, 7.7_

 [x] 6. Create Template Library and Style Guide
  - ✅ Build standard disclaimer templates
  - ✅ Create tone and language rules for "factual, restrained" style
  - ✅ Implement standard package layout templates
  - ✅ Define consistent document formatting across domains
  - _Requirements: 3.2, 7.6_

 [x] 7. Build Case Law Referencer (MVP: linking + metadata only)
  - ✅ 7.1 Implement CanLII API integration
    - ✅ Create CanLII API client with proper authentication (stubbed interface)
    - ✅ Implement case search and metadata retrieval (stubbed metadata)
    - ✅ Build access method validation to prevent web scraping
    - _Requirements: 2.1, 2.2_

  - ✅ 7.2 Create basic citation formatting
    - ✅ Implement Ontario legislation citation with e-Laws currency dates
    - ✅ Build federal legislation citation with Justice Laws bilingual text
    - ✅ Create link and retrieval instruction generation
    - _Requirements: 2.3, 2.4, 2.6_

  - ✅ 7.3 Implement error handling for case law retrieval
    - ✅ Create graceful failure reporting for failed retrievals
    - ✅ Build "retrieval failure" messaging instead of invented citations
    - _Requirements: 2.7_

- [x] 8. Checkpoint - Ensure all tests pass
  - ✅ Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create Document Generation System
  - [x] 9.1 Build evidence-grounded drafting engine
    - ✅ Implement factual claim grounding in user evidence
    - ✅ Create user confirmation system for factual assertions
    - ✅ Build evidence citation by attachment index and timestamp
    - _Requirements: 3.1, 3.5, 6.2_

  - [x] 9.2 Create document packaging system
    - ✅ Implement standardized folder naming conventions
    - ✅ Build complete package generation with all required components
    - ✅ Create source and evidence manifest generation
    - _Requirements: 3.3, 3.4, 6.1_

- [x] 10. Implement MVP Domain Modules
  - [x] 10.1 Create base domain module interface
    - ✅ Define common interface for all domain modules
    - ✅ Implement domain-specific routing logic framework
    - ✅ Create template generation system
    - _Requirements: 3.2_

  - [x] 10.2 Build insurance domain module
    - ✅ Create internal complaint letter templates
    - ✅ Implement ombudsman letter generation
    - ✅ Build GIO submission and FSRA conduct complaint drafts
    - _Requirements: 8.1_

  - [x] 10.3 Build landlord/tenant domain module
    - ✅ Create LTB intake checklists
    - ✅ Implement notice templates
    - ✅ Build evidence pack generation
    - _Requirements: 8.2_

- [x] 11. Implement Auditability and Data Management
  - [x] 11.1 Create comprehensive audit logging
    - ✅ Implement source manifest generation with URLs, dates, versions
    - ✅ Build evidence manifest creation with hashes and provenance
    - ✅ Create audit logs for all data access, export, deletion activities
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.8_

  - [x] 11.2 Build data lifecycle management
    - ✅ Implement user-initiated export functionality
    - ✅ Create user-initiated deletion with legal hold support
    - ✅ Build configurable retention periods with 60-day default
    - ✅ Implement automatic purging with legal hold exceptions (placeholder via legal hold block)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12. Integration and API Layer
  - [x] 12.1 Create minimal API endpoints
    - ✅ Implement matter intake and triage endpoint
    - ✅ Build evidence upload and processing endpoint
    - ✅ Create document generation and download endpoint
    - ✅ Add export and delete endpoints
    - _Requirements: All requirements integration_

  - [x] 12.2 Build basic error handling and validation
    - ✅ Create request validation and error responses
    - ✅ Implement proper manifest inclusion in all responses
    - ✅ Build one golden-path integration test
    - _Requirements: User interaction requirements_

  - [x] 12.3 Register domain modules and bootstrap shared DomainModuleRegistry
    - ✅ Ensure server bootstrap registers Insurance, LTB and new domain modules and passes shared registry into IntegrationAPI and route handlers
    - ✅ Add tests to validate registry is used by routes rather than relying on test-only registration

- [x] 13. Final Checkpoint - Ensure all tests pass
  - ✅ Ensure all tests pass, ask the user if questions arise.

- [x] 14. Build User Interface
  - [x] 14.1 Create matter intake interface
    - ✅ Built form for legal issue description, province, domain, dispute amount
    - ✅ Integrated automatic classification on matter creation
    - ✅ Display classification results and forum routing
    - _Requirements: 1.1, 1.2, 1.7, 1.8, 1.10_

  - [x] 14.2 Build evidence upload interface
    - ✅ Implemented drag-and-drop file upload (PDF, PNG, JPG, EML, MSG, TXT)
    - ✅ Built evidence list with file metadata and size info
    - ✅ Created timeline visualization from evidence dates
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 14.3 Create forum routing and guidance display
    - ✅ Built forum map display on matter overview tab
    - ✅ Show routing rationale and recommended pathway
    - ✅ Display alternative pathways as list
    - ✅ Legal disclaimer banner on all pages
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 4.5, 7.1, 7.2_

  - [x] 14.4 Build document generation interface
    - ✅ Document generation form with user confirmation
    - ✅ Package listing with generated documents
    - ✅ Download button for packages
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 6.1, 6.2_

  - [x] 14.5 Create case law and citation interface ✅
    - Build case law search interface with CanLII integration
    - Implement citation display with proper source attribution
    - Create links to external sources (no full text reproduction)
    - Add retrieval failure messaging and alternative suggestions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

  - [x] 14.6 Build data management interface ✅
    - Create user data export functionality
    - Implement data deletion interface with legal hold warnings
    - Build audit log viewer for user activities
    - Add retention period configuration and status display
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 14.7 Implement responsive design and accessibility ✅
    - Ensure mobile-responsive design for all interfaces
    - Implement WCAG 2.1 AA accessibility compliance
    - Add keyboard navigation and screen reader support
    - Create clear visual hierarchy and error messaging
    - _Requirements: User experience requirements_

- [ ] 15. Final UI Integration and Testing
  - [x] 15.1 Connect UI to backend APIs (completed)
    - ✅ Overview: Matter overview shows forumMap and "Do I need to go to court?" card (implemented)
    - ✅ Wire evidence upload, document generation and download UIs to final endpoints and loading/error states
    - ✅ Add client-side validation that matches backend validation
    - _Requirements: All UI integration_

  - [x] 15.2 End-to-end user testing
    - ✅ Test complete user journey from matter intake to document download (Playwright test added)
    - ✅ Verify all UPL compliance boundaries are enforced in UI (confirmation modal + disclaimers)
    - ✅ Validate accessibility compliance across all interfaces (tabbing + ARIA checks)
    - ✅ Test responsive design on various screen sizes
    - _Requirements: Complete user experience_

- [ ] 16. Final System Checkpoint
  - Ensure all tests pass and UI is fully functional, ask the user if questions arise.

- [ ] 17. Implement Ontario Legal Navigator Enhancements
  - [x] 17.1 Build Four Pillars Classification System
    - [x] Create pillar classifier for Criminal, Civil, Administrative, and Quasi-Criminal law
    - [x] Implement burden of proof explanations for each pillar
    - [x] Build user-facing pillar explanations with plain language
    - [x] Add pillar-specific process overviews and expectations
    - _Requirements: 11.1_

  - [x] 17.2 Create Journey Tracker with Five-Stage Framework
    - [x] Implement five-stage journey (Understand, Options, Prepare, Act, Resolve) with stage schema and status persistence
    - [x] Build progress tracking UI/logic showing percentage and per-stage checklists + next steps
    - [x] Wire journey tracker to matter data (classification, forum map, evidence state) for auto-updates
    - [x] 17.2.1 Security Hardening & Snyk Remediation (completed)
      - [x] Sanitize React inputs in `CaseLawPage`, `DocumentsPage`, `SettingsPage` (DOM-based XSS) — used `DOMPurify` and `safeText` for displayed content
      - [x] Disable `X-Powered-By` header in `backend/src/server.ts`
      - [x] Normalize and validate file upload paths in `evidence.ts` (prevent path traversal; realpath check)
      - [x] Add rate limiting/throttling to expensive file operations (upload rate limiter + concurrent read cap)
      - [x] Rerun Snyk scan and file remediation artifacts (`docs/SNYK_REMEDIATION_REPORT.md`); created `.snyk` ignores (2025-12-26) and performed dependency upgrades (`multer` → 2.0.2, `archiver` → 7.0.0)
      - [x] Upgrade dependencies: **PR #1 merged** (https://github.com/znyinc/canadian-legal-assistant/pull/1); backend Snyk scan clean
      - _Security: CWE-79, CWE-200, CWE-23, CWE-770_
    - [x] 17.2.2 End-to-End Testing & Validation (completed)
      - [x] Configure Playwright with baseURL/webServer and rerun E2E specs (golden-path refactored; full E2E suite executed)
      - [x] Rerun Vitest suite after security changes (successful — 81/81 tests passing)
      - [x] Verify journey display renders correctly on matter overview (E2E test added: `tests/e2e/journey.spec.ts`)
      - [x] Validate journey state persists across page reloads (E2E test covers reload persistence)
      - [x] PR CI monitoring: PR #2 created for CI testing (https://github.com/znyinc/canadian-legal-assistant/pull/2); checks pending workflow configuration
    - _Requirements: 11.3, 11.5, 11.6; Security: CWE-79, CWE-200, CWE-23, CWE-770_

  - [x] 17.3 Build Plain Language Translation Layer
    - [x] Create comprehensive legal term dictionary with plain language translations
    - [x] Implement inline explanation system with contextual help
    - [x] Build complexity scoring and readability assessment
    - [x] Add "Learn More" expandable sections for deeper understanding
    - _Requirements: 11.2, 11.4_

  - [x] 17.4 Implement Limitation Periods Engine with Ontario Specifics
    - [x] Build comprehensive Ontario limitation periods database
    - [x] Create urgency-based alert system (Critical/Warning/Caution/Info)
    - [x] Implement 10-day municipal notice detection and alerts
    - [x] Add deadline consequence explanations in plain language
    - [x] Build encouraging (not alarming) deadline messaging
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 17.5 Create Cost Calculator and Risk Assessment System
    - [x] Build cost exposure calculator by forum type
    - [x] Implement fee waiver eligibility detection and guidance
    - [x] Create financial risk explanations with plain language
    - [x] Add cost comparison between different legal pathways
    - [x] Build "Can't afford filing fees?" proactive suggestions
    - [x] Create React UI components (CostEstimateCard, FeeWaiverGuidance, FinancialRiskIndicator, PathwayComparison)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_ ✅

  - [x] 17.6 Build Ontario-Specific Domain Modules
    - [x] Create motor vehicle accident module with DC-PD system explanation
    - [x] Add civil negligence / occupiers-liability module (negligent tree failure)
      - [x] Create demand/notice templates
      - [x] Add Small Claims (Form 7A) scaffold and evidence checklist
      - [x] Add municipal notice support (10-day detection)
    - [ ] Add criminal (info-only) module (assault / uttering threats)
      - [ ] Add release-conditions checklist and victim impact scaffold
      - [ ] Add police/crown process guidance (informational only)
    - [ ] Build enhanced LTB module with T1, T2, T6 application guidance
    - [ ] Implement OCPP filing module for Toronto Region with format requirements
    - [ ] Add municipal property damage module with 10-day notice emphasis
    - [ ] Create employment law router (ESA vs wrongful dismissal distinction)
    - [ ] Build tree damage classifier (municipal vs private property)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ] 17.7 Update System with October 2025 Ontario Court Reforms
    - Update Small Claims Court jurisdiction limit from $35,000 to $50,000
    - Implement OCPP validation for Toronto Region filings
    - Add PDF/A format requirements and validation
    - Update all monetary thresholds and court references
    - Validate all limitation periods against current Limitations Act, 2002
    - _Requirements: 14.2, 14.3_

- [ ] 18. Enhanced UPL Compliance with Ontario Legal Navigator Approach
  - [ ] 18.1 Implement empathy-focused boundary enforcement
    - Create "What We CAN Do" vs "What We CANNOT Do" clear explanations
    - Build boundary enforcement examples with user-friendly language
    - Implement advice request detection and redirection to options-based guidance
    - Add "Safe Harbor Over Speed" principle throughout system
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 18.2 Build A2I Sandbox preparation framework
    - Create tiered approach (Public info → Paralegal tools → A2I Sandbox)
    - Implement human-in-the-loop review preparation
    - Build supervised guidance framework for future licensing
    - Add audit trails for potential Law Society oversight
    - _Requirements: UPL compliance and future expansion_

- [ ] 19. Final Ontario Legal Navigator Integration Testing
  - [ ] 19.1 Test complete user journeys with Ontario scenarios
    - Test motor vehicle accident journey with DC-PD routing
    - Validate LTB tenant application complete workflow
    - Test municipal property damage with 10-day notice alerts
    - Verify employment law routing and ESA vs civil distinction
    - _Requirements: Complete user experience validation_

  - [ ] 19.2 Validate Ontario-specific compliance and accuracy
    - Verify all limitation periods against current Ontario law
    - Test OCPP filing requirements and format validation
    - Validate Small Claims Court $50,000 jurisdiction limit
    - Test fee waiver eligibility detection and guidance
    - Ensure all plain language translations are accurate and helpful
    - _Requirements: Ontario legal accuracy and compliance_

- [ ] 20. Final System Validation and Launch Preparation
  - Ensure all Ontario Legal Navigator features are integrated and tested
  - Validate empathy-focused design principles throughout system
  - Test progressive disclosure and anxiety-reduction features
  - Confirm all UPL boundaries are properly enforced
  - Verify complete audit trail and source tracking functionality

---

## Immediate next steps (high priority)
- [x] **17.2.1 Security Hardening & Snyk Remediation** ✅ COMPLETED
  - ✅ Sanitized DOM XSS vulnerabilities (DOMPurify + safeText)
  - ✅ Hardened evidence upload (path normalization, realpath check, sanitized filename, rate limiting)
  - ✅ Disabled `X-Powered-By` header; created `docs/SNYK_REMEDIATION_REPORT.md`
  - ✅ Filed `.snyk` ignore entries (2025-12-26); upgraded `multer` → 2.0.2, `archiver` → 7.0.0
  - ✅ PR #1 merged (dependency upgrades); backend Snyk scan clean
- [x] **17.2.2 Testing & Validation** ✅ COMPLETED
  - ✅ Playwright baseURL/webServer configured; `golden-path` refactored & passing
  - ✅ Vitest rerun after security patches (81/81 tests passing)
  - ✅ Journey tracker E2E test added (`tests/e2e/journey.spec.ts`); reload persistence verified
  - ✅ PR #2 created for CI testing (https://github.com/znyinc/canadian-legal-assistant/pull/2)
  - **Next:** Run full Playwright E2E suite locally; monitor PR CI when workflows configured
- [ ] **17.3 Plain Language Translation Layer** (NEXT PRIORITY)
  - Create legal term dictionary with plain language translations
  - Implement inline explanation system
  - Build complexity scoring and readability assessment
- [ ] **17.4 Limitation Periods Engine**
  - Build Ontario limitation periods database
  - Create urgency-based alert system
  - Implement 10-day municipal notice detection and alerts

---

## Phase 2: Expansion (Deferred)

- [ ]* Additional Domain Modules
  - Employment domain module (demand letters, complaint checklists)
  - Human rights domain module (HRTO checklists, chronology templates)
  - Family, criminal, privacy domain modules
  - Scoped handoff system for out-of-scope matters

- [ ]* Enhanced Case Law Features
  - Case law summary generation with length restrictions
  - Advanced citation formatting
  - Fair-use excerpt limitations

- [ ]* Property-Based Testing Suite
  - Source access enforcement property test
  - UPL compliance boundaries property test
  - Evidence processing completeness property test
  - Timeline generation property test
  - All remaining correctness properties

- [ ]* Advanced Features
  - Multi-domain prioritization logic
  - Enhanced routing nuances
  - Comprehensive integration test suites