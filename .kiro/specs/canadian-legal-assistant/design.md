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

The system follows a modular, AI-enhanced architecture with comprehensive legal taxonomy coverage, sophisticated routing capabilities across all Canadian jurisdictions, and an innovative agentic AI Decision-Support Kits system that transforms static templates into interactive, guided experiences:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│    (Plain Language + Journey Tracker + Kit Interfaces)     │
├─────────────────────────────────────────────────────────────┤
│              Agentic AI Decision-Support Kits              │
│  Kit Orchestrator │ Kit Registry │ Kit Execution Context   │
├─────────────────────────────────────────────────────────────┤
│                    Core Agent Framework                     │
│ IntakeAgent │ AnalysisAgent │ DocumentAgent │ GuidanceAgent │
├─────────────────────────────────────────────────────────────┤
│                  API Gateway & AI Orchestration            │
├─────────────────────────────────────────────────────────────┤
│  AI-Powered      │  Journey Tracker  │  Plain Language     │
│  Classification  │                   │  Translation Layer  │
├─────────────────────────────────────────────────────────────┤
│  Comprehensive   │  Cost Calculator  │  AI Document        │
│  Legal Taxonomy  │  & Risk Assessor  │  Generator          │
├─────────────────────────────────────────────────────────────┤
│  Enhanced Triage │  Multi-Domain     │  Evidence Processor │
│  Engine          │  Forum Router     │                     │
├─────────────────────────────────────────────────────────────┤
│  Comprehensive Authority Registry & AI-Enhanced Routing    │
├─────────────────────────────────────────────────────────────┤
│                 Comprehensive Domain Modules               │
│ Torts │ Contracts │ Employment │ Family │ Admin │ Immigration│
│ Criminal │ IP │ Tax │ Privacy │ Professional │ Indigenous   │
├─────────────────────────────────────────────────────────────┤
│                    AI Services Layer                       │
│  NLP Engine │ Legal Research │ Document AI │ Case Analysis │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer                       │
│  RAG Indices │ Evidence Store │ Authority DB │ Audit Log   │
│  Case Law DB │ Statute DB │ Precedent Index │ AI Models    │
└─────────────────────────────────────────────────────────────┘
```

### Agentic AI Decision-Support Kits System

The Decision-Support Kits system represents a revolutionary approach to legal guidance, transforming static templates into interactive, AI-powered experiences that guide users through complex legal processes step-by-step. This system leverages 80% of existing components while adding intelligent orchestration and personalized guidance.

#### BaseKit Architecture

**Purpose**: Standardized lifecycle management for all decision-support kits

**Core Lifecycle Stages**:
1. **Intake**: Conversational information gathering with dynamic question generation
2. **Analysis**: Multi-domain classification and evidence synthesis using existing triage engine
3. **Document**: Context-aware template selection and evidence grounding
4. **Guidance**: Personalized action plan generation and pathway optimization
5. **Complete**: Result aggregation and next steps presentation

**Key Methods**:
- `initialize(userContext: UserContext): KitSession`
- `executeStage(stage: KitStage, input: StageInput): StageResult`
- `validateTransition(fromStage: KitStage, toStage: KitStage): boolean`
- `generateProgress(): ProgressReport`
- `handleError(error: KitError): ErrorRecovery`

#### KitOrchestrator

**Purpose**: Manage kit execution, state transitions, and cross-kit communication

**Key Capabilities**:
- **Session Management**: Track user progress across multiple kit executions
- **State Persistence**: Maintain kit state across user sessions
- **Concurrent Execution**: Support multiple kits running simultaneously
- **Result Aggregation**: Combine outputs from multiple kits into coherent guidance
- **Error Recovery**: Handle failures gracefully with fallback procedures

**Key Methods**:
- `launchKit(kitId: string, userContext: UserContext): KitSession`
- `orchestrateMultiKit(kitIds: string[], coordination: CoordinationStrategy): MultiKitSession`
- `persistState(session: KitSession): void`
- `recoverSession(sessionId: string): KitSession`
- `aggregateResults(sessions: KitSession[]): AggregatedGuidance`

#### Core Agent Framework

##### IntakeAgent
**Purpose**: Conversational flow management and dynamic question generation

**Capabilities**:
- Natural language processing for user responses
- Context-aware question generation based on partial information
- Integration with existing MatterClassifier for domain detection
- Progressive disclosure to reduce cognitive load
- Validation and clarification of user inputs

**Integration Points**:
- Reuses existing `MatterClassifier` for domain detection
- Leverages `PlainLanguageTranslator` for accessible communication
- Connects to `AuthorityRegistry` for jurisdiction-specific questions

##### AnalysisAgent
**Purpose**: Multi-domain classification and evidence synthesis

**Capabilities**:
- Advanced scenario analysis using existing classification engine
- Evidence quality assessment and gap identification
- Multi-domain case detection and prioritization
- Confidence scoring and uncertainty quantification
- Risk assessment and urgency determination

**Integration Points**:
- Extends existing `MatterClassifier` with confidence scoring
- Utilizes `EvidenceProcessor` for document analysis
- Leverages `LimitationPeriodsEngine` for deadline assessment
- Connects to `CostCalculator` for financial risk evaluation

##### DocumentAgent
**Purpose**: Context-aware template selection and evidence grounding

**Capabilities**:
- Intelligent template selection based on case analysis
- Evidence-to-field mapping for form completion
- Dynamic document customization based on user context
- Quality validation and completeness checking
- Integration with existing document generation pipeline

**Integration Points**:
- Utilizes existing `TemplateLibrary` for document templates
- Leverages `DocumentPackager` for standardized output
- Connects to `EvidenceIndexer` for evidence grounding
- Uses `CitationFormatter` for proper legal citations

##### GuidanceAgent
**Purpose**: Personalized action plan generation and pathway optimization

**Capabilities**:
- Dynamic step prioritization based on urgency and complexity
- Personalized pathway recommendations considering user constraints
- Settlement and negotiation guidance integration
- Resource and referral recommendations
- Follow-up scheduling and reminder generation

**Integration Points**:
- Extends existing `ActionPlanGenerator` with dynamic logic
- Utilizes `ForumRouter` for pathway validation
- Leverages `CostCalculator` for financial guidance
- Connects to `AuthorityRegistry` for referral information

#### High-Impact Decision-Support Kits

##### Rent Increase Kit
**Purpose**: Guide tenants through LTB T1 application process with rent calculation validation

**Specialized Components**:
- Rent increase legality checker using Ontario rent control rules
- Evidence requirements specific to above-guideline increases
- LTB T1 form completion with field-by-field guidance
- Timeline management for application deadlines
- Settlement negotiation strategies with landlords

**Integration**: Leverages existing LTB domain module, limitation periods engine, and document templates

##### Employment Termination Kit
**Purpose**: Analyze ESA vs wrongful dismissal claims with severance calculation

**Specialized Components**:
- Termination analysis (with cause, without cause, constructive dismissal)
- Severance calculation engine using ESA minimums and common law
- Evidence gathering for wrongful dismissal claims
- Timeline management for ESA complaints vs court filings
- Settlement negotiation guidance and release review

**Integration**: Utilizes existing employment domain module, cost calculator, and forum routing

##### Small Claims Preparation Kit
**Purpose**: Complete Form 7A preparation with evidence mapping and cost-benefit analysis

**Specialized Components**:
- Claim strength assessment and success probability
- Evidence-to-form field mapping for Form 7A completion
- Cost-benefit analysis including filing fees and time investment
- Settlement demand letter generation before filing
- Court procedure preparation and timeline management

**Integration**: Leverages existing civil domain module, document packager, and cost calculator

##### Motor Vehicle Accident Kit
**Purpose**: Navigate DC-PD vs tort claim analysis with insurance coordination

**Specialized Components**:
- DC-PD eligibility assessment for Ontario accidents
- Tort claim threshold analysis (serious impairment test)
- Insurance coordination and subrogation guidance
- Medical evidence requirements and timeline management
- Settlement evaluation and negotiation strategies

**Integration**: Utilizes existing tort domain module, evidence processor, and limitation periods engine

##### Will Challenge Kit
**Purpose**: Assess grounds for will challenges with evidence requirements and probate timeline

**Specialized Components**:
- Will challenge grounds assessment (capacity, undue influence, formalities)
- Evidence gathering strategy for suspicious circumstances
- Probate timeline integration and deadline management
- Expert witness requirements and qualification guidance
- Settlement alternatives and family mediation options

**Integration**: Leverages existing estate domain module, evidence processor, and forum routing

### Enhanced Component Integration

#### Extended MatterClassifier
**New Capabilities for Agentic Integration**:
- Confidence scoring with uncertainty quantification
- Multi-stage classification refinement based on additional information
- Context retention across kit sessions
- Integration with agent decision-making processes

#### Enhanced ActionPlanGenerator
**New Capabilities for Agentic Integration**:
- Dynamic step prioritization based on changing circumstances
- Conditional logic for pathway optimization
- Integration with kit-specific guidance generation
- Real-time adaptation based on user progress

#### Upgraded DocumentPackager
**New Capabilities for Agentic Integration**:
- Kit-specific template selection and customization
- Evidence-to-field mapping for form completion
- Dynamic package composition based on kit recommendations
- Integration with kit result aggregation

#### Integrated LimitationPeriodsEngine
**New Capabilities for Agentic Integration**:
- Kit-specific deadline calculations and prioritization
- Urgency escalation based on kit progress
- Dynamic timeline adjustment based on case developments
- Integration with kit guidance generation

#### Extended CostCalculator
**New Capabilities for Agentic Integration**:
- Kit-specific financial modeling and risk assessment
- Dynamic cost-benefit analysis based on case strength
- Settlement value estimation and negotiation guidance
- Integration with kit pathway optimization

### Kit-Specific User Interface Components

#### KitLauncher
**Purpose**: Kit selection and progress visualization

**Features**:
- Interactive kit selection based on user situation
- Progress visualization across multiple concurrent kits
- Session management and state persistence
- Integration with existing matter intake flow

#### ConversationalInterface
**Purpose**: Natural language processing and context retention

**Features**:
- Conversational question flow with dynamic branching
- Context retention across kit stages
- Natural language input processing and validation
- Integration with existing plain language translation layer

#### InteractiveChecklist
**Purpose**: Dynamic completion tracking and evidence validation

**Features**:
- Dynamic checklist generation based on case analysis
- Real-time completion tracking and validation
- Evidence upload integration with quality assessment
- Progress synchronization across kit stages

#### ProgressDashboard
**Purpose**: Multi-kit coordination and deadline management

**Features**:
- Unified view of progress across multiple kits
- Deadline tracking and urgency visualization
- Resource and referral management
- Integration with existing journey tracker

#### KitResults
**Purpose**: Actionable next steps and document generation triggers

**Features**:
- Comprehensive result presentation with clear next steps
- Document generation triggers based on kit recommendations
- Resource and referral integration
- Follow-up scheduling and reminder management

### System Integration Architecture

The agentic AI system integrates seamlessly with existing components through standardized interfaces:

**API Integration**:
- Kit endpoints integrated into existing IntegrationAPI
- Standardized request/response formats maintaining backward compatibility
- Session management integrated with existing user authentication
- Audit logging extended to cover kit interactions

**Data Integration**:
- Kit state persistence using existing data lifecycle management
- Evidence integration with existing evidence processor
- Authority registry integration for pathway validation
- Audit trail integration for compliance tracking

**UPL Compliance Integration**:
- Existing disclaimer system extended to cover kit interactions
- Multi-pathway presentation maintained across all kit recommendations
- Citation requirements enforced in kit-generated documents
- Professional consultation recommendations integrated into kit guidance

This architecture ensures that the agentic AI Decision-Support Kits system enhances the existing Canadian Legal Assistant while maintaining all established design principles, UPL compliance boundaries, and empathy-focused user experience.

1. **AI-Powered Classification Engine**: Advanced NLP-based classification covering comprehensive legal taxonomy
2. **Multi-Domain Analysis System**: Identifies complex cases spanning multiple legal areas
3. **Comprehensive Legal Taxonomy**: Detailed categorization across all Canadian law areas
4. **AI-Enhanced Forum Router**: Sophisticated routing across federal, provincial, territorial, and Indigenous jurisdictions
5. **Professional Regulatory Integration**: Connections to all professional colleges and regulatory bodies
6. **Alternative Dispute Resolution Routing**: AI-powered ADR recommendations
7. **International Law Integration**: Cross-border legal issue identification and routing
8. **AI Document Generation**: Context-aware document creation with legal language optimization
9. **Legal Research AI**: Automated case law and statute research with relevance scoring
10. **Precedent Analysis Engine**: AI-powered analysis of legal precedents and their applicability

### Domain Modules

The system includes comprehensive domain modules covering all areas of Canadian law:

#### Core Legal Domains
- **Tort Law**: Negligence, intentional torts, strict liability, defamation (including anti-SLAPP), privacy torts, occupiers' liability, professional negligence, medical malpractice
- **Contract Law**: Breach of contract, remedies, limitation periods, commercial disputes, construction liens, real estate purchase disputes, shareholder agreements
- **Employment Law**: Wrongful dismissal, constructive dismissal, human rights violations, workplace safety, employment standards, severance disputes
- **Family Law**: Divorce, custody, support, property division, domestic relations, child protection information (information-only), dependant support claims
- **Criminal Law**: Summary and indictable offences, victim services (CICB), court processes, criminal procedure, bail procedures, peace bonds (810 orders)
- **Administrative Law**: Judicial review, statutory appeals, regulatory compliance, property tax appeals (ARB/MPAC), tribunal procedures
- **Immigration Law**: Visa applications, appeals, humanitarian considerations, refugee claims, permanent residence applications

#### Specialized Legal Domains
- **Intellectual Property**: Copyright, trademark, patent, trade secrets, licensing, digital rights
- **Tax Law**: CRA disputes, Tax Court appeals, provincial tax matters, property tax assessments
- **Privacy Law**: Federal and provincial privacy commissioners, data protection, AODA compliance
- **Professional Regulation**: Lawyer discipline, medical malpractice, CPSO complaints, engineering standards, professional misconduct
- **Indigenous Law**: Treaty rights, land claims, cultural considerations, self-determination rights
- **International Law**: Cross-border disputes, treaty obligations, diplomatic immunity, international commercial law

#### Estate & Succession Law
- **Wills & Probate**: Estate administration, will challenges, grant of probate, succession law procedures (Succession Law Reform Act)
- **Estate Disputes**: Estate trustee disputes, interpretation disputes, creditor claims against estates
- **Dependant Support Claims**: Dependant support petitions (Succession Law Reform Act Part V), eligibility criteria, support calculations

#### Consumer & Debt Management
- **Consumer Protection**: Consumer Protection Act disputes, service refunds, warranty claims, unfair business practices (Consumer Protection Ontario)
- **Debt & Insolvency**: Bankruptcy procedures, consumer proposals, creditor defences, Licensed Insolvency Practitioner engagement, credit counseling
- **Credit & Collections**: Dispute resolution, creditor rights and debtor protections

#### Property & Municipal Law
- **Condominium Law**: Condominium Authority Tribunal (CAT) disputes, pet policies, parking disputes, record access, assessment challenges
- **Property Tax Appeals**: Assessment Review Board procedures, MPAC challenges, property assessment grounds, evidence requirements
- **Municipal Law**: Municipal code enforcement, bylaw disputes, property standards complaints, municipal liability claims

#### Victim & Compensation Services
- **Criminal Injuries Compensation**: CICB eligibility, application procedures, compensation categories, victim support services
- **Victim Services**: Ontario victim support programs, counseling services, safety planning, victim-offender mediation, restitution orders
- **Civil Remedies for Crime Victims**: Options for civil suits against perpetrators, damages recovery, procedural options

#### Regulatory and Administrative Bodies
- **Federal Regulators**: Competition Bureau, CRTC, Transport Canada, Health Canada, IRCC (Immigration), Canada Revenue Agency
- **Provincial Regulators**: Securities commissions, utilities boards, professional colleges (Law Society, CPSO, PEO), Assessment Review Board, CAT
- **Ombudsman Services**: Federal ombudsman, provincial ombudsmen, sector-specific ombudsmen, Patient Ombudsman, Financial Services Ombudsman
- **Tribunal Systems**: Specialized tribunals for each legal domain and jurisdiction (LTB, HRTO, ARB, CAT, Small Claims Courts)
- **Victim Services Agencies**: Ontario victim services, provincial victim assistance programs, specialized support services

Each domain module implements:
- AI-powered classification and routing logic
- Specialized document templates and forms
- Relevant authority mappings and escalation paths
- Custom evidence requirements and analysis
- Jurisdiction-specific procedures and deadlines (with statutory references)
- Alternative dispute resolution options
- Professional consultation recommendations
- Legal information disclaimers and UPL compliance safeguards

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

### AI-Powered Classification Engine

**Purpose**: Advanced NLP-based classification covering comprehensive legal taxonomy

**Key Methods**:
- `classifyComplexMatter(userInput: string, context: LegalContext): ComprehensiveLegalClassification`
- `identifyMultiDomainIssues(classification: LegalClassification): MultiDomainAnalysis`
- `assessClassificationConfidence(classification: LegalClassification): ConfidenceScore`
- `suggestAdditionalQuestions(partialClassification: PartialClassification): QuestionSet`

**AI Capabilities**:
- Natural language processing for legal scenario analysis
- Multi-domain case identification and prioritization
- Confidence scoring and uncertainty handling
- Context-aware question generation for clarification

**Comprehensive Legal Taxonomy Coverage**:
- **Tort Law**: Negligence (professional, medical, occupiers' liability), intentional torts (assault, battery, false imprisonment), defamation (libel, slander), privacy torts, nuisance
- **Contract Law**: Breach types (fundamental, minor), remedies (damages, specific performance), formation issues, commercial vs consumer contracts
- **Employment Law**: Wrongful dismissal, constructive dismissal, human rights violations, workplace harassment, employment standards violations, workplace safety
- **Family Law**: Divorce proceedings, child custody and access, spousal support, child support, property division, domestic contracts
- **Administrative Law**: Judicial review grounds, statutory appeals, procedural fairness, regulatory compliance, licensing disputes
- **Immigration Law**: Visa categories, refugee claims, appeals (RAD, Federal Court), humanitarian applications, citizenship issues

**Inputs**: Natural language matter description, supporting documents, user context
**Outputs**: Detailed classification with confidence scores, multi-domain flags, recommended next steps

### Multi-Domain Forum Router

**Purpose**: AI-enhanced routing across comprehensive Canadian legal system

**Key Methods**:
- `routeComplexMatter(classification: ComprehensiveLegalClassification): ComprehensiveForumMap`
- `identifyJurisdictionalIssues(matter: LegalMatter): JurisdictionalAnalysis`
- `recommendADROptions(classification: LegalClassification): ADRRecommendations`
- `assessInternationalElements(matter: LegalMatter): InternationalLawAnalysis`

**Comprehensive Authority Database**:
- **Federal Courts**: Federal Court, Federal Court of Appeal, Tax Court of Canada, Supreme Court of Canada
- **Provincial/Territorial Courts**: Superior courts, provincial courts, specialized courts (family, small claims)
- **Federal Tribunals**: Immigration and Refugee Board, Competition Tribunal, Transportation Appeal Tribunal
- **Provincial Tribunals**: Human rights tribunals, landlord-tenant boards, labour relations boards, securities tribunals
- **Professional Regulatory Bodies**: Law societies, medical colleges, engineering associations, accounting bodies
- **Ombudsman Services**: Federal ombudsman, provincial ombudsmen, sector-specific ombudsmen
- **Indigenous Authorities**: Band councils, tribal courts, Indigenous dispute resolution mechanisms
- **International Forums**: International Court of Justice, trade dispute panels, human rights bodies

**Inputs**: Comprehensive legal classification, jurisdictional factors, matter complexity
**Outputs**: Prioritized forum options, jurisdictional analysis, ADR recommendations, escalation paths

### AI Legal Research Engine

**Purpose**: Automated legal research with relevance scoring and precedent analysis

**Key Methods**:
- `conductLegalResearch(query: ResearchQuery, jurisdiction: string): ResearchResults`
- `analyzePrecedents(caseList: CaseReference[], currentFacts: FactPattern): PrecedentAnalysis`
- `identifyRelevantStatutes(legalIssue: LegalIssue, jurisdiction: string): StatuteAnalysis`
- `generateLegalSummary(researchResults: ResearchResults): LegalSummary`

**AI Capabilities**:
- Semantic search across case law databases
- Relevance scoring based on factual similarity
- Precedent strength analysis and distinguishing factors
- Automated legal principle extraction
- Citation network analysis for authority ranking

**Inputs**: Legal research queries, factual patterns, jurisdictional constraints
**Outputs**: Ranked case law results, statute analysis, legal principle summaries, citation networks

### AI Document Generation Engine

**Purpose**: Context-aware document creation with legal language optimization

**Key Methods**:
- `generateContextualDocument(template: DocumentTemplate, facts: FactPattern, jurisdiction: string): GeneratedDocument`
- `optimizeLegalLanguage(draft: DocumentDraft, audience: Audience): OptimizedDocument`
- `validateDocumentCompleteness(document: GeneratedDocument): ValidationResults`
- `suggestImprovements(document: GeneratedDocument): ImprovementSuggestions`

**AI Capabilities**:
- Context-aware template customization
- Legal language optimization for audience
- Completeness checking and gap identification
- Style and tone adjustment based on document type
- Automated citation formatting and verification

**Inputs**: Document templates, factual patterns, jurisdictional requirements, audience specifications
**Outputs**: Customized legal documents, validation reports, improvement suggestions, citation verification

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

**Estate & Succession (R20)**:
- Will challenges: Generally before probate or within 2 years
- Dependant support claims: 6 months from certificate of appointment (Succession Law Reform Act, Part V)
- Estate administration disputes: 2 years from discovery

**Child Protection (R21)**:
- N/A (information-only domain; no civil limitation periods)

**Debt & Insolvency (R22)**:
- Bankruptcy discharge: Variable (0-9 years depending on circumstances)
- Consumer proposal: 60 months (5 years) to complete payments
- Debt defense: 2 years from cause of action (Bankruptcy and Insolvency Act)

**Criminal Injuries Compensation (R23)**:
- CICB application: 2 years from incident (exceptions for dependent minors)
- Victim support: Ongoing as long as victim qualifies

**Property Tax Appeals (R24)**:
- Assessment Review Board: 45 days from assessment notice (Assessment Act s.40(12))
- Judicial review of ARB decision: 30 days

**Condominium Authority Tribunal (R25)**:
- CAT dispute resolution: Approximately 90 days (Condominium Act, 1998)
- Board decision implementation: Varies by dispute type

**Defamation & Anti-SLAPP (R26)**:
- Defamation claim: 2 years from discovery (Libel and Slander Act)
- Anti-SLAPP media notice: 6 weeks (Courts of Justice Act s.137.1)
- Responsible communication defense: Varies by circumstances

**Ontario-Specific Periods** (Across All Domains):
- **Municipal slip/fall notice**: 10 days (CRITICAL) - Municipalities Act
- **Construction lien preserve**: 60 days - Construction Act
- **Most civil claims**: 2 years from discovery - Limitations Act, 2002 s.4
- **Human rights complaints**: 1 year - Human Rights Code
- **Libel/slander notice requirement**: 6 weeks - Libel and Slander Act s.5(1)
- **OCPP court filings**: October 2025 Ontario Court Reforms
- **Ultimate backstop**: 15 years from act/omission - Limitations Act, 2002

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

### Backend Services Layer

The system is powered by six core backend services working in orchestration:

#### 1. Scenario Classifier Service
**Purpose**: AI-powered classification into 50+ Ontario scenarios (motor vehicle accidents, slip/fall, medical malpractice, defamation, breach of contract, debt, wrongful dismissal, HRTO complaints, LTB disputes, real estate, family law, wills, consumer protection, crime victim compensation, bankruptcy, property tax appeals, condo disputes, and more)

**Capabilities**: NLP classification, multi-scenario detection, confidence scoring, follow-up question generation

#### 2. Guidance Generator Service
**Purpose**: Generate personalized plain-language guidance

**Capabilities**: Step-by-step guidance (most urgent first), plain language explanations, deadline identification, resource/form recommendations, empathetic messaging

#### 3. Document Analyzer Service
**Purpose**: Analyze user-uploaded documents (PDF, PNG, JPG, EML, MSG, TXT)

**Capabilities**: Contract review, notice analysis, form completion assistance, metadata extraction, relevance assessment

#### 4. Deadline Calculator Service
**Purpose**: Calculate Ontario limitation periods and deadlines

**Key Periods**: 10-day municipal notice (CRITICAL), 60-day construction lien, 2-year general civil claims, 1-year HRTO, 6-week libel notice, 45-day property tax appeal, ~90-day CAT disputes, 6-week anti-SLAPP media notice, 15-year ultimate backstop

#### 5. Resource Locator Service
**Purpose**: Find forms, legal aid eligibility, legal clinics, self-help resources

**Integrations**: Central Forms Repository, Tribunals Ontario, Legal Aid Ontario, Law Society referral service

#### 6. Lawyer Referral Service
**Purpose**: Connect users with legal professionals

**Integrations**: Law Society of Ontario, Legal Aid Ontario, Community legal clinic network

### API Layer

**Base URL**: `/api/v1`

**Endpoints**:
1. `POST /api/v1/assess` - Scenario classification with confidence scores
2. `GET /api/v1/scenarios/{scenario_id}` - Scenario details (mva_tort, slip_fall, will_challenge, etc.)
3. `POST /api/v1/guidance` - Personalized step-by-step guidance
4. `POST /api/v1/deadlines/calculate` - Limitation period calculations
5. `POST /api/v1/documents/analyze` - Document analysis and extraction
6. `GET /api/v1/forms/{form_id}` - Official Ontario government forms (Form 7A, LTB forms, etc.)
7. `GET /api/v1/resources/clinics` - Legal clinic locator by postal code and domain
8. `POST /api/v1/cases` - Case creation and management (authenticated)
9. `GET /api/v1/resources/lawyer-referral` - Lawyer recommendations by domain and region

### Action Plan Generator

**Purpose**: Convert technical classifications into action-first user guidance with empathetic presentation

**Key Methods**:
- `generateActionPlan(classification: MatterClassification, evidence: EvidenceIndex): ActionPlan`
- `prioritizeActions(actions: Action[], urgency: UrgencyLevel): PrioritizedActionPlan`
- `generateRoleExplanation(domain: LegalDomain, pillar: LegalPillar): RoleExplanation`
- `identifySettlementPathways(classification: MatterClassification): SettlementOption[]`

**Action Plan Structure**:
1. **Acknowledgment**: Empathetic recognition of user's situation
2. **Immediate Actions**: "Do this first" prioritized steps (24-48 hours)
3. **Role Clarification**: User's specific role in the legal process
4. **Evidence Checklist**: Case-specific evidence gathering guidance
5. **Settlement Options**: Negotiation and alternative resolution pathways
6. **What to Avoid**: Specific warnings about common mistakes
7. **Next Steps Offers**: Conversational prompts for document generation

**Inputs**: Matter classification, evidence index, user profile, urgency assessment
**Outputs**: Structured action plan with empathetic messaging, prioritized steps, settlement alternatives

### User Interface Components

**Purpose**: Provide accessible, responsive web interface for all system functionality

**Key Components**:

#### Action-First Interface Components
- **AcknowledgmentBanner**: Empathetic opening statement recognizing user's situation
- **ImmediateActionsCard**: Numbered, prioritized action steps with urgency indicators
- **YourRoleExplainer**: Plain language explanation of user's role in legal process
- **SettlementPathwayCard**: Always-present alternatives to court proceedings
- **WhatToAvoidSection**: Specific warnings about common mistakes and pitfalls
- **NextStepsOffer**: Conversational prompts for document generation and next actions

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

### Frontend Component Architecture (From YAML Specification)

The frontend is organized around six core UI patterns implemented as React components:

#### 1. Conversational Intake Pattern
- **Purpose**: Guide users through matter classification using natural conversation
- **Components**: `ConversationalIntakeForm`, `ScenarioQuestionFlow`, `ProgressIndicator`
- **YAML Mapping**: `scenarios[*].intake` section with follow-up questions
- **User Experience**: Progressive disclosure questions, one question at a time, clear explanations
- **Output**: Populated MatterClassification with domain, jurisdiction, parties, urgency

#### 2. Scenario Card Pattern
- **Purpose**: Display available legal pathways as distinct scenarios with pros/cons
- **Components**: `ScenarioCard`, `ScenarioComparison`, `MultiPathwayDisplay`
- **YAML Mapping**: `scenarios[*].pathways` array with costs, timelines, pros/cons
- **User Experience**: No single "best" answer shown; all viable pathways presented
- **Output**: User selection of preferred pathway, feeds into document generation

#### 3. Step-by-Step Guide Pattern
- **Purpose**: Present procedural requirements in sequential, digestible steps
- **Components**: `StepByStepGuide`, `StepCard`, `SubtaskChecklist`
- **YAML Mapping**: `scenarios[*].process.steps` array with substeps and deadlines
- **User Experience**: Numbered steps, completion checkmarks, deadline indicators, expandable details
- **Output**: User progress tracking, next step prompts, completion validation

#### 4. Deadline Tracker Pattern
- **Purpose**: Visualize and remind users of critical dates and limitation periods
- **Components**: `DeadlineAlerts`, `TimelineVisualization`, `UrgencyBadge`
- **YAML Mapping**: `scenarios[*].deadlines` array with periods, exceptions, consequences
- **User Experience**: Color-coded urgency (critical red, warning orange, caution yellow), countdown timers
- **Output**: Exported deadline checklist, automated reminders (future feature)

#### 5. Document Checklist Pattern
- **Purpose**: Guide evidence gathering and document preparation for proceedings
- **Components**: `EvidenceChecklist`, `DocumentPreparationGuide`, `UploadIndicator`
- **YAML Mapping**: `scenarios[*].evidence_requirements` with file types, organization, submission guidance
- **User Experience**: Checkbox-based evidence tracking, file upload with progress, completeness scoring
- **Output**: Evidence manifest, package generation trigger, missing evidence alerts

#### 6. Form Helper Pattern
- **Purpose**: Assist users in completing Ontario government forms with evidence integration
- **Components**: `FormHelper`, `FieldGuidance`, `FormPreview`, `PrePopulation`
- **YAML Mapping**: `scenarios[*].forms` array with field mapping, hints, validation rules
- **User Experience**: Guided field completion, evidence-to-field mapping, real-time preview, error prevention
- **Output**: Pre-populated form data, completion checklist, form validation report

#### Supporting Patterns
- **LegalClinicLocator**: Search by postal code and legal domain for free/low-cost legal help
- **DocumentGenerator**: Interactive document creation with user confirmation at each step
- **EvidenceTimeline**: Chronological visualization of user-uploaded evidence with credibility scoring
- **AccessibilityAudit**: WCAG 2.1 AA compliance verification and keyboard navigation testing

## Data Models

### Agentic AI Decision-Support Kits Data Models

```typescript
interface BaseKit {
  kitId: string;
  name: string;
  description: string;
  targetDomains: ComprehensiveLegalDomain[];
  lifecycle: KitLifecycle;
  requiredComponents: string[];
  optionalComponents: string[];
  estimatedDuration: string;
  complexityLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface KitSession {
  sessionId: string;
  kitId: string;
  userId: string;
  currentStage: KitStage;
  stageHistory: KitStageHistory[];
  context: KitExecutionContext;
  results: KitStageResult[];
  startTime: Date;
  lastActivity: Date;
  status: 'active' | 'paused' | 'completed' | 'error';
}

interface KitExecutionContext {
  userProfile: UserProfile;
  matterClassification: ComprehensiveLegalClassification;
  evidenceIndex: EvidenceIndex;
  jurisdictionalFactors: JurisdictionalFactor[];
  urgencyAssessment: UrgencyAssessment;
  costConstraints: CostConstraints;
  preferredPathways: string[];
  sessionState: Record<string, any>;
}

interface KitStage {
  stageId: string;
  name: string;
  description: string;
  agent: AgentType;
  inputs: StageInputSchema[];
  outputs: StageOutputSchema[];
  validationRules: ValidationRule[];
  transitionConditions: TransitionCondition[];
  estimatedDuration: string;
}

interface KitStageResult {
  stageId: string;
  agent: AgentType;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  confidence: number;
  validationResults: ValidationResult[];
  recommendations: string[];
  nextSteps: string[];
  timestamp: Date;
}

interface AgentResponse {
  agentType: AgentType;
  confidence: number;
  recommendations: Recommendation[];
  questions: DynamicQuestion[];
  evidence: EvidenceRequirement[];
  pathways: PathwayOption[];
  warnings: Warning[];
  nextActions: NextAction[];
}

interface DynamicQuestion {
  questionId: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'number' | 'boolean';
  options?: QuestionOption[];
  validation: ValidationRule[];
  dependencies: QuestionDependency[];
  helpText?: string;
  required: boolean;
}

interface PathwayOption {
  pathwayId: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedCost: CostEstimate;
  estimatedTimeline: string;
  successProbability: number;
  requiredEvidence: EvidenceRequirement[];
  nextSteps: NextAction[];
  alternativePathways: string[];
}

interface KitResult {
  kitId: string;
  sessionId: string;
  completionStatus: 'complete' | 'partial' | 'abandoned';
  recommendations: Recommendation[];
  generatedDocuments: GeneratedDocument[];
  actionPlan: ActionPlan;
  pathwaySelection: PathwayOption;
  evidenceGaps: EvidenceGap[];
  followUpActions: NextAction[];
  referrals: ProfessionalReferral[];
  estimatedOutcome: OutcomeEstimate;
}

interface MultiKitSession {
  sessionId: string;
  userId: string;
  activeKits: KitSession[];
  coordinationStrategy: CoordinationStrategy;
  sharedContext: SharedKitContext;
  aggregatedResults: AggregatedGuidance;
  conflictResolution: ConflictResolution[];
  overallProgress: number;
  estimatedCompletion: Date;
}

interface AggregatedGuidance {
  prioritizedActions: PrioritizedAction[];
  consolidatedDocuments: GeneratedDocument[];
  unifiedTimeline: TimelineEvent[];
  resourceAllocation: ResourceAllocation;
  riskAssessment: RiskAssessment;
  successProbability: number;
  alternativeStrategies: AlternativeStrategy[];
}

type AgentType = 'intake' | 'analysis' | 'document' | 'guidance';
type KitStage = 'intake' | 'analysis' | 'document' | 'guidance' | 'complete';
```

### Enhanced Component Data Models

```typescript
interface EnhancedMatterClassification extends ComprehensiveLegalClassification {
  confidenceBreakdown: ConfidenceBreakdown;
  uncertaintyFactors: UncertaintyFactor[];
  classificationHistory: ClassificationStep[];
  agentRecommendations: AgentRecommendation[];
  refinementSuggestions: RefinementSuggestion[];
}

interface EnhancedActionPlan extends ActionPlan {
  dynamicPrioritization: DynamicPriority[];
  conditionalLogic: ConditionalStep[];
  adaptationTriggers: AdaptationTrigger[];
  progressTracking: ProgressMetric[];
  kitIntegration: KitIntegrationPoint[];
}

interface EnhancedDocumentPackage extends DocumentPackage {
  kitSpecificTemplates: KitTemplate[];
  evidenceFieldMapping: EvidenceFieldMap[];
  dynamicCustomization: CustomizationRule[];
  qualityAssessment: QualityMetric[];
  completenessValidation: CompletenessCheck[];
}

interface EnhancedLimitationPeriod extends LimitationPeriod {
  kitSpecificCalculation: KitDeadlineCalculation;
  urgencyEscalation: UrgencyEscalationRule[];
  dynamicAdjustment: TimelineAdjustment[];
  integrationPoints: KitIntegrationPoint[];
  contextualGuidance: ContextualGuidance[];
}

interface EnhancedCostCalculation extends CostCalculation {
  kitSpecificModeling: KitFinancialModel;
  dynamicRiskAssessment: DynamicRiskFactor[];
  settlementValuation: SettlementEstimate;
  pathwayOptimization: PathwayOptimization[];
  financialGuidance: FinancialGuidance[];
}
```

### Core AI-Enhanced Data Types

```typescript
interface ComprehensiveLegalClassification {
  primaryDomain: ComprehensiveLegalDomain;
  secondaryDomains?: ComprehensiveLegalDomain[];
  subDomains: string[];
  legalPillar: LegalPillar;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  confidenceScore: number;
  multiDomainFlags: MultiDomainFlag[];
  jurisdictionalFactors: JurisdictionalFactor[];
  internationalElements?: InternationalElement[];
  indigenousConsiderations?: IndigenousConsideration[];
  professionalRegulatoryAspects?: ProfessionalRegulatoryAspect[];
}

interface ComprehensiveLegalDomain {
  category: 'tort' | 'contract' | 'employment' | 'family' | 'criminal' | 'administrative' | 
           'immigration' | 'intellectual-property' | 'tax' | 'privacy' | 'professional-regulation' | 
           'indigenous' | 'international' | 'environmental' | 'securities' | 'competition' | 
           'human-rights' | 'consumer-protection' | 'real-estate' | 'corporate' | 'bankruptcy';
  subCategory: string;
  specialization?: string;
  regulatoryBody?: string;
  applicableLegislation: string[];
}

interface ComprehensiveForumMap {
  primaryPathways: ForumPathway[];
  alternativePathways: ForumPathway[];
  adrOptions: ADROption[];
  professionalRegulatoryOptions: ProfessionalRegulatoryOption[];
  ombudsmanOptions: OmbudsmanOption[];
  internationalOptions?: InternationalForumOption[];
  indigenousOptions?: IndigenousForumOption[];
  escalationSequence: string[];
  jurisdictionalAnalysis: JurisdictionalAnalysis;
  routingRationale: string;
  aiConfidenceScore: number;
}

interface MultiDomainAnalysis {
  primaryDomain: ComprehensiveLegalDomain;
  secondaryDomains: ComprehensiveLegalDomain[];
  domainInteractions: DomainInteraction[];
  prioritizationRecommendation: string;
  coordinatedApproachRequired: boolean;
  potentialConflicts: string[];
}

interface AIResearchResults {
  relevantCases: CaseReference[];
  applicableStatutes: StatuteReference[];
  legalPrinciples: LegalPrinciple[];
  precedentAnalysis: PrecedentAnalysis;
  confidenceScore: number;
  researchGaps: string[];
  recommendedFollowUp: string[];
}

interface GeneratedDocument {
  documentType: string;
  content: string;
  customizations: DocumentCustomization[];
  evidenceReferences: EvidenceReference[];
  legalCitations: LegalCitation[];
  completenessScore: number;
  validationResults: ValidationResult[];
  improvementSuggestions: string[];
}
```

### Comprehensive Authority Registry Schema

```typescript
interface ComprehensiveAuthorityRegistry {
  version: string;
  lastUpdated: Date;
  federalAuthorities: FederalAuthority[];
  provincialAuthorities: ProvincialAuthority[];
  territorialAuthorities: TerritorialAuthority[];
  indigenousAuthorities: IndigenousAuthority[];
  internationalAuthorities: InternationalAuthority[];
  professionalBodies: ProfessionalRegulatoryBody[];
  ombudsmanServices: OmbudsmanService[];
  adrProviders: ADRProvider[];
}

interface FederalAuthority {
  body: string;
  authorityType: 'court' | 'tribunal' | 'regulator' | 'ombuds' | 'enforcement';
  jurisdiction: 'federal';
  legalDomains: ComprehensiveLegalDomain[];
  relevanceTriggers: string[];
  filingRequirements: FilingRequirement[];
  appealRoutes: string[];
  timelineLimitations: TimelineLimitation[];
  fees: FeeStructure[];
  representationRules: RepresentationRule[];
}

interface ProfessionalRegulatoryBody {
  profession: string;
  regulatoryBody: string;
  jurisdiction: string;
  disciplinaryProcess: DisciplinaryProcess;
  complaintProcedure: ComplaintProcedure;
  appealRights: AppealRight[];
  publicRegister: boolean;
  investigationTimeline: string;
}

interface ADROption {
  type: 'mediation' | 'arbitration' | 'collaborative-law' | 'negotiation' | 'restorative-justice';
  provider: string;
  applicableDomains: ComprehensiveLegalDomain[];
  costStructure: CostStructure;
  timelineEstimate: string;
  bindingNature: 'binding' | 'non-binding' | 'conditional';
  enforcementMechanism: string;
}
```

### AI Service Integration Schema

```typescript
interface AIServiceConfiguration {
  nlpEngine: NLPEngineConfig;
  classificationModel: ClassificationModelConfig;
  researchEngine: ResearchEngineConfig;
  documentGenerator: DocumentGeneratorConfig;
  confidenceThresholds: ConfidenceThreshold[];
  fallbackProcedures: FallbackProcedure[];
}

interface NLPEngineConfig {
  modelVersion: string;
  languageSupport: string[];
  legalTerminologyDatabase: string;
  contextWindowSize: number;
  confidenceCalibration: ConfidenceCalibration;
}

interface ClassificationModelConfig {
  modelArchitecture: string;
  trainingDataVersion: string;
  legalTaxonomyVersion: string;
  multiDomainDetection: boolean;
  uncertaintyQuantification: boolean;
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

## Limitation Periods Across Legal Domains

The system implements Ontario-first limitation periods mapping for each legal domain, providing deadline alerts integrated into the intake and document generation workflows.

### Limitation Period Mapping by Domain

| Domain | Primary Period | Key Exceptions | Consequences | Statute/Reference |
|--------|---|---|---|---|
| **tort-negligence** | 2 years (discovery rule) | Ultimate 15-year backstop; No retroactivity to pre-Sept 2004 claims | Lost right to sue; Defendant gains limitation defense | *Limitations Act, 2002* s.4, 15, 16 |
| **civil-negligence** | 2 years (from discovery) | Occupiers' liability same period; Professional negligence (malpractice) 2-year discovery | Lost claim eligibility | *Limitations Act, 2002* |
| **contract-breach** | 2 years (discovery) | 15-year ultimate backstop | Debt recovery barred | *Limitations Act, 2002* |
| **employment-wrongful-dismissal** | 2 years (discovery rule) | ESA claims within 2 years | Lost damages claim | *Limitations Act, 2002*; *Employment Standards Act, 2000* |
| **employment-human-rights** | 1 year from last discriminatory act | Earlier notification to HRTO may waive limitation | Case dismissed | *Human Rights Code* s.34 |
| **landlord-tenant** | No written limitation but LTB acts on urgent basis | N/A | Eviction/possession risk continues | *Residential Tenancies Act, 2006* |
| **criminal** | No civil limitation (Crown timeline governs) | Crown disclosure deadline ~30-60 days | Varies by trial schedule | *Criminal Code* |
| **family-law-child-support** | No limitation for ongoing arrears | Claims >6 years likely require court order | Support enforcement | *Family Law Act, 1986*; *Child Support Guidelines* |
| **family-law-spousal-support** | 6 years for arrears > 6 months old | Retroactive claims beyond 6 years unlikely | Support enforcement | *Family Law Act, 1986* |
| **municipal-property-damage** | 10-day notice requirement (**CRITICAL**) | Must serve municipal insurer; Subsequent 2-year claim period | Lost statutory notice, claim barred | *Municipal Act, 2001* s.44; *Construction Lien Act* |
| **administrative-judicial-review** | 30 days from decision (federal); varies provincial | Extensions possible on grounds of justice | Application dismissed | *Judicial Review Procedure Act* |
| **administrative-property-tax-appeal** | 45 days from ARB/MPAC notice | Extensions for reasonable cause possible | Assessment stands | *Assessment Act* s.40, 43 |
| **administrative-condo-disputes** | ~90-day mandatory dispute resolution window | Small claims court option available after deadline | CAT claim dismissed if DRS required | *Condominium Act, 1998*; *Condo Authority Tribunal Rules* |
| **intellectual-property-copyright** | 2 years (discovery rule; 15-year ultimate) | Registration strengthens enforcement | Copyright protection lost | *Limitations Act, 2002* |
| **intellectual-property-trademark** | 2 years (discovery rule; 15-year ultimate) | Registration and use defense key | Trademark infringement claim barred | *Limitations Act, 2002* |
| **tax-cra-dispute** | 90 days to object (procedural); Statute of Limitations 4-6 years | Fairness claims may extend timeline | Assessment finalized | *Income Tax Act* s.165, 169 |
| **privacy-commissioner** | 12 months from knowledge of breach | Earlier notification recommended | Commissioner cannot investigate | *PIPEDA*; Provincial privacy laws |
| **professional-regulation-discipline** | Varies by profession (2-5 years typical) | College may extend investigation timelines | Disciplinary action barred | Profession-specific regulations |
| **consumerProtection** | Variable (usually 2 years for Small Claims route) | CPO investigation may exceed 2 years; Separate chargeback window 60-120 days | Claim/chargeback lost | *Consumer Protection Act, 2002*; Credit card networks |
| **legal-malpractice** | 2 years from discovery (within 15-year backstop) | "Case within a case" discovery rule applies | Malpractice claim dismissed | *Limitations Act, 2002* |
| **estate-succession** | 2 years from death or more for will challenges | Depends on discovery of grounds | Will challenge dismissed; Estate settled | *Succession Law Reform Act*; *Limitations Act, 2002* |
| **debt-insolvency** | Varies (creditor claims 6 years; Crown 10 years) | Insolvency discharge affects claims | Debt collection blocked; Bankruptcy discharged | *Bankruptcy and Insolvency Act*; *Limitations Act, 2002* |
| **victim-compensation** | 2 years from criminal incident | Application within 1-2 years preferred | CICB compensation barred | *Criminal Injuries Compensation Act* |
| **defamation-libel** | 6-week media notice (if applicable) + 2-year discovery | Media notice shortens timeline significantly | Media immunity may apply; Shortened discovery period | *Libel and Slander Act* s.5; *Limitations Act, 2002* |
| **defamation-anti-slapp** | 6-week media notice + procedural deadlines | Two-step test (merits + public interest) | Motion dismissed if improper; Proceeds to trial | *Courts of Justice Act* s.137.1 |

### YAML-to-Deadline Mapping

Each YAML scenario maps to one or more limitation periods:

```yaml
# Example: motor_vehicle_accident maps to tort-negligence
scenarios:
  - id: motor_vehicle_accident
    domain: tort-negligence
    deadlines:
      - period_id: tort-negligence
        description: "2-year limitation from date of discovery"
        critical_date: "2 years from accident date"
        urgency: warning
      - period_id: municipal-property-damage
        description: "10-day notice to municipality (if applicable)"
        critical_date: "10 days from incident"
        urgency: critical

  - id: defamation
    domain: defamation-libel
    deadlines:
      - period_id: defamation-media-notice
        description: "6-week media notice (if applicable)"
        critical_date: "6 weeks from publication"
        urgency: critical
      - period_id: defamation-discovery
        description: "2-year discovery from date of publication"
        critical_date: "2 years from publication"
        urgency: warning
```

### Integration with LimitationPeriodsEngine

The backend `LimitationPeriodsEngine` class provides methods to:
1. **Calculate relevant periods** for a given domain and jurisdiction
2. **Generate deadline alerts** with urgency levels (critical, warning, caution, info)
3. **Provide period-specific guidance** (consequences, exceptions, Learn More links)
4. **Detect municipal notice requirements** from matter description and tags
5. **Validate limitation period applicability** based on jurisdiction

These deadline alerts appear at:
- **Intake response**: Shown immediately after classification
- **Matter detail page**: Displayed above forum routing in supporting information
- **Document generation**: Included in generated packages as reminder
- **Evidence timeline**: Flagged against evidence dates to identify gaps

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