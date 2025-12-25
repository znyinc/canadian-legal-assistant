# Design Document

## Overview

The Canadian Legal Assistant is a comprehensive legal information system built around the core question "Do I go to court?" The system serves as a compassionate navigator for legal newcomers facing their first encounter with the justice system, providing universal triage, forum routing, and evidence-grounded guidance across all Canadian legal domains while maintaining strict unauthorized practice of law (UPL) compliance boundaries.

**Mission**: This system exists to guide legal newcomers through Ontario's complex legal landscape. It is not a tool for lawyers — it is a compassionate navigator for people facing their first eviction notice, their first car accident claim, or their first encounter with the justice system.

The system operates with an Ontario-first, Canada-wide approach, providing legal information (not legal advice) with citations to authoritative sources. It generates documentation grounded in user evidence and guides users through proper procedural sequences using a five-stage journey framework and plain language translation layer.

Key design principles:
- **Assume Zero Legal Knowledge**: Every user is assumed to be encountering the legal system for the first time
- **Reduce Anxiety, Not Just Complexity**: Acknowledge emotional reality and provide reassurance
- **One Step at a Time**: Progressive disclosure to reduce cognitive load and prevent overwhelm
- **Always Explain the WHY**: Help users understand the reasoning behind each legal step
- **Safe Harbor Over Speed**: Encourage caution and professional consultation when in doubt
- **Evidence-grounded outputs**: All factual claims based on user-provided evidence or user-confirmed information
- **Lawful source access**: Strict enforcement of terms of service and access restrictions
- **Complete auditability**: Source manifests and evidence tracking for all outputs

## Architecture

The system follows a modular, domain-extensible architecture with clear separation between core services and domain-specific modules:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│              (Plain Language + Journey Tracker)            │
├─────────────────────────────────────────────────────────────┤
│                  API Gateway & Routing                     │
├─────────────────────────────────────────────────────────────┤
│  Four Pillars    │  Journey Tracker  │  Plain Language     │
│  Classifier      │                   │  Translation Layer  │
├─────────────────────────────────────────────────────────────┤
│  Limitation      │  Cost Calculator  │  Document Generator │
│  Periods Engine  │  & Risk Assessor  │                     │
├─────────────────────────────────────────────────────────────┤
│  Triage Engine   │  Forum Router     │  Evidence Processor │
├─────────────────────────────────────────────────────────────┤
│  Authority Registry  │  Source Access Controller          │
├─────────────────────────────────────────────────────────────┤
│                 Ontario-Specific Modules                   │
│  MV Accidents │ LTB │ OCPP │ Municipal │ Employment │ etc. │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer                       │
│  RAG Indices │ Evidence Store │ Authority DB │ Audit Log   │
└─────────────────────────────────────────────────────────────┘
```

### Core Services

1. **Four Pillars Classifier**: Categorizes matters into Criminal, Civil, Administrative, or Quasi-Criminal law
2. **Journey Tracker**: Guides users through five stages (Understand, Options, Prepare, Act, Resolve)
3. **Plain Language Translation Layer**: Converts legal terminology to accessible language with contextual explanations
4. **Limitation Periods Engine**: Tracks deadlines with urgency-based alerts and Ontario-specific periods
5. **Cost Calculator & Risk Assessor**: Educates users about financial exposure and fee waiver options
6. **Triage Engine**: Classifies legal matters by domain, urgency, and appropriate resolution pathway
7. **Forum Router**: Determines appropriate courts, tribunals, regulators, or ombudsman services
8. **Evidence Processor**: Handles document ingestion, metadata extraction, and timeline generation
9. **Case Law Referencer**: Provides citations and links while respecting access restrictions
10. **Document Generator**: Creates domain-appropriate templates and packages
11. **Authority Registry**: Maintains versioned mapping of legal bodies and their constraints
12. **Source Access Controller**: Enforces lawful acquisition methods and terms compliance

### Domain Modules

Each legal domain (insurance, landlord/tenant, employment, etc.) implements:
- Domain-specific routing logic
- Specialized document templates
- Relevant authority mappings
- Custom evidence requirements

### User Interface Layer

The UI layer provides a responsive, accessible web interface with the following key components:

**Frontend Architecture**:
- **React-based SPA**: Single-page application for smooth user experience
- **Responsive Design**: Mobile-first approach supporting desktop, tablet, and mobile
- **Accessibility Compliance**: WCAG 2.1 AA standards with keyboard navigation and screen reader support
- **State Management**: Centralized state management for user session and data flow

**Key UI Components**:
1. **Matter Intake Interface**: Multi-step form for legal issue description and classification
2. **Evidence Upload Interface**: Drag-and-drop file upload with progress tracking
3. **Forum Routing Display**: Interactive visualization of legal pathways
4. **Document Generation Interface**: Preview and editing with user confirmation prompts
5. **Case Law Search Interface**: Search and citation display with external links
6. **Data Management Interface**: Export, deletion, and audit log access

## Components and Interfaces

### Triage Engine

**Purpose**: Universal matter classification and initial routing

**Key Methods**:
- `classifyMatter(userInput: MatterDescription): MatterClassification`
- `assessUrgency(dates: DateInfo[], domain: LegalDomain): UrgencyAssessment`
- `generateQuestionSet(incompleteClassification: PartialClassification): QuestionSet`

**Inputs**: User-provided matter description, dates, parties, dispute amount
**Outputs**: Domain classification, urgency flags, targeted question sets

### Forum Router

**Purpose**: Determine appropriate legal pathways and sequence

**Key Methods**:
- `routeToForum(classification: MatterClassification): ForumMap`
- `determineCourtLevel(claimValue: number, subjectMatter: string, reliefSought: string): CourtLevel`
- `distinguishAppealVsJudicialReview(tribunalDecision: TribunalDecision): PathwayType`

**Inputs**: Matter classification, claim parameters, location facts
**Outputs**: Forum map with pathways and sequence, routing rationale

### Evidence Processor

**Purpose**: Document ingestion, analysis, and timeline generation

**Key Methods**:
- `ingestEvidence(files: File[]): EvidenceIndex`
- `extractMetadata(file: File): DocumentMetadata`
- `generateTimeline(evidenceIndex: EvidenceIndex): Timeline`
- `detectMissingEvidence(timeline: Timeline, domain: LegalDomain): MissingEvidenceList`
- `calculateCredibilityScore(evidence: Evidence): CredibilityScore`

**Inputs**: PDF, PNG, JPG, EML, MSG, TXT files
**Outputs**: Evidence index, timeline, missing evidence checklist, credibility scores

### Case Law Referencer

**Purpose**: Provide case law citations while respecting access restrictions

**Key Methods**:
- `searchCases(query: SearchQuery): CaseReference[]`
- `generateSummary(caseRef: CaseReference): CaseSummary`
- `validateAccessMethod(source: string, method: AccessMethod): boolean`

**Inputs**: Search queries, case identifiers
**Outputs**: Case citations, links, short summaries (no full text reproduction)

### Four Pillars Classifier

**Purpose**: Categorize legal matters into the appropriate legal framework

**Key Methods**:
- `classifyMatter(matterDescription: string): LegalPillar`
- `explainPillar(pillar: LegalPillar): PillarExplanation`
- `determineBurdenOfProof(pillar: LegalPillar): BurdenExplanation`

**Four Pillars**:
1. **Criminal Law**: Government prosecuting crimes (Crown vs accused)
2. **Civil Law**: Private disputes about money, property, contracts
3. **Administrative Law**: Disputes with government agencies or regulated industries
4. **Quasi-Criminal**: Provincial offences like speeding, bylaw violations

**Inputs**: Matter description, parties involved, type of dispute
**Outputs**: Pillar classification, burden of proof explanation, process overview

### Journey Tracker

**Purpose**: Guide users through five-stage legal process with progress tracking

**Key Methods**:
- `initializeJourney(matterId: string, pillar: LegalPillar): UserJourney`
- `advanceStage(journeyId: string): JourneyStep`
- `getProgressStatus(journeyId: string): JourneyProgress`

**Five Stages**:
1. **Understand**: "What happened to me? Is this a legal issue?"
2. **Options**: "What can I do about it?"
3. **Prepare**: "What do I need to get ready?"
4. **Act**: "How do I actually do this?"
5. **Resolve**: "What happens after?"

**Inputs**: Matter classification, user progress, completed actions
**Outputs**: Current stage, next steps, progress percentage, encouragement messages

### Plain Language Translation Layer

**Purpose**: Convert legal terminology to accessible language with contextual explanations

**Key Methods**:
- `translateTerm(legalTerm: string, context: string): PlainLanguageExplanation`
- `generateInlineExplanation(text: string): AnnotatedText`
- `validatePlainLanguage(content: string): LanguageComplexityScore`

**Translation Examples**:
- "Plaintiff" → "The person starting the case"
- "Limitation Period" → "Deadline to start your case"
- "Discovery" → "Sharing evidence with the other side"

**Inputs**: Legal text, context information, user reading level
**Outputs**: Plain language translations, inline explanations, complexity scores

### Limitation Periods Engine

**Purpose**: Track legal deadlines with urgency-based alerts and Ontario-specific periods

**Key Methods**:
- `calculateDeadline(claimType: string, triggerDate: Date): LimitationPeriod`
- `generateAlert(deadline: LimitationPeriod): DeadlineAlert`
- `checkMunicipalNotice(matterDetails: MatterDetails): NoticeRequirement`

**Ontario-Specific Periods**:
- Municipal property notice: 10 days (CRITICAL)
- Construction lien preserve: 60 days
- Most civil claims: 2 years
- Ultimate backstop: 15 years

**Alert Levels**:
- **Critical (Red)**: ≤7 days - "You need to act TODAY"
- **Warning (Orange)**: ≤30 days - "Time is running short"
- **Caution (Yellow)**: ≤90 days - "Start preparing now"
- **Info (Blue)**: >90 days - "Deadline tracked"

**Inputs**: Claim type, incident date, discovery date, matter details
**Outputs**: Deadline calculations, urgency alerts, consequence explanations

### Cost Calculator & Risk Assessor

**Purpose**: Educate users about financial exposure and fee waiver options

**Key Methods**:
- `calculateCostExposure(forum: LegalForum, claimAmount: number): CostRisk`
- `assessFeeWaiverEligibility(userProfile: UserProfile): FeeWaiverOptions`
- `explainCostConsequences(forum: LegalForum): CostExplanation`

**Cost Exposure by Forum**:
- Small Claims: Maximum 15% of claim (LOW risk)
- LTB/HRTO: Usually nothing (MINIMAL risk)
- Superior Court Simplified: $5,000-$25,000 (MEDIUM risk)
- Superior Court Ordinary: $25,000-$100,000+ (HIGH risk)

**Inputs**: Forum selection, claim amount, user financial profile
**Outputs**: Cost risk assessment, fee waiver eligibility, financial impact explanation

### Authority Registry

**Purpose**: Maintain versioned mapping of legal bodies and constraints

**Key Methods**:
- `lookupAuthority(triggers: string[]): Authority[]`
- `getEscalationRoutes(authority: Authority): EscalationRoute[]`
- `updateRegistry(authority: Authority, version: string): void`

**Data Structure**:
```typescript
interface Authority {
  body: string;
  jurisdiction: string;
  authorityType: 'court' | 'tribunal' | 'regulator' | 'ombuds';
  relevanceTriggers: string[];
  constraints: string[];
  authoritativeSources: string[];
  updateCadence: string;
  escalationRoutes: string[];
}
```

### Source Access Controller

**Purpose**: Enforce lawful data acquisition methods

**Key Methods**:
- `validateAccess(source: string, method: AccessMethod): AccessValidation`
- `blockProhibitedAccess(source: string, method: AccessMethod): void`
- `logAccessDecision(source: string, method: AccessMethod, decision: AccessDecision): void`

**Enforcement Rules**:
- CanLII: API and linking only, no web scraping
- e-Laws/Justice Laws: Official browse/download only
- Court/tribunal sites: Record retrieval dates for changing guidance

### User Interface Components

**Purpose**: Provide accessible, responsive web interface for all system functionality

**Key Components**:

#### Matter Intake Interface
- **Multi-step form**: Progressive disclosure of classification questions
- **Dynamic validation**: Real-time validation with helpful error messages
- **Accessibility features**: Keyboard navigation, screen reader support, high contrast mode
- **Responsive design**: Optimized for desktop, tablet, and mobile devices

#### Evidence Upload Interface
- **Drag-and-drop functionality**: Intuitive file upload with visual feedback
- **Progress tracking**: Real-time upload progress and validation status
- **File type validation**: Clear messaging for supported/unsupported formats
- **Evidence visualization**: Timeline view with credibility scores and gap detection

#### Forum Routing Display
- **Interactive pathway visualization**: Clear presentation of available legal options
- **Multi-pathway presentation**: No single "best" recommendation, showing all viable options
- **Authority registry citations**: Links to source authorities for routing decisions
- **Prominent disclaimers**: Legal information disclaimers on all guidance pages

#### Document Generation Interface
- **Preview functionality**: Real-time document preview with formatting
- **User confirmation prompts**: Required confirmation for all factual assertions
- **Package download**: Standardized naming and complete manifest inclusion
- **Edit capabilities**: Basic editing with evidence grounding validation

#### Data Management Interface
- **Export functionality**: One-click export of all user artifacts
- **Deletion interface**: Clear deletion options with legal hold warnings
- **Audit log viewer**: Transparent access to user activity logs
- **Retention settings**: User-configurable retention periods and status display

## Data Models

### Core Data Types

```typescript
interface MatterClassification {
  domain: LegalDomain;
  subDomain?: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  timeFlags: TimeFlag[];
  jurisdiction: string;
  parties: PartyInfo[];
  disputeAmount?: number;
}

interface ForumMap {
  primaryPathway: ForumPathway;
  alternativePathways: ForumPathway[];
  sequence: string[];
  routingRationale: string;
  registryEntries: string[];
}

interface EvidenceIndex {
  items: EvidenceItem[];
  timeline: TimelineEvent[];
  missingEvidence: MissingEvidenceItem[];
  credibilityAssessment: CredibilityAssessment;
}

interface EvidenceItem {
  id: string;
  filename: string;
  type: 'pdf' | 'image' | 'email' | 'text';
  provenance: 'original_eml' | 'original_pdf' | 'screenshot_derived';
  metadata: DocumentMetadata;
  credibilityScore: number;
  hash: string;
  timestamp: Date;
}

interface DocumentPackage {
  forumMap: string;
  timeline: string;
  missingEvidenceChecklist: string;
  draftDocuments: string[];
  sourceManifest: SourceManifest;
  evidenceManifest: EvidenceManifest;
}
```

### Authority Registry Schema

```typescript
interface AuthorityRegistry {
  version: string;
  lastUpdated: Date;
  authorities: Authority[];
}

interface Authority {
  body: string;
  jurisdiction: string;
  authorityType: AuthorityType;
  relevanceTriggers: string[];
  constraints: string[];
  authoritativeSources: string[];
  updateCadence: string;
  escalationRoutes: string[];
}
```

### Source Access Policy Schema

```typescript
interface SourceAccessPolicy {
  sourceId: string;
  name: string;
  classification: string;
  allowedMethods: AccessMethod[];
  disallowedMethods: AccessMethod[];
  constraints: string[];
  enforcementRules: EnforcementRule[];
}

interface AccessValidation {
  allowed: boolean;
  method: AccessMethod;
  reason: string;
  alternatives?: AccessMethod[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Now I need to complete the prework analysis before writing the correctness properties:
### Property Reflection

After reviewing all properties identified in the prework, several areas of redundancy and consolidation opportunities were identified:

**Redundancy Analysis:**
- Properties 6.1, 6.5, and 6.6 all relate to source manifest completeness and can be consolidated
- Properties 4.1, 4.2, and 4.6 all relate to access method enforcement and can be combined
- Properties 8.1-8.7 all follow the same pattern for domain-specific outputs and can be consolidated
- Properties 9.1, 9.4, and 9.5 relate to data lifecycle management and can be combined

**Consolidated Properties:**
The following properties provide unique validation value and will be retained:

Property 1: Universal matter triage and classification
*For any* user input describing a legal issue, the system should collect all required routing parameters and classify the matter into one of the supported legal domains
**Validates: Requirements 1.1, 1.2**

Property 2: Forum routing with statutory priority
*For any* classified legal matter, the system should prioritize statutory tribunal or complaint processes before court options where mandated, and determine appropriate court levels using claim parameters
**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

Property 3: Time sensitivity assessment
*For any* matter with provided dates, the system should assess time sensitivity and flag deadline risks with appropriate uncertainty handling
**Validates: Requirements 1.7, 1.8**

Property 4: Targeted question generation
*For any* incomplete matter classification, the system should generate targeted question sets rather than guessing missing information
**Validates: Requirements 1.10**

Property 5: Lawful case law access
*For any* case law reference request, the system should use only permitted access methods (CanLII API, linking, user-provided) and never reconstruct full text through web scraping
**Validates: Requirements 2.1, 2.2, 2.7**

Property 6: Proper citation formatting
*For any* legislation or case law citation, the system should use appropriate official sources with required date information and produce short summaries without lengthy excerpts
**Validates: Requirements 2.3, 2.4, 2.5, 2.6**

Property 7: Evidence-grounded document drafting
*For any* document draft, all factual claims should be based on user-provided evidence or user-confirmed information, with user confirmation required for factual assertions
**Validates: Requirements 3.1, 3.5**

Property 8: Standardized document packaging
*For any* document package, the system should use standardized naming, include all required components (forum map, timeline, checklists, manifests), and create domain-appropriate templates
**Validates: Requirements 3.2, 3.3, 3.4**

Property 9: Source access enforcement
*For any* source access attempt, the system should use only explicitly permitted methods, block prohibited access, maintain versioned authority registry, and log all enforcement decisions
**Validates: Requirements 4.1, 4.2, 4.4, 4.5, 4.6, 4.7**

Property 10: Evidence processing completeness
*For any* uploaded evidence, the system should accept only supported formats, extract required metadata, generate complete evidence indices with credibility scores, and automatically redact specified PII
**Validates: Requirements 5.1, 5.2, 5.3, 5.6, 5.7**

Property 11: Timeline generation with gap detection
*For any* set of evidence, the system should produce chronological timelines, flag missing critical artifacts, and handle screenshot evidence with appropriate recommendations
**Validates: Requirements 5.4, 5.5**

Property 12: Complete auditability
*For any* system output, the system should include complete source manifests with URLs, dates, and version information, cite evidence by attachment index, and maintain comprehensive audit logs
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8**

Property 13: UPL compliance boundaries
*For any* user interaction, the system should include legal information disclaimers, present multiple pathways rather than single recommendations, refuse uncited legal statements, and redirect advice requests to options-based guidance
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**

Property 14: Domain-specific output generation
*For any* classified legal matter, the system should generate appropriate domain-specific documents and materials, provide scoped handoffs for unsupported matters, and prioritize appropriately for multi-domain cases
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9**

Property 15: Data lifecycle management
*For any* user data, the system should support user-initiated export and deletion, enforce configurable retention periods with legal hold exceptions, and maintain audit logs of all data activities
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

## Error Handling

The system implements comprehensive error handling across all components:

### Source Access Errors
- **CanLII API failures**: Graceful degradation to linking-only mode
- **Legislation site unavailability**: Cache recent versions with staleness warnings
- **Terms of service violations**: Immediate blocking with logged violations

### Evidence Processing Errors
- **Unsupported file formats**: Clear rejection with supported format list
- **Corrupted files**: Error reporting with re-upload suggestions
- **Metadata extraction failures**: Partial processing with confidence scoring

### Classification Errors
- **Ambiguous matter types**: Targeted question generation for clarification
- **Insufficient information**: Structured information requests
- **Out-of-scope matters**: Scoped handoffs with referral guidance

### Data Integrity Errors
- **Hash mismatches**: Evidence integrity warnings
- **Timeline inconsistencies**: Flagged discrepancies with user review prompts
- **Missing critical evidence**: Explicit gap identification with collection guidance

## Testing Strategy

The system employs a dual testing approach combining unit testing and property-based testing to ensure comprehensive coverage and correctness verification.

### Unit Testing Approach

Unit tests verify specific examples, edge cases, and integration points:

- **Component Integration**: Test interfaces between core services
- **Domain Module Behavior**: Verify domain-specific routing and document generation
- **Error Conditions**: Test graceful handling of various failure scenarios
- **Edge Cases**: Validate boundary conditions and unusual inputs
- **API Compliance**: Verify adherence to external service constraints

Unit tests focus on concrete scenarios and specific behaviors that demonstrate correct functionality without requiring exhaustive input coverage.

### Property-Based Testing Approach

Property-based testing verifies universal properties that should hold across all inputs using **Hypothesis** (Python) as the primary testing framework. Each property-based test will run a minimum of 100 iterations to ensure statistical confidence in the results.

**Property-Based Testing Requirements:**
- Each correctness property must be implemented by a single property-based test
- Tests must be tagged with comments explicitly referencing the design document property
- Tag format: `**Feature: canadian-legal-assistant, Property {number}: {property_text}**`
- Smart generators will constrain inputs to relevant domains while maintaining randomness
- Tests will avoid mocking where possible to validate real functionality

**Key Property Test Categories:**

1. **Triage and Classification Properties** (Properties 1-4)
   - Generate random matter descriptions and verify consistent classification
   - Test routing logic across all supported domains and jurisdictions
   - Validate question generation for incomplete inputs

2. **Source Access Properties** (Properties 5-6, 9)
   - Test access method enforcement across all source types
   - Verify citation formatting compliance
   - Validate authority registry versioning and updates

3. **Evidence Processing Properties** (Properties 10-11)
   - Generate various file types and metadata scenarios
   - Test timeline generation and gap detection
   - Verify credibility scoring consistency

4. **Document Generation Properties** (Properties 7-8, 14)
   - Test evidence grounding across all document types
   - Verify package completeness and standardization
   - Validate domain-specific output generation

5. **Compliance Properties** (Properties 12-13, 15)
   - Test auditability across all system outputs
   - Verify UPL boundary enforcement
   - Validate data lifecycle management

**Generator Design:**
- **Matter generators**: Create realistic legal scenarios across all domains
- **Evidence generators**: Produce various file types with realistic metadata
- **Date generators**: Create time-sensitive scenarios with various deadline patterns
- **Classification generators**: Generate edge cases for domain boundaries

The combination of unit and property-based testing ensures both concrete functionality verification and universal correctness guarantees across the system's operational space.