# Requirements Document

## Introduction

The Canadian Legal Assistant is a comprehensive legal information system designed to answer "Do I go to court?" by providing universal triage, forum routing, and evidence-grounded guidance across all Canadian legal domains. Operating with an Ontario-first, Canada-wide approach, the system serves as a compassionate navigator for legal newcomers facing their first encounter with the justice system.

**Mission Statement**: This system exists to guide legal newcomers through Ontario's complex legal landscape. It is not a tool for lawyers — it is a compassionate navigator for people facing their first eviction notice, their first car accident claim, or their first encounter with the justice system. Every feature must be designed with empathy, clarity, and accessibility as the primary concerns.

The system maintains strict boundaries to avoid unauthorized practice of law while providing valuable legal information, case law referencing, and document drafting assistance across domains including insurance, landlord/tenant, employment, family, criminal, immigration, human rights, privacy, tax, and administrative law.

## Core Design Principles

1. **Assume Zero Legal Knowledge**: Every user is assumed to have never encountered the legal system before
2. **Reduce Anxiety, Not Just Complexity**: Acknowledge emotional reality and provide reassurance
3. **One Step at a Time**: Progressive disclosure to reduce cognitive load
4. **Always Explain the WHY**: Help users understand the reasoning behind each step
5. **Safe Harbor Over Speed**: Encourage caution and professional consultation when in doubt

## Glossary

- **System**: The Canadian Legal Assistant system
- **Forum Routing**: Process of directing users to appropriate courts, tribunals, regulators, or ombudsman services
- **Matter Triage**: Initial classification of legal issues by domain, urgency, and appropriate resolution pathway
- **UPL**: Unauthorized Practice of Law - legal restrictions on non-lawyers providing legal advice
- **Evidence Manifest**: A structured record of all evidence sources, timestamps, and metadata for auditability
- **Authority Registry**: A mapping system connecting courts, tribunals, regulators, and ombudsman services to their triggers and constraints
- **CanLII**: Canadian Legal Information Institute - legal research database with access restrictions
- **e-Laws**: Ontario's official online legislation publisher
- **Justice Laws Website**: Federal government's official legislation publisher
- **Case Law Referencing**: Providing citations, links, and evidence-grounded summaries of judicial decisions
- **Forum Map**: Output showing available legal pathways and their proper sequence
- **Evidence Credibility Score**: Assessment of evidence quality based on source type and metadata completeness
- **Currency Date**: The date indicating when a legal consolidation was last updated
- **Scoped Handoff**: Guidance directing users to appropriate bodies when matters fall outside system scope
- **LTB**: Landlord and Tenant Board (Ontario)
- **HRTO**: Human Rights Tribunal of Ontario
- **FSRA**: Financial Services Regulatory Authority of Ontario
- **GIO**: General Insurance OmbudService
- **IPC**: Information and Privacy Commissioner of Ontario
- **OPC**: Office of the Privacy Commissioner of Canada
- **Four Pillars**: Classification framework for legal matters (Criminal, Civil, Administrative, Quasi-Criminal)
- **Journey Tracker**: Five-stage framework for guiding users through legal processes
- **Plain Language Layer**: Translation system converting legal terms to accessible language
- **Limitation Period**: Legal deadline to start a case or take action
- **OCPP**: Ontario Courts Public Portal - new filing system as of October 2025
- **DC-PD**: Direct Compensation Property Damage - Ontario's unique auto insurance system
- **Cost Exposure**: Financial risk a user faces if they lose their legal case
- **AI-Powered Classification**: Machine learning system for analyzing complex legal scenarios and multi-domain cases
- **Comprehensive Legal Taxonomy**: Detailed categorization system covering all areas of Canadian law including torts, contracts, employment, family, administrative, immigration, IP, tax, and privacy law
- **Multi-Domain Analysis**: AI capability to identify cases that span multiple legal areas and require coordinated approach
- **Jurisdictional Routing**: AI-enhanced system for routing matters across federal, provincial, territorial, and Indigenous jurisdictions
- **Professional Regulatory Bodies**: Colleges and regulatory authorities governing licensed professionals (lawyers, doctors, engineers, etc.)
- **Alternative Dispute Resolution (ADR)**: Non-court resolution methods including mediation, arbitration, and collaborative law
- **Indigenous Law Considerations**: Cultural and jurisdictional factors relevant to Indigenous legal matters
- **International Law Elements**: Cross-border legal issues requiring consideration of international treaties and forums

## Requirements

### Requirement 1

**User Story:** As a person with a legal issue, I want the system to triage my matter and route me to the appropriate forum, so that I understand my options and follow the correct procedural sequence.

#### Acceptance Criteria

1. WHEN a user describes their legal issue, THE System SHALL collect jurisdiction, domain, parties involved, timeline, urgency, and dispute amount
2. WHEN classifying legal domains, THE System SHALL categorize matters into insurance, landlord/tenant, employment, family, criminal, immigration, human rights, consumer/contracts, privacy, administrative/tribunal, tax, IP, or other
3. WHEN routing to forums, THE System SHALL prioritize statutory tribunal or complaint processes before court options where mandated
4. WHEN routing to a court, THE System SHALL determine likely court level using parameters including claim value, subject matter, relief sought, and originating forum
5. WHEN a matter originates from a tribunal decision, THE System SHALL distinguish "appeal" vs "judicial review" pathways and ask for statute/tribunal decision type if unclear
6. WHEN venue depends on location, THE System SHALL collect location facts and include them in the routing rationale
7. WHEN the user provides dates, THE System SHALL assess whether the matter may be time-sensitive and flag "deadline risk" with a prompt to verify limitation/appeal timelines
8. WHEN deadlines cannot be verified, THE System SHALL state uncertainty and recommend consulting authoritative guidance or a licensee promptly
9. WHEN producing forum maps, THE System SHALL show available pathways with proper sequence and explain routing rationale
10. WHERE insufficient facts exist for routing, THE System SHALL produce targeted question sets rather than guessing

### Requirement 2

**User Story:** As a legal information seeker, I want access to case law references and legislative citations, so that I can understand the legal framework applicable to my situation.

#### Acceptance Criteria

1. WHEN providing case law references, THE System SHALL use only CanLII official API, linking, or user-provided documents
2. WHEN CanLII API returns metadata-only, THE System SHALL NOT reconstruct full text through web scraping
3. WHEN citing Ontario legislation, THE System SHALL use e-Laws with currency dates or retrieval dates
4. WHEN citing federal legislation, THE System SHALL use Justice Laws Website with bilingual official text
5. WHEN providing case law summaries, THE System SHALL produce short summaries grounded in citations/links and SHALL NOT reproduce lengthy verbatim excerpts beyond fair-use-friendly snippets
6. WHEN the user requests full decisions, THE System SHALL provide links and retrieval instructions via permitted methods, not bulk text reproduction
7. WHEN case law retrieval fails, THE System SHALL report failure rather than inventing citations

### Requirement 3

**User Story:** As a user preparing legal documentation, I want the system to draft documents based on my evidence and confirmed facts, so that I can submit accurate and well-structured materials.

#### Acceptance Criteria

1. WHEN drafting documents, THE System SHALL base all factual claims on user-provided evidence or user-confirmed information
2. WHEN generating templates, THE System SHALL create domain-appropriate documents including complaint letters, demand letters, notices, and checklists
3. WHEN creating document packages, THE System SHALL use standardized folder naming and include source manifests
4. WHEN packaging outputs, THE System SHALL include forum map, timeline, missing evidence checklist, draft documents, source manifest, and evidence manifest
5. WHERE factual assertions are inserted into drafts, THE System SHALL require user confirmation before inclusion

### Requirement 4

**User Story:** As a system administrator, I want to ensure only lawful data acquisition methods are used, so that the system complies with terms of service and legal restrictions across all sources.

#### Acceptance Criteria

1. WHEN accessing any source, THE System SHALL use only explicitly permitted methods including official browse, official download, official API, or user-provided documents
2. WHEN terms of service prohibit bulk or systematic downloading, THE System SHALL block scraping and crawling attempts
3. WHEN accessing court, tribunal, or regulator sites, THE System SHALL record retrieval dates for procedural guidance that may change
4. THE System SHALL maintain a versioned authority registry with update cadence and retrieval dates
5. WHEN generating a forum map, THE System SHALL cite which registry entries triggered the routing decision
6. IF source access is unclear or prohibited, THEN THE System SHALL default to deny and require compliance verification
7. WHEN enforcement actions occur, THE System SHALL log all source access decisions and blocks

### Requirement 5

**User Story:** As a user uploading evidence, I want my documents processed into structured timelines with gap detection, so that I can organize my case materials effectively and identify missing documentation.

#### Acceptance Criteria

1. WHEN a user uploads evidence files, THE System SHALL accept PDF, PNG, JPG, EML, MSG, and TXT formats
2. WHEN processing uploaded evidence, THE System SHALL extract metadata including dates, sender/recipient information, and document type
3. WHEN evidence is processed, THE System SHALL generate an evidence_index.yaml file with attachment IDs, filenames, dates, summaries, provenance labels, tags, and hashes
4. WHEN building timelines, THE System SHALL produce chronological timeline.md files and flag missing critical artifacts
5. WHEN an email is provided as a screenshot, THE System SHALL recommend uploading EML/MSG files and label screenshots as "visual evidence (unverified headers)"
6. WHEN generating the evidence manifest, THE System SHALL assign an Evidence Credibility Score based on provenance, metadata completeness, and timestamp confidence
7. WHEN handling evidence, THE System SHALL automatically redact addresses, phone numbers, policy numbers, account numbers, dates of birth, and social insurance numbers by default

### Requirement 6

**User Story:** As a compliance officer, I want all system outputs to be auditable with complete source tracking, so that we can verify the basis for all generated content and maintain regulatory compliance.

#### Acceptance Criteria

1. WHEN generating any output, THE System SHALL include source manifests with URLs, retrieval dates, and version information
2. WHEN using evidence in outputs, THE System SHALL cite by attachment index and timestamp rather than asserting as external fact
3. WHEN creating evidence manifests, THE System SHALL include cryptographic hashes for integrity verification and provenance labels
4. WHEN producing evidence manifests, THE System SHALL record evidence type and confidence level for metadata extraction
5. WHEN citing legislation, THE System SHALL include currency dates or retrieval dates if currency dates are unavailable
6. WHEN using procedural guidance, THE System SHALL record retrieval dates and version identifiers in source manifests
7. WHEN storing user data, THE System SHALL use tenant-isolated storage with encryption at rest and in transit
8. WHEN processing is complete, THE System SHALL maintain audit logs of data access, export, deletion, and source access decisions

### Requirement 7

**User Story:** As a legal information system, I want to maintain strict UPL compliance boundaries across all legal domains, so that I provide information without crossing into legal advice.

#### Acceptance Criteria

1. WHEN generating any output, THE System SHALL include legal information disclaimers stating outputs are not legal advice
2. WHEN analyzing user situations, THE System SHALL present multiple lawful pathways rather than selecting a single "best" path
3. WHEN the system cannot locate authoritative sources for legal claims, THE System SHALL state verification failure and provide next steps
4. WHEN generating legal requirement statements, THE System SHALL refuse to produce uncited rules without authoritative source citations
5. IF users request legal advice, THEN THE System SHALL switch to options-based guidance and recommend consulting a licensed professional
6. WHEN drafting documents, THE System SHALL use factual, restrained language that requests information rather than making legal demands
7. WHERE regulatory or court processes are described, THE System SHALL explain procedures without recommending specific legal strategies

### Requirement 8

**User Story:** As a user with different types of legal matters, I want the system to handle domain-specific requirements appropriately, so that I receive relevant guidance for my specific legal situation.

#### Acceptance Criteria

1. WHEN the matter involves insurance disputes, THE System SHALL generate internal complaint letters, ombudsman letters, GIO submissions, and FSRA conduct complaints as appropriate
2. WHEN landlord/tenant issues are identified, THE System SHALL provide LTB intake checklists, notice templates, and evidence packs
3. WHEN employment matters are classified, THE System SHALL generate demand letter templates, complaint intake checklists, and evidence packs
4. WHEN human rights issues are identified, THE System SHALL provide HRTO intake checklists and chronology templates
5. WHEN family law matters are classified, THE System SHALL provide process overviews, document checklists, and timeline templates
6. WHEN criminal matters are identified, THE System SHALL provide process overviews, rights summaries, and resource lists
7. WHEN privacy matters are classified, THE System SHALL generate access request templates and regulator complaint templates
8. IF a matter falls outside supported jurisdictional specificity, THEN THE System SHALL provide a scoped handoff describing the most relevant body/process and minimum facts needed
9. WHERE multiple legal domains are present, THE System SHALL prioritize the most appropriate pathway based on the authority registry

### Requirement 9

**User Story:** As a system administrator, I want to manage data lifecycle and user privacy rights, so that the system complies with privacy regulations and provides users control over their data.

#### Acceptance Criteria

1. THE System SHALL support user-initiated export of all artifacts including letters, manifests, timelines, and forum maps
2. THE System SHALL support user-initiated deletion of stored evidence subject to configurable legal hold settings
3. THE System SHALL define configurable retention defaults with 60-day default for different data types
4. WHEN retention periods expire, THE System SHALL automatically purge user data unless legal holds are active
5. THE System SHALL maintain audit logs of data access, export, and deletion activities for compliance purposes

### Requirement 11

**User Story:** As a legal newcomer, I want the system to guide me through a clear journey with plain language explanations, so that I can understand each step without legal training.

#### Acceptance Criteria

1. WHEN a user begins their legal journey, THE System SHALL classify their matter using the Four Pillars framework (Criminal, Civil, Administrative, Quasi-Criminal)
2. WHEN presenting legal information, THE System SHALL use plain language as the default with legal terms provided as supplementary information
3. WHEN guiding users through processes, THE System SHALL implement the five-stage journey framework (Understand, Options, Prepare, Act, Resolve)
4. WHEN displaying legal terms, THE System SHALL provide inline plain language translations with contextual explanations
5. WHEN users progress through their journey, THE System SHALL show current stage, completed steps, next actions, and progress percentage
6. WHEN explaining legal processes, THE System SHALL always explain the reasoning behind each step to build user understanding
7. WHERE users feel overwhelmed, THE System SHALL use progressive disclosure to reveal information one step at a time

### Requirement 12

**User Story:** As someone facing legal deadlines, I want the system to track limitation periods and alert me with appropriate urgency, so that I don't lose my right to pursue my case.

#### Acceptance Criteria

1. WHEN a user describes their legal matter, THE System SHALL identify applicable limitation periods based on Ontario law and matter type
2. WHEN limitation periods are identified, THE System SHALL calculate exact deadlines and days remaining
3. WHEN deadlines are approaching, THE System SHALL display alerts with increasing urgency (Critical ≤7 days, Warning ≤30 days, Caution ≤90 days)
4. WHEN municipal property is involved, THE System SHALL immediately flag the 10-day notice requirement with urgent messaging
5. WHEN deadlines cannot be verified, THE System SHALL state uncertainty and recommend immediate professional consultation
6. WHEN displaying deadlines, THE System SHALL explain consequences of missing them in plain language
7. WHERE multiple deadlines apply, THE System SHALL prioritize the most urgent and critical deadlines first

### Requirement 13

**User Story:** As someone considering legal action, I want to understand the financial risks and costs involved, so that I can make informed decisions about proceeding.

#### Acceptance Criteria

1. WHEN users consider litigation options, THE System SHALL explain potential cost exposure if they lose their case
2. WHEN displaying forum options, THE System SHALL show typical cost ranges for each court or tribunal
3. WHEN users have low income indicators, THE System SHALL proactively suggest fee waiver options
4. WHEN explaining costs, THE System SHALL distinguish between filing fees, legal fees, and potential cost awards
5. WHEN cost exposure is high, THE System SHALL emphasize the financial risks and suggest professional consultation
6. WHEN fee waivers are available, THE System SHALL provide eligibility criteria and application guidance
7. WHERE cost information is uncertain, THE System SHALL provide ranges and recommend getting specific legal advice

### Requirement 14

**User Story:** As someone with an Ontario-specific legal matter, I want guidance tailored to Ontario's unique laws and procedures, so that I receive accurate and current information.

#### Acceptance Criteria

1. WHEN handling motor vehicle accidents in Ontario, THE System SHALL explain the Direct Compensation Property Damage (DC-PD) system
2. WHEN Small Claims Court is relevant, THE System SHALL use the current $50,000 jurisdiction limit (October 2025 update)
3. WHEN Toronto Region filings are required, THE System SHALL provide Ontario Courts Public Portal (OCPP) specifications
4. WHEN landlord-tenant disputes are identified, THE System SHALL route to LTB-specific guidance and forms
5. WHEN tree damage cases involve municipal property, THE System SHALL immediately flag the 10-day notice requirement
6. WHEN employment matters arise, THE System SHALL distinguish between Employment Standards Act complaints and civil wrongful dismissal claims
7. WHERE Ontario-specific procedures apply, THE System SHALL prioritize provincial requirements over general Canadian guidance

### Requirement 15

**User Story:** As a legal newcomer facing my first encounter with the justice system, I want an action-first user experience that tells me what to do next, so that I can take immediate steps without being overwhelmed by technical classifications.

#### Acceptance Criteria

1. WHEN a user describes their legal issue, THE System SHALL lead with immediate actionable steps rather than technical classification details
2. WHEN presenting guidance, THE System SHALL use empathetic acknowledgment language that recognizes the user's emotional state
3. WHEN explaining legal processes, THE System SHALL clarify the user's specific role (witness, plaintiff, complainant) in plain language
4. WHEN providing options, THE System SHALL always include settlement pathways and negotiation alternatives alongside court processes
5. WHEN generating action plans, THE System SHALL prioritize steps by urgency with clear "Do this first" guidance
6. WHEN users might make mistakes, THE System SHALL include "What to Avoid" sections with specific warnings
7. WHEN offering next steps, THE System SHALL use conversational language like "Would you like us to..." rather than technical button labels

### Requirement 16

**User Story:** As someone considering legal action, I want to understand all available resolution pathways including settlement options, so that I can make informed decisions about the best approach for my situation.

#### Acceptance Criteria

1. WHEN presenting forum options, THE System SHALL always mention settlement and negotiation as primary alternatives to court
2. WHEN explaining legal processes, THE System SHALL include statistics about settlement rates and typical outcomes
3. WHEN generating document options, THE System SHALL offer demand letters and negotiation templates before court filings
4. WHEN assessing disputes, THE System SHALL explain the benefits and risks of settlement versus litigation
5. WHEN routing to forums, THE System SHALL present internal complaint processes and ombudsman options before court
6. WHEN cost calculations are shown, THE System SHALL compare settlement costs versus litigation expenses
7. WHERE applicable, THE System SHALL explain insurance subrogation and third-party payment options

### Requirement 17

**User Story:** As a user with complex legal scenarios, I want the system to leverage AI-powered classification and comprehensive legal taxonomy, so that I receive accurate guidance across all areas of Canadian law.

#### Acceptance Criteria

1. WHEN classifying legal matters, THE System SHALL use AI-powered scenario analysis to identify complex multi-domain cases
2. WHEN handling tort law matters, THE System SHALL distinguish between negligence, intentional torts, strict liability, and defamation cases
3. WHEN processing contract disputes, THE System SHALL identify breach types, remedies available, and limitation periods
4. WHEN employment issues arise, THE System SHALL differentiate between wrongful dismissal, human rights violations, workplace safety, and employment standards
5. WHEN family law matters are presented, THE System SHALL route appropriately between divorce, custody, support, and property division
6. WHEN administrative law issues are identified, THE System SHALL distinguish between judicial review, statutory appeals, and regulatory compliance
7. WHEN immigration matters are classified, THE System SHALL identify visa types, appeal processes, and humanitarian considerations
8. WHEN intellectual property issues arise, THE System SHALL distinguish between copyright, trademark, patent, and trade secret matters
9. WHEN tax disputes are identified, THE System SHALL route between CRA objections, Tax Court, and provincial tax authorities
10. WHEN privacy matters are classified, THE System SHALL distinguish between federal and provincial privacy commissioners and applicable legislation

### Requirement 18

**User Story:** As a legal information system administrator, I want comprehensive forum and authority databases with AI-enhanced routing, so that users receive accurate pathway guidance across all Canadian jurisdictions.

#### Acceptance Criteria

1. WHEN routing matters, THE System SHALL access comprehensive databases of federal, provincial, and territorial courts
2. WHEN tribunal routing is required, THE System SHALL include specialized tribunals for each legal domain and jurisdiction
3. WHEN regulatory matters arise, THE System SHALL route to appropriate federal and provincial regulatory bodies
4. WHEN ombudsman services are relevant, THE System SHALL include federal, provincial, and sector-specific ombudsman offices
5. WHEN professional regulatory matters arise, THE System SHALL route to appropriate professional colleges and regulatory bodies
6. WHEN Indigenous law matters are identified, THE System SHALL provide appropriate cultural and jurisdictional guidance
7. WHEN international law elements are present, THE System SHALL identify relevant international forums and treaties
8. WHEN alternative dispute resolution is appropriate, THE System SHALL suggest mediation, arbitration, and collaborative law options

### Requirement 19

**User Story:** As a user requiring legal guidance, I want AI-powered document generation and legal research assistance, so that I can access sophisticated legal tools while maintaining UPL compliance.

#### Acceptance Criteria

1. WHEN generating documents, THE System SHALL use AI to customize templates based on specific case facts and jurisdiction
2. WHEN conducting legal research, THE System SHALL use AI to identify relevant cases, statutes, and regulations
3. WHEN analyzing legal precedents, THE System SHALL provide AI-generated summaries while maintaining citation accuracy
4. WHEN drafting correspondence, THE System SHALL use AI to ensure appropriate tone and legal language
5. WHEN creating legal arguments, THE System SHALL use AI to identify supporting authorities and counter-arguments
6. WHEN reviewing documents, THE System SHALL use AI to identify potential issues and missing elements
7. WHEN providing legal analysis, THE System SHALL maintain strict UPL boundaries with AI-generated disclaimers

### Requirement 20

**User Story:** As someone dealing with the death of a loved one or an estate dispute, I want information about wills, estates, and probate procedures, so that I can understand my rights and navigate succession law.

#### Acceptance Criteria

1. WHEN an estate or will matter is identified, THE System SHALL explain will challenge grounds under Ontario law (lack of capacity, undue influence, failure of formalities)
2. WHEN a user describes an estate dispute, THE System SHALL identify the applicable legal framework (Succession Law Reform Act, Rules of Civil Procedure)
3. WHEN probate procedures are relevant, THE System SHALL explain the estate administration timeline and key deadlines (court application, publicity period, final accounting)
4. WHEN a dependant support claim is possible, THE System SHALL explain rights and procedures under the Succession Law Reform Act Part V
5. WHEN estate composition is relevant, THE System SHALL explain tax considerations and debts that affect distribution
6. WHEN multiple heirs are involved, THE System SHALL explain potential disputes over interpretation and distribution
7. WHERE estate matters are complex, THE System SHALL provide escalation pathways to estate counsel and provincial Court of Justice or Superior Court

### Requirement 21

**User Story:** As someone concerned about a child's safety or dealing with child protection involvement, I want information-only guidance about Children and Family Services Act procedures, so that I understand my options if CAS is involved.

#### Acceptance Criteria

1. WHEN a child protection matter is identified, THE System SHALL provide clear disclaimer that this is INFORMATION ONLY and is not a substitute for immediate legal advice
2. WHEN CAS involvement is present or imminent, THE System SHALL explain apprehension procedures and parental rights (acknowledgment notice, assessment)
3. WHEN a child protection court hearing is required, THE System SHALL explain hearing procedures, parental roles, and representation options
4. WHEN domestic violence or child abuse is disclosed, THE System SHALL explain mandatory reporting obligations and victim support resources
5. WHEN parents lack resources, THE System SHALL explain duty counsel availability and legal aid eligibility for child protection cases
6. WHEN children are involved in disputes, THE System SHALL explain the child's best interests standard and participation rights
7. WHERE child protection is suspected, THE System SHALL provide immediate escalation to duty counsel and local CAS office contact information

### Requirement 22

**User Story:** As someone facing overwhelming debt or personal insolvency, I want information about bankruptcy and consumer proposal options, so that I can understand federal insolvency procedures and find qualified help.

#### Acceptance Criteria

1. WHEN insolvency or overwhelming debt is identified, THE System SHALL distinguish between consumer proposals and bankruptcy under the Bankruptcy and Insolvency Act
2. WHEN debt counseling is relevant, THE System SHALL explain credit counseling as a prerequisite and provide approved credit counselor contact information
3. WHEN a consumer proposal is considered, THE System SHALL explain the process, timeline, and requirements for creditor approval (Bankruptcy Act ss.66-66.38)
4. WHEN bankruptcy is discussed, THE System SHALL explain discharge process, asset implications, and timeline to debt release
5. WHEN a Licensed Insolvency Practitioner is needed, THE System SHALL explain their role and credentials required under federal law
6. WHEN creditor defenses are possible, THE System SHALL identify situations where creditors might oppose discharge (fraud, undisclosed debts)
7. WHERE insolvency procedures are required, THE System SHALL provide routing to Licensed Insolvency Practitioners and provincial insolvency authorities

### Requirement 23

**User Story:** As someone injured by crime, I want information about Criminal Injuries Compensation Board (CICB) claims and victim services, so that I can understand compensation eligibility and civil remedies available.

#### Acceptance Criteria

1. WHEN a victim of crime is identified, THE System SHALL explain CICB eligibility criteria, compensation categories (medical, earnings loss, counseling), and application process
2. WHEN crime-related injury occurred, THE System SHALL explain CICB application deadlines and procedures (application forms, supporting evidence requirements)
3. WHEN victim services are needed, THE System SHALL provide information about Ontario's victim support programs, counseling, and safety planning services
4. WHEN civil remedies are possible, THE System SHALL explain options for civil suits against perpetrators if CICB does not fully compensate
5. WHEN victim-offender mediation might apply, THE System SHALL explain the process and eligibility criteria
6. WHEN restitution orders are relevant, THE System SHALL explain how victim restitution can be ordered in criminal proceedings
7. WHERE CICB claims are complex, THE System SHALL provide escalation to victim services agencies and legal clinics specializing in victim support

### Requirement 24

**User Story:** As a homeowner or property occupier challenging a property tax assessment, I want guidance about Assessment Review Board procedures, so that I can understand how to appeal my property assessment.

#### Acceptance Criteria

1. WHEN a property tax dispute is identified, THE System SHALL explain the Assessment Review Board (ARB) jurisdiction and applicable deadline (45 days from assessment notice)
2. WHEN property assessment is disputed, THE System SHALL explain how MPAC (Municipal Property Assessment Corporation) conducts assessments and grounds for challenge
3. WHEN an assessment appeal is considered, THE System SHALL explain required evidence (comparable properties, market conditions, property defects) and assessment methodology
4. WHEN municipal property taxes are challenged, THE System SHALL distinguish between property assessment appeals and tax billing disputes
5. WHEN appeals fail at ARB level, THE System SHALL explain options for judicial review and Superior Court appeals
6. WHEN evidence is required, THE System SHALL explain expert appraisal requirements, market analysis, and assessment comparables
7. WHERE assessment disputes require expert evidence, THE System SHALL provide routing to real property appraisers and tax appeal specialists

### Requirement 25

**User Story:** As a condominium owner or resident involved in a condo dispute, I want information about Condominium Authority Tribunal (CAT) procedures, so that I can understand how to resolve condo-related disputes.

#### Acceptance Criteria

1. WHEN a condominium dispute is identified, THE System SHALL explain Condominium Authority Tribunal (CAT) jurisdiction under the Condominium Act, 1998
2. WHEN a condo dispute is described, THE System SHALL identify the applicable dispute type (pet policy, parking, records access, fee disputes, architectural changes)
3. WHEN CAT procedures are relevant, THE System SHALL explain the mandatory dispute resolution process, timeline (typically 90 days), and evidence requirements
4. WHEN fees or special levies are disputed, THE System SHALL explain owner rights and defenses regarding assessment validity and procedure
5. WHEN record access is denied, THE System SHALL explain owner rights to condominium documents under the Condominium Act
6. WHEN board decisions are challenged, THE System SHALL explain grounds for challenging rules, bylaws, and board determinations
7. WHERE condo disputes are complex, THE System SHALL provide routing to CAT and condo law specialists

### Requirement 26

**User Story:** As someone who has been defamed or faces a defamation suit, I want information about defamation law and anti-SLAPP procedures, so that I can understand my rights and legal options.

#### Acceptance Criteria

1. WHEN a defamation matter is identified, THE System SHALL explain defamation elements (false statements, reputation harm, publication, damages) and available defenses (truth, opinion, privilege, fair reporting)
2. WHEN media defendants are involved, THE System SHALL explain the 6-week media notice requirement under Libel and Slander Act and impact on proceedings
3. WHEN an anti-SLAPP motion is relevant, THE System SHALL explain Procedure for Relief Against SLAPP claims under Courts of Justice Act s.137.1
4. WHEN a SLAPP defendant applies for relief, THE System SHALL explain the two-step test (cause of action no reasonable prospect of success, public interest balance)
5. WHEN defamation is on digital platforms or social media, THE System SHALL explain platform liability distinctions, takedown procedures, and jurisdiction issues
6. WHEN damages are relevant, THE System SHALL explain compensatory versus aggravated/punitive damages, and cost award risks in defamation cases
7. WHERE defamation disputes are complex, THE System SHALL provide routing to defamation specialists and media law counsel
8. WHEN AI confidence is low, THE System SHALL clearly indicate uncertainty and recommend professional consultation

### Requirement 10

**User Story:** As a user interacting with the system, I want an intuitive and accessible web interface, so that I can easily navigate through matter intake, evidence upload, and document generation processes.

#### Acceptance Criteria

1. WHEN a user accesses the system, THE System SHALL provide a responsive web interface that works on desktop, tablet, and mobile devices
2. WHEN displaying forms and interfaces, THE System SHALL comply with WCAG 2.1 AA accessibility standards including keyboard navigation and screen reader support
3. WHEN users upload evidence files, THE System SHALL provide drag-and-drop functionality with progress indicators and validation feedback
4. WHEN displaying forum routing results, THE System SHALL visualize available pathways with clear explanations and disclaimers
5. WHEN generating documents, THE System SHALL provide preview functionality with user confirmation prompts for factual assertions
6. WHEN errors occur, THE System SHALL display clear, actionable error messages with suggested next steps
7. WHEN displaying legal information, THE System SHALL prominently show disclaimers that outputs are information, not legal advice

### Requirement 20

**User Story:** As someone dealing with the death of a loved one or an estate dispute, I want information about wills, estates, and probate procedures, so that I can understand my rights and navigate succession law.

#### Acceptance Criteria

1. WHEN an estate or will matter is identified, THE System SHALL explain will challenge grounds under Ontario law (lack of capacity, undue influence, failure of formalities)
2. WHEN a user describes an estate dispute, THE System SHALL identify the applicable legal framework (Succession Law Reform Act, Rules of Civil Procedure)
3. WHEN probate procedures are relevant, THE System SHALL explain the estate administration timeline and key deadlines (court application, publicity period, final accounting)
4. WHEN a dependant support claim is possible, THE System SHALL explain rights and procedures under the Succession Law Reform Act Part V
5. WHEN estate composition is relevant, THE System SHALL explain tax considerations and debts that affect distribution
6. WHEN multiple heirs are involved, THE System SHALL explain potential disputes over interpretation and distribution
7. WHERE estate matters are complex, THE System SHALL provide escalation pathways to estate counsel and provincial Court of Justice or Superior Court

### Requirement 21

**User Story:** As someone concerned about a child's safety or dealing with child protection involvement, I want information-only guidance about Children and Family Services Act procedures, so that I understand my options if CAS is involved.

#### Acceptance Criteria

1. WHEN a child protection matter is identified, THE System SHALL provide clear disclaimer that this is INFORMATION ONLY and is not a substitute for immediate legal advice
2. WHEN CAS involvement is present or imminent, THE System SHALL explain apprehension procedures and parental rights (acknowledgment notice, assessment)
3. WHEN a child protection court hearing is required, THE System SHALL explain hearing procedures, parental roles, and representation options
4. WHEN domestic violence or child abuse is disclosed, THE System SHALL explain mandatory reporting obligations and victim support resources
5. WHEN parents lack resources, THE System SHALL explain duty counsel availability and legal aid eligibility for child protection cases
6. WHEN children are involved in disputes, THE System SHALL explain the child's best interests standard and participation rights
7. WHERE child protection is suspected, THE System SHALL provide immediate escalation to duty counsel and local CAS office contact information

### Requirement 22

**User Story:** As someone facing overwhelming debt or personal insolvency, I want information about bankruptcy and consumer proposal options, so that I can understand federal insolvency procedures and find qualified help.

#### Acceptance Criteria

1. WHEN insolvency or overwhelming debt is identified, THE System SHALL distinguish between consumer proposals and bankruptcy under the Bankruptcy and Insolvency Act
2. WHEN debt counseling is relevant, THE System SHALL explain credit counseling as a prerequisite and provide approved credit counselor contact information
3. WHEN a consumer proposal is considered, THE System SHALL explain the process, timeline, and requirements for creditor approval (Bankruptcy Act ss.66-66.38)
4. WHEN bankruptcy is discussed, THE System SHALL explain discharge process, asset implications, and timeline to debt release
5. WHEN a Licensed Insolvency Practitioner is needed, THE System SHALL explain their role and credentials required under federal law
6. WHEN creditor defenses are possible, THE System SHALL identify situations where creditors might oppose discharge (fraud, undisclosed debts)
7. WHERE insolvency procedures are required, THE System SHALL provide routing to Licensed Insolvency Practitioners and provincial insolvency authorities

### Requirement 23

**User Story:** As someone injured by crime, I want information about Criminal Injuries Compensation Board (CICB) claims and victim services, so that I can understand compensation eligibility and civil remedies available.

#### Acceptance Criteria

1. WHEN a victim of crime is identified, THE System SHALL explain CICB eligibility criteria, compensation categories (medical, earnings loss, counseling), and application process
2. WHEN crime-related injury occurred, THE System SHALL explain CICB application deadlines and procedures (application forms, supporting evidence requirements)
3. WHEN victim services are needed, THE System SHALL provide information about Ontario's victim support programs, counseling, and safety planning services
4. WHEN civil remedies are possible, THE System SHALL explain options for civil suits against perpetrators if CICB does not fully compensate
5. WHEN victim-offender mediation might apply, THE System SHALL explain the process and eligibility criteria
6. WHEN restitution orders are relevant, THE System SHALL explain how victim restitution can be ordered in criminal proceedings
7. WHERE CICB claims are complex, THE System SHALL provide escalation to victim services agencies and legal clinics specializing in victim support

### Requirement 24

**User Story:** As a homeowner or property occupier challenging a property tax assessment, I want guidance about Assessment Review Board procedures, so that I can understand how to appeal my property assessment.

#### Acceptance Criteria

1. WHEN a property tax dispute is identified, THE System SHALL explain the Assessment Review Board (ARB) jurisdiction and applicable deadline (45 days from assessment notice)
2. WHEN property assessment is disputed, THE System SHALL explain how MPAC (Municipal Property Assessment Corporation) conducts assessments and grounds for challenge
3. WHEN an assessment appeal is considered, THE System SHALL explain required evidence (comparable properties, market conditions, property defects) and assessment methodology
4. WHEN municipal property taxes are challenged, THE System SHALL distinguish between property assessment appeals and tax billing disputes
5. WHEN appeals fail at ARB level, THE System SHALL explain options for judicial review and Superior Court appeals
6. WHEN evidence is required, THE System SHALL explain expert appraisal requirements, market analysis, and assessment comparables
7. WHERE assessment disputes require expert evidence, THE System SHALL provide routing to real property appraisers and tax appeal specialists

### Requirement 25

**User Story:** As a condominium owner or resident involved in a condo dispute, I want information about Condominium Authority Tribunal (CAT) procedures, so that I can understand how to resolve condo-related disputes.

#### Acceptance Criteria

1. WHEN a condominium dispute is identified, THE System SHALL explain Condominium Authority Tribunal (CAT) jurisdiction under the Condominium Act, 1998
2. WHEN a condo dispute is described, THE System SHALL identify the applicable dispute type (pet policy, parking, records access, fee disputes, architectural changes)
3. WHEN CAT procedures are relevant, THE System SHALL explain the mandatory dispute resolution process, timeline (typically 90 days), and evidence requirements
4. WHEN fees or special levies are disputed, THE System SHALL explain owner rights and defenses regarding assessment validity and procedure
5. WHEN record access is denied, THE System SHALL explain owner rights to condominium documents under the Condominium Act
6. WHEN board decisions are challenged, THE System SHALL explain grounds for challenging rules, bylaws, and board determinations
7. WHERE condo disputes are complex, THE System SHALL provide routing to CAT and condo law specialists

### Requirement 26

**User Story:** As someone who has been defamed or faces a defamation suit, I want information about defamation law and anti-SLAPP procedures, so that I can understand my rights and legal options.

#### Acceptance Criteria

1. WHEN a defamation matter is identified, THE System SHALL explain defamation elements (false statements, reputation harm, publication, damages) and available defenses (truth, opinion, privilege, fair reporting)
2. WHEN media defendants are involved, THE System SHALL explain the 6-week media notice requirement under Libel and Slander Act and impact on proceedings
3. WHEN an anti-SLAPP motion is relevant, THE System SHALL explain Procedure for Relief Against SLAPP claims under Courts of Justice Act s.137.1
4. WHEN a SLAPP defendant applies for relief, THE System SHALL explain the two-step test (cause of action no reasonable prospect of success, public interest balance)
5. WHEN defamation is on digital platforms or social media, THE System SHALL explain platform liability distinctions, takedown procedures, and jurisdiction issues
6. WHEN damages are relevant, THE System SHALL explain compensatory versus aggravated/punitive damages, and cost award risks in defamation cases
7. WHERE defamation disputes are complex, THE System SHALL provide routing to defamation specialists and media law counsel