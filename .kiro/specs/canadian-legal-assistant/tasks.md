# Implementation Plan - Canadian Legal Assistant

## File Overview
This document tracks the implementation of the Canadian Legal Assistant, a comprehensive legal information system for Ontario and Canada. Tasks are organized sequentially (1-32) covering core functionality, domain modules, and technical enhancements. Cloud/scaling features (PWA, internationalization, accessibility) are grouped at the end (Tasks 33-36).

All requirements reference the original specification document in `.kiro/specs/canadian-legal-assistant/requirements.md`.

---

## Phase 1: Core System (Tasks 1-12)

- [x] 1. Set up project structure and core interfaces
  - ✅ Create directory structure for core services, domain modules, and data access layers
  - ✅ Define TypeScript interfaces for core data models (MatterClassification, ForumMap, EvidenceIndex, etc.)
  - ✅ Configure project dependencies and build system
  - ✅ Set up basic unit testing framework

- [x] 2. Implement Authority Registry and Source Access Control
  - [x] 2.1 Create Authority Registry data model and storage
    - ✅ Implement Authority interface with versioning support
    - ✅ Create registry storage with update cadence tracking
    - ✅ Build authority lookup and escalation route methods

  - [x] 2.2 Implement Source Access Controller
    - ✅ Create access method validation logic
    - ✅ Implement enforcement rules for CanLII, e-Laws, Justice Laws
    - ✅ Build access logging and blocking mechanisms

  - [x] 2.3 Populate initial authority registry data (Ontario + key federal)
    - ✅ Add Ontario courts, tribunals, LTB, HRTO, key regulators
    - ✅ Include essential federal authorities (Federal Court, Tax Court)
    - ✅ Set up update cadence and versioning

- [x] 3. Build Evidence Processing System
  - [x] 3.1 Implement evidence ingestion and metadata extraction
    - ✅ Create file format validation for PDF, PNG, JPG, EML, MSG, TXT
    - ✅ Build metadata extraction for each file type (baseline for EML/TXT; minimal for binaries)
    - ✅ Implement automatic PII redaction

  - [x] 3.2 Create evidence indexing and credibility scoring
    - ✅ Build evidence index generation with all required fields
    - ✅ Implement credibility score calculation based on provenance and metadata
    - ✅ Create cryptographic hashing (SHA-256) for integrity verification

  - [x] 3.3 Implement timeline generation and gap detection
    - ✅ Create chronological timeline generation from evidence
    - ✅ Build missing evidence detection logic
    - ✅ Implement screenshot handling with EML/MSG recommendations

- [x] 4. Develop Triage Engine and Forum Router
  - [x] 4.1 Create matter classification system
    - ✅ Implement domain classification logic for supported legal areas
    - ✅ Build parameter collection for jurisdiction, parties, timeline, urgency, dispute amount
    - ✅ Create targeted question generation for incomplete classifications

  - [x] 4.2 Implement forum routing logic
    - ✅ Create court level determination using claim value, subject matter, relief sought
    - ✅ Build statutory tribunal prioritization logic
    - ✅ Implement appeal vs judicial review distinction
    - ✅ Add venue and location fact collection

  - [x] 4.3 Create time sensitivity assessment
    - ✅ Implement deadline risk flagging based on provided dates
    - ✅ Build uncertainty handling for unverifiable deadlines
    - ✅ Create prompts for limitation and appeal timeline verification

- [x] 5. Build UPL Compliance System
  - [x] 5.1 Implement disclaimer and boundary enforcement
    - ✅ Create legal information disclaimer generation
    - ✅ Build multi-pathway presentation logic
    - ✅ Implement advice request redirection to options-based guidance

  - [x] 5.2 Create citation requirement enforcement
    - ✅ Implement uncited legal statement refusal
    - ✅ Build verification failure handling with next steps
    - ✅ Create factual, restrained language enforcement for documents

- [x] 6. Create Template Library and Style Guide
  - ✅ Build standard disclaimer templates
  - ✅ Create tone and language rules for "factual, restrained" style
  - ✅ Implement standard package layout templates
  - ✅ Define consistent document formatting across domains

- [x] 7. Build Case Law Referencer
  - [x] 7.1 Implement CanLII API integration
    - ✅ Create CanLII API client with proper authentication
    - ✅ Implement case search and metadata retrieval
    - ✅ Build access method validation to prevent web scraping

  - [x] 7.2 Create basic citation formatting
    - ✅ Implement Ontario legislation citation with e-Laws currency dates
    - ✅ Build federal legislation citation with Justice Laws bilingual text
    - ✅ Create link and retrieval instruction generation

  - [x] 7.3 Implement error handling for case law retrieval
    - ✅ Create graceful failure reporting for failed retrievals
    - ✅ Build "retrieval failure" messaging instead of invented citations

- [x] 8. Checkpoint - Ensure all tests pass
  - ✅ All tests passing

- [x] 9. Create Document Generation System
  - [x] 9.1 Build evidence-grounded drafting engine
    - ✅ Implement factual claim grounding in user evidence
    - ✅ Create user confirmation system for factual assertions
    - ✅ Build evidence citation by attachment index and timestamp

  - [x] 9.2 Create document packaging system
    - ✅ Implement standardized folder naming conventions
    - ✅ Build complete package generation with all required components
    - ✅ Create source and evidence manifest generation

- [x] 10. Implement MVP Domain Modules
  - [x] 10.1 Create base domain module interface
    - ✅ Define common interface for all domain modules
    - ✅ Implement domain-specific routing logic framework
    - ✅ Create template generation system

  - [x] 10.2 Build insurance domain module
    - ✅ Create internal complaint letter templates
    - ✅ Implement ombudsman letter generation
    - ✅ Build GIO submission and FSRA conduct complaint drafts

  - [x] 10.3 Build landlord/tenant domain module
    - ✅ Create LTB intake checklists
    - ✅ Implement notice templates
    - ✅ Build evidence pack generation

- [x] 11. Implement Auditability and Data Management
  - [x] 11.1 Create comprehensive audit logging
    - ✅ Implement source manifest generation with URLs, dates, versions
    - ✅ Build evidence manifest creation with hashes and provenance
    - ✅ Create audit logs for all data access, export, deletion activities

  - [x] 11.2 Build data lifecycle management
    - ✅ Implement user-initiated export functionality
    - ✅ Create user-initiated deletion with legal hold support
    - ✅ Build configurable retention periods with 60-day default
    - ✅ Implement automatic purging with legal hold exceptions

- [x] 12. Integration and API Layer
  - [x] 12.1 Create minimal API endpoints
    - ✅ Implement matter intake and triage endpoint
    - ✅ Build evidence upload and processing endpoint
    - ✅ Create document generation and download endpoint
    - ✅ Add export and delete endpoints

  - [x] 12.2 Build basic error handling and validation
    - ✅ Create request validation and error responses
    - ✅ Implement proper manifest inclusion in all responses
    - ✅ Build one golden-path integration test

  - [x] 12.3 Register domain modules and bootstrap shared DomainModuleRegistry
    - ✅ Ensure server bootstrap registers all domain modules

---

## Phase 2: User Interface and Ontario Navigation (Tasks 13-25)

- [x] 13. Final Checkpoint - Ensure all tests pass
  - ✅ All tests passing

- [x] 14. Build User Interface
  - [x] 14.1 Create matter intake interface
    - ✅ Built form for legal issue description, province, domain, dispute amount
    - ✅ Integrated automatic classification on matter creation
    - ✅ Display classification results and forum routing

  - [x] 14.2 Build evidence upload interface
    - ✅ Implemented drag-and-drop file upload (PDF, PNG, JPG, EML, MSG, TXT)
    - ✅ Built evidence list with file metadata and size info
    - ✅ Created timeline visualization from evidence dates

  - [x] 14.3 Create forum routing and guidance display
    - ✅ Built forum map display on matter overview tab
    - ✅ Show routing rationale and recommended pathway
    - ✅ Display alternative pathways as list
    - ✅ Legal disclaimer banner on all pages

  - [x] 14.4 Build document generation interface
    - ✅ Document generation form with user confirmation
    - ✅ Package listing with generated documents
    - ✅ Download button for packages

  - [x] 14.5 Create case law and citation interface
    - ✅ Build case law search interface with CanLII integration
    - ✅ Implement citation display with proper source attribution
    - ✅ Create links to external sources
    - ✅ Add retrieval failure messaging and alternative suggestions

  - [x] 14.6 Build data management interface
    - ✅ Create user data export functionality
    - ✅ Implement data deletion interface with legal hold warnings
    - ✅ Build audit log viewer for user activities
    - ✅ Add retention period configuration and status display

  - [x] 14.7 Implement responsive design and accessibility
    - ✅ Ensure mobile-responsive design for all interfaces
    - ✅ Implement WCAG 2.1 AA accessibility compliance
    - ✅ Add keyboard navigation and screen reader support
    - ✅ Create clear visual hierarchy and error messaging

- [x] 15. Final UI Integration and Testing
  - [x] 15.1 Connect UI to backend APIs
    - ✅ Overview: Matter overview shows forumMap and "Do I need to go to court?" card
    - ✅ Wire evidence upload, document generation and download UIs to final endpoints
    - ✅ Add client-side validation that matches backend validation

  - [x] 15.2 End-to-end user testing
    - ✅ Test complete user journey from matter intake to document download
    - ✅ Verify all UPL compliance boundaries are enforced in UI
    - ✅ Validate accessibility compliance across all interfaces
    - ✅ Test responsive design on various screen sizes

- [x] 16. Final System Checkpoint
  - ✅ All tests passing

- [x] 17. Implement Ontario Legal Navigator Enhancements
  - [x] 17.1 Build Four Pillars Classification System
    - ✅ Create pillar classifier for Criminal, Civil, Administrative, and Quasi-Criminal law
    - ✅ Implement burden of proof explanations for each pillar
    - ✅ Build user-facing pillar explanations with plain language
    - ✅ Add pillar-specific process overviews and expectations

  - [x] 17.2 Create Journey Tracker with Five-Stage Framework
    - [x] 17.2.1 Implement five-stage journey
      - ✅ Implement stage schema and status persistence
      - ✅ Build progress tracking UI/logic with percentage and per-stage checklists
      - ✅ Wire journey tracker to matter data for auto-updates

    - [x] 17.2.2 Security Hardening & Snyk Remediation
      - ✅ Sanitize React inputs (DOM-based XSS)
      - ✅ Disable X-Powered-By header in backend
      - ✅ Normalize and validate file upload paths
      - ✅ Add rate limiting/throttling to expensive file operations
      - ✅ Rerun Snyk scan and file remediation artifacts
      - ✅ Upgrade dependencies: multer → 2.0.2, archiver → 7.0.0

    - [x] 17.2.3 End-to-End Testing & Validation
      - ✅ Configure Playwright with baseURL/webServer
      - ✅ Rerun Vitest suite after security changes
      - ✅ Verify journey display renders correctly on matter overview
      - ✅ Validate journey state persists across page reloads

    - [x] 17.2.4 CI/CD Pipeline Validation and E2E Testing
      - ✅ Debug GitHub Actions E2E test failures (identified port mismatch, fixed)
      - ✅ Investigate and resolve pillar detection tests
      - ✅ Monitor CI workflow and merge when all tests pass

  - [x] 17.3 Build Plain Language Translation Layer
    - ✅ Create comprehensive legal term dictionary with plain language translations
    - ✅ Implement inline explanation system with contextual help
    - ✅ Build complexity scoring and readability assessment
    - ✅ Add "Learn More" expandable sections for deeper understanding

  - [x] 17.4 Implement Limitation Periods Engine with Ontario Specifics
    - ✅ Build comprehensive Ontario limitation periods database
    - ✅ Create urgency-based alert system (Critical/Warning/Caution/Info)
    - ✅ Implement 10-day municipal notice detection and alerts
    - ✅ Add deadline consequence explanations in plain language
    - ✅ Build encouraging deadline messaging

  - [x] 17.5 Create Cost Calculator and Risk Assessment System
    - ✅ Build cost exposure calculator by forum type
    - ✅ Implement fee waiver eligibility detection and guidance
    - ✅ Create financial risk explanations with plain language
    - ✅ Add cost comparison between different legal pathways
    - ✅ Build "Can't afford filing fees?" proactive suggestions
    - ✅ Create React UI components

  - [x] 17.6 Build Ontario-Specific Domain Modules
    - [x] 17.6.1 Create motor vehicle accident module
    - [x] 17.6.2 Add civil negligence / occupiers-liability module
      - ✅ Create demand/notice templates
      - ✅ Add Small Claims (Form 7A) scaffold and evidence checklist
      - ✅ Add municipal notice support

    - [x] 17.6.3 Add criminal (info-only) module
      - ✅ Add release-conditions checklist and victim impact scaffold
      - ✅ Add police/crown process guidance
      - ✅ Registered with DomainModuleRegistry

    - [x] 17.6.4 Create employment law router
      - ✅ Router logic with multi-pathway presentation
      - ✅ MOL complaint vs Small Claims vs Superior Court routing

    - [x] 17.6.5 Build tree damage classifier
      - ✅ Ownership detection and liability routing
      - ✅ Municipal notice detection and enforcement

    - [x] 17.6.6 Implement OCPP filing module
      - ✅ Format validation (PDF/A, 8.5x11, max 20MB)
      - ✅ Naming convention enforcement

    - [x] 17.6.7 Add municipal property damage module
      - ✅ 10-day notice detection and critical alerts
      - ✅ Municipal procedure guidance with escalation pathways

    - [x] 17.6.8 Build enhanced LTB module
      - ✅ Enhanced T1, T2, T6 application guidance
      - ✅ Form-specific evidence checklists and service requirements

  - [x] 17.7 Update System with October 2025 Ontario Court Reforms
    - [x] 17.7.1 Update Small Claims Court jurisdiction limit to $50,000
      - ✅ Updated all threshold references
      - ✅ All tests passing
      - ✅ Snyk code scan clean

    - [x] 17.7.2 Implement OCPP validation for Toronto Region filings
      - ✅ Created OCPPValidator class
      - ✅ Integrated OCPPValidator into IntegrationAPI
      - ✅ Added ocppWarnings and ocppValidation fields

    - [x] 17.7.3 Add PDF/A format requirements and validation
      - ✅ Enhanced DocumentPackager with PDF/A format detection
      - ✅ Added requiresPDFAFormat() method
      - ✅ Created comprehensive PDF_A_CONVERSION_GUIDE.md

    - [x] 17.7.4 Integrate limitation validation into API responses
      - ✅ Added LimitationPeriodsEngine to IntegrationAPI
      - ✅ Extended IntakeRequest with description, province, tags
      - ✅ Added deadlineAlerts field to IntakeResponse

- [x] 18. Enhanced UPL Compliance with Ontario Legal Navigator Approach
  - [x] 18.1 Implement empathy-focused boundary enforcement
    - ✅ Created "What We CAN Do" vs "What We CANNOT Do" explanations
    - ✅ Added advice request detection and redirection to options-based guidance
    - ✅ Implemented empathy-focused boundary UI

  - [x] 18.2 Build A2I Sandbox preparation framework
    - ✅ Added tiered approach (Public info → Paralegal-supervised → A2I Sandbox)
    - ✅ Implemented human-in-the-loop prompts and audit trail guidance
    - ✅ Surfaced sandbox plan in UI for oversight readiness

- [x] 19. Final Ontario Legal Navigator Integration Testing
  - [x] 19.1 Test complete user journeys with Ontario scenarios
    - ✅ Backend journey runs executed for four scenarios
    - ✅ Frontend E2E: 5/5 passing
    - ✅ Routing refined: Ontario ≤ $50,000 routes to Small Claims
    - ✅ Test motor vehicle accident journey with DC-PD routing
    - ✅ Validate LTB tenant application complete workflow
    - ✅ Test municipal property damage with 10-day notice alerts
    - ✅ Verify employment law routing and ESA vs civil distinction

  - [x] 19.2 Validate Ontario-specific compliance and accuracy
    - ✅ Verify all limitation periods against current Ontario law
    - ✅ Test OCPP filing requirements and format validation
    - ✅ Validate Small Claims Court $50,000 jurisdiction limit
    - ✅ Test fee waiver eligibility detection and guidance
    - ✅ Ensure all plain language translations are accurate and helpful
    - ✅ Test Suite Summary: 270/270 tests passing
    - ✅ Security: Zero Snyk high-severity issues

- [x] 20. Final System Validation and Launch Preparation
  - [x] 20.1 Ensure all Ontario Legal Navigator features are integrated and tested
    - ✅ Unit tests: 270/270 passing
    - ✅ E2E tests: 5/5 passing
    - ✅ Four Pillars Classification complete
    - ✅ Journey Tracker with persistence across reloads
    - ✅ All domain modules registered and tested
    - ✅ Ontario scenario testing complete

  - [x] 20.2 Validate empathy-focused design principles
    - ✅ DisclaimerService implementation
    - ✅ Advice request detection and redirection
    - ✅ Encouraging deadline messaging
    - ✅ Plain language throughout system
    - ✅ Progressive disclosure across all features

  - [x] 20.3 Test progressive disclosure and anxiety-reduction features
    - ✅ Matter intake: Simple initial form
    - ✅ Evidence upload: Drag-drop with file validation
    - ✅ Deadline alerts: Color-coded urgency
    - ✅ Document generation: Domain module selection
    - ✅ Journey tracker: Visualizes progress
    - ✅ Cost estimates: Fee waiver proactive offers

  - [x] 20.4 Confirm all UPL boundaries are properly enforced
    - ✅ Intake disclaimer implementation
    - ✅ Advice detection and redirection
    - ✅ Citation enforcement
    - ✅ Domain module validation
    - ✅ StyleGuide enforcement
    - ✅ Multi-pathway presentation
    - ✅ Safe Harbor principle throughout

  - [x] 20.5 Verify complete audit trail and source tracking functionality
    - ✅ AuditLogger implementation
    - ✅ Audit event types coverage
    - ✅ ManifestBuilder implementation
    - ✅ Source tracking with provenance
    - ✅ Integrity verification with SHA-256
    - ✅ Export functionality
    - ✅ Deletion with legal hold protection
    - ✅ Frontend audit viewer

  - [x] 20.6 Final Test Summary
    - ✅ Unit tests: 270/270 passing
    - ✅ E2E tests: 5/5 passing
    - ✅ Security: 0 high-severity Snyk issues
    - ✅ Backend build: 0 TypeScript errors
    - ✅ Dependencies: multer 2.0.2, archiver 7.0.0

  - [x] 20.7 Ontario Legal Navigator Complete
    - ✅ Four Pillars classification system
    - ✅ Five-stage journey tracker
    - ✅ Plain language translation layer
    - ✅ Limitation periods engine
    - ✅ Cost calculator and fee waiver
    - ✅ October 2025 Ontario Court Reforms
    - ✅ Comprehensive domain modules
    - ✅ UPL compliance and empathy-focused design
    - ✅ Complete audit trail and source tracking
    - ✅ System Status: READY FOR PRODUCTION

- [x] 21. Implement Action-First User Experience Restructure
  - [x] 21.1 Create Action Plan Generator
    - ✅ Build ActionPlanGenerator class
    - ✅ Implement empathetic acknowledgment messaging
    - ✅ Create role clarification logic
    - ✅ Add settlement pathway identification
    - ✅ Build "what to avoid" guidance generation

  - [x] 21.2 Restructure Frontend Overview Display
    - ✅ Created AcknowledgmentBanner component
    - ✅ Built ImmediateActionsCard component
    - ✅ Implemented YourRoleExplainer component
    - ✅ Added SettlementPathwayCard component
    - ✅ Created WhatToAvoidSection component
    - ✅ Built NextStepsOffer component

  - [x] 21.3 Reorder OverviewTab Layout
    - ✅ Integrated ActionPlanGenerator into IntegrationAPI
    - ✅ Action plans generated server-side
    - ✅ Restructured OverviewTab to action-first layout
    - ✅ Component reads classification.actionPlan from server

  - [x] 21.4 Frontend Action Plan Integration & Testing
    - [x] 21.4.1 Environment Stabilization
      - ✅ Fixed React monorepo setup
      - ✅ Created frontend/vitest.config.ts
      - ✅ Created frontend/tests/setup.ts
      - ✅ Moved component tests to frontend/tests/
      - ✅ All 5 frontend tests passing

    - [x] 21.4.2 E2E Testing
      - ✅ Created action-plan.spec.ts E2E test
      - ✅ All 4 scenarios passing
      - ✅ Verified empathetic acknowledgment rendering
      - ✅ Confirmed settlement pathways render correctly

    - [x] 21.4.3 Full Integration Validation
      - ✅ Started dev servers (backend 3001, frontend 5173)
      - ✅ Verified all 6 components render with server-generated data
      - ✅ Tested responsive design at all breakpoints
      - ✅ Validated keyboard navigation and screen reader support

- [x] 22. Enhance Civil Domain with Settlement Focus
  - [x] 22.1 Add Demand Letter Templates and Guidance
    - ✅ Create demand letter templates for property damage
    - ✅ Add "Send Demand Letter First" as Step 1
    - ✅ Build demand letter generation with evidence grounding

  - [x] 22.2 Implement "Anticipate the Defense" Guidance
    - ✅ Add defense anticipation sections
    - ✅ Create "Settlement Is Common" messaging
    - ✅ Add insurance subrogation option mentions

  - [x] 22.3 Expand Civil Negligence Domain Module
    - ✅ Add arborist report guidance
    - ✅ Create contractor estimate collection guidance
    - ✅ Build evidence-specific checklists

- [x] 23. Create Consumer Protection Domain Module
  - [x] 23.1 Build Consumer Domain Module
    - ✅ Create ConsumerDomainModule
    - ✅ Add chargeback option mentions
    - ✅ Build service dispute templates

  - [x] 23.2 Enhance Classification for Consumer Issues
    - ✅ Improve PillarClassifier for consumer keywords
    - ✅ Add consumer rights explanations
    - ✅ Create unfair practice identification

- [x] 24. Create Legal Malpractice Domain Module
  - [x] 24.1 Build Legal Malpractice Domain Module
    - ✅ Create LegalMalpracticeDomainModule
    - ✅ Prioritize malpractice keyword detection
    - ✅ Generate 5 Ontario-specific documents

  - [x] 24.2 Implement Case-Within-Case Doctrine
    - ✅ Add 4-element framework
    - ✅ Create expert witness qualification requirements
    - ✅ Implement 2-year limitation from discovery

  - [x] 24.3 Integrate LawPRO Guidance
    - ✅ Add LawPRO mandatory reporting obligations
    - ✅ Include LawPRO phone and policy information
    - ✅ Build claims-made coverage explanation

- [x] 25. Create Estate & Succession Law Domain Module
  - [x] 25.1 Build Estate & Succession Law Domain Module
    - ✅ Create EstateSuccessionDomainModule
    - ✅ Add estateSuccession to Domain type union
    - ✅ Enhance MatterClassifier with estate keywords
    - ✅ Add ForumRouter estate routing

  - [x] 25.2 Implement Will Challenge Procedures
    - ✅ Create will challenge grounds template
    - ✅ Build suspicious circumstances detection
    - ✅ Add evidence checklist

  - [x] 25.3 Build Probate Application Guidance
    - ✅ Create Certificate of Appointment guidance
    - ✅ Build document checklist
    - ✅ Add asset valuation tips

  - [x] 25.4 Implement Dependant Support Claim Analysis
    - ✅ Build Part V Succession Law Reform Act procedure
    - ✅ Add 6-month deadline alert
    - ✅ Create evidence checklist

  - [x] 25.5 Wire Estate Domain to Backend
    - ✅ Added ON-SC-Probate authority
    - ✅ Registered EstateSuccessionDomainModule
    - ✅ Wired estate domain to LimitationPeriodsEngine
    - ✅ Full test suite: 382/382 passing
    - ✅ Snyk code scan: 0 new issues

---

## Phase 3: Agentic AI Enhancement & Domain Module Expansion (Tasks 26-33)

- [x] 26. Implement Agentic AI Decision-Support Kits System
  - [x] 26.1 Create BaseKit Architecture and KitOrchestrator
    - ✅ Designed BaseKit abstract class with standardized lifecycle (intake → analysis → document → guidance → complete)
    - ✅ Implemented KitOrchestrator for managing kit execution and state transitions
    - ✅ Created KitRegistry for dynamic kit discovery and instantiation
    - ✅ Built kit execution context with user session management and progress tracking
    - ✅ Implemented kit result aggregation and cross-kit communication protocols
    - ✅ Test Coverage: 56/56 tests passing (BaseKit 19, KitOrchestrator 17, KitRegistry 20)
    - ✅ Comprehensive documentation and examples
    - Status: COMPLETE - Ready for agent framework integration

  - [ ] 26.2 Build Core Agent Framework (IntakeAgent, AnalysisAgent, DocumentAgent, GuidanceAgent)
    - [ ] Create IntakeAgent with conversational flow management and dynamic question generation
    - [ ] Implement AnalysisAgent with multi-domain classification and evidence synthesis
    - [ ] Build DocumentAgent with context-aware template selection and evidence grounding
    - [ ] Create GuidanceAgent with personalized action plan generation and pathway optimization
    - [ ] Integrate existing system components (80% reuse): domain modules, templates, triage system, evidence processing

  - [ ] 26.3 Implement High-Impact Decision-Support Kits
    - [ ] **Rent Increase Kit**: LTB T1 application guidance with rent calculation validation and evidence requirements
    - [ ] **Employment Termination Kit**: ESA vs wrongful dismissal analysis with severance calculation and timeline guidance
    - [ ] **Small Claims Preparation Kit**: Form 7A completion with evidence mapping and cost-benefit analysis
    - [ ] **Motor Vehicle Accident Kit**: DC-PD vs tort claim analysis with insurance coordination and settlement evaluation
    - [ ] **Will Challenge Kit**: Grounds assessment with evidence requirements and probate timeline integration

  - [ ] 26.4 Enhance Existing Components for Agentic Integration
    - [ ] Extend MatterClassifier with confidence scoring and uncertainty quantification for agent decision-making
    - [ ] Enhance ActionPlanGenerator with dynamic step prioritization and conditional logic
    - [ ] Upgrade DocumentPackager with kit-specific templates and evidence-to-field mapping
    - [ ] Integrate LimitationPeriodsEngine with kit-specific deadline calculations and urgency escalation
    - [ ] Extend CostCalculator with kit-specific financial modeling and risk assessment

  - [ ] 26.5 Build Kit-Specific User Interface Components
    - [ ] Create KitLauncher component with kit selection and progress visualization
    - [ ] Implement ConversationalInterface with natural language processing and context retention
    - [ ] Build InteractiveChecklist with dynamic completion tracking and evidence validation
    - [ ] Create ProgressDashboard with multi-kit coordination and deadline management
    - [ ] Implement KitResults component with actionable next steps and document generation triggers

  - [ ] 26.6 Integrate Kits with Existing System Architecture
    - [ ] Wire kits into IntegrationAPI with standardized endpoints and response formats
    - [ ] Integrate kit execution with existing audit logging and data lifecycle management
    - [ ] Connect kits to existing authority registry and forum routing for pathway validation
    - [ ] Ensure UPL compliance boundaries are maintained across all kit interactions
    - [ ] Implement kit result persistence and user session management

  - [ ] 26.7 Testing and Validation
    - [ ] Create comprehensive test suite for BaseKit architecture and agent framework
    - [ ] Implement integration tests for all five high-impact kits with realistic user scenarios
    - [ ] Validate 80% component reuse target and identify any architectural gaps
    - [ ] Test kit orchestration with concurrent execution and state management
    - [ ] Verify UPL compliance and empathy-focused design principles across all kit interactions

- [ ] 27. Create Child Protection Information-Only Domain Module
- [ ] 27. Create Child Protection Information-Only Domain Module
  - [ ] 27.1 Build Child Protection Domain Module
  - [ ] 27.2 Implement CYFSA Apprehension Procedures
  - [ ] 27.3 Build Legal Aid and Duty Counsel Routing
  - [ ] 27.4 Integrate Safety Planning Resources
  - [ ] 27.5 Implement Mandatory Information-Only Disclaimers
  - [ ] 27.6 Wire Child Protection Domain to Backend

- [ ] 28. Create Debt & Insolvency Domain Module
  - [ ] 28.1 Build Debt & Insolvency Domain Module
  - [ ] 28.2 Implement Bankruptcy vs Consumer Proposal Distinction
  - [ ] 28.3 Build Licensed Insolvency Practitioner Routing
  - [ ] 28.4 Implement Debt Defense Options
  - [ ] 28.5 Wire Debt Domain to Backend

- [ ] 29. Create Criminal Injuries Compensation Board Domain Module
  - [ ] 29.1 Build Victim Compensation Domain Module
  - [ ] 29.2 Implement CICB Eligibility and Procedures
  - [ ] 29.3 Build Victim Support Routing
  - [ ] 29.4 Implement Civil Suit Options
  - [ ] 29.5 Wire Victim Compensation Domain to Backend

- [ ] 30. Create Property Tax Appeals Domain Module
  - [ ] 30.1 Build Property Tax Domain Module
  - [ ] 30.2 Implement ARB Procedures
  - [ ] 30.3 Build MPAC Challenge Guidance
  - [ ] 30.4 Implement Judicial Review Options
  - [ ] 30.5 Wire Property Tax Domain to Backend

- [ ] 31. Create Condominium Authority Tribunal Domain Module
  - [ ] 31.1 Build Condominium Domain Module
  - [ ] 31.2 Implement CAT Jurisdiction and Procedures
  - [ ] 31.3 Implement Dispute-Specific Guidance
  - [ ] 31.4 Build Owner Rights and Remedies
  - [ ] 31.5 Wire Condominium Domain to Backend

- [ ] 32. Create Defamation & Anti-SLAPP Domain Module
  - [ ] 32.1 Build Defamation Domain Module
  - [ ] 32.2 Implement Defamation Elements and Defenses
  - [ ] 32.3 Build Anti-SLAPP Motion Procedures
  - [ ] 32.4 Implement Media Defendant Special Procedures
  - [ ] 32.5 Wire Defamation Domain to Backend

- [ ] 33. Comprehensive Testing and Integration
  - [ ] 33.1 Create integration tests for all new domain modules and agentic AI kits
  - [ ] 33.2 Validate forum routing for all 7 new domains and kit pathways
  - [ ] 33.3 Test deadline alerts for all applicable domains and kit scenarios
  - [ ] 33.4 Ensure all 382+ unit tests passing with agentic AI enhancements
  - [ ] 33.5 Verify zero new security issues and UPL compliance across kits
  - [ ] 33.6 Validate E2E test coverage for new domains and decision-support kits

---

## Phase 4: Cloud and Scaling Infrastructure (Tasks 34-37)

- [ ] 34. Progressive Web App (PWA) Offline Support
  - [ ] 33.1 Implement service worker for offline caching
  - [ ] 33.2 Add offline storage with sync capability
  - [ ] 33.3 Build manifest.json for installable PWA
  - [ ] 33.4 Add offline indicator and sync status to UI

- [ ] 34. French Language Internationalization
  - [ ] 34.1 Implement i18n framework (React Intl or similar)
  - [ ] 34.2 Translate UI components, templates, and legal guidance to French
  - [ ] 34.3 Add French legal references (Quebec, federal bilingual requirements)
  - [ ] 34.4 Integrate French court/tribunal information

- [ ] 35. PDF Accessibility & AODA Compliance
  - [ ] 35.1 Implement PDF/A-1b format for accessibility compliance
  - [ ] 35.2 Add tagged PDF structure (headings, lists, form fields) during generation
  - [ ] 35.3 Integrate OCR for scanned evidence document accessibility
  - [ ] 35.4 Add accessibility metadata and document properties

- [ ] 36. Ontario Government Forms Integration
  - [ ] 36.1 Direct links to Central Forms Repository
  - [ ] 36.2 Create form preparation wizards using existing templates
  - [ ] 36.3 Map user evidence to specific form field requirements
  - [ ] 36.4 Build supporting document packages with official forms and guidance
  - [ ] 36.5 Maintain UPL compliance with official source references
  - [ ] 36.6 Create form version checking and validation
  - [ ] 36.7 Build comprehensive filing checklists and deadline tracking

---

## References

### GitHub Pull Requests
- PR #1: Dependency upgrades (multer → 2.0.2, archiver → 7.0.0) - Merged 2025-12-26
- PR #2: CI/CD workflow testing and E2E validation

### Documentation and External Links
- Central Forms Repository: https://forms.mgcs.gov.on.ca
- Ontario Courts - E-Laws: https://www.ontario.ca/laws
- CanLII - Canadian Legal Information Institute: https://canlii.org
- Legal Aid Ontario: https://www.legalaid.on.ca
- Accessibility for Ontarians with Disabilities Act (AODA): https://www.ontario.ca/laws/statute/05aoda
- Law Society of Ontario: https://www.lsuc.ca
- Condominium Authority Tribunal: https://www.cat.catsouthwest.ca

### Official Statutes and Acts
- Limitations Act, 2002 (Ontario)
- Municipal Act, 2001 (Ontario)
- Employment Standards Act, 2000 (Ontario)
- Courts of Justice Act (Ontario) - s.137.1
- Condominium Act, 1998 (Ontario)
- Rules of Professional Conduct (Law Society of Ontario)
- Bankruptcy and Insolvency Act (Canada - Federal)
- Child and Family Services Act (Ontario) - CYFSA
- Succession Law Reform Act (Ontario) - Part V
- Assessment Act (Ontario)
- Libel and Slander Act (Ontario)

### Third-Party Services
- CanLII API: Case law and legislation
- Ontario Court Information: Court directories and procedures
- Victim Services Ontario: Victim support resources
- Ontario Domestic Violence Hotline: 416-866-3191
- LawPRO: Lawyer professional liability coverage
- MPAC: Municipal Property Assessment Corporation
- CAT: Condominium Authority Tribunal

---

## Current Status
- Test baseline: 382/382 unit tests passing, 5/5 E2E tests passing
- Security status: 0 high-severity Snyk issues
- Production readiness: READY FOR PRODUCTION
- Latest completed task: Task 25 (Estate & Succession Law Domain Module) - 2025-12-30
- Next priority: Task 26 (Child Protection Information-Only Domain Module)
