# Canadian Legal Assistant - User Guide

> **IMPORTANT**: This system provides **legal information only**, not legal advice. It helps you understand whether you may need to go to court and assists in preparing evidence and documents for self-representation or consultation with a lawyer.

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Core Workflow](#core-workflow)
3. [Using the Integration API](#using-the-integration-api)
4. [Evidence Management](#evidence-management)
5. [Document Generation](#document-generation)
6. [Data Lifecycle](#data-lifecycle)
7. [Domain-Specific Features](#domain-specific-features)
8. [Compliance & Limitations](#compliance--limitations)
9. [What Pillars Mean](#what-pillars-mean)

---

## Getting Started

### Prerequisites
- Node.js LTS (v20+ recommended)
- npm

### Installation
```bash
npm install
```

### Build
```bash
npm run build
```

### Test
```bash
npm test  # 327 tests across 51 files
```

---

## Core Workflow

The Canadian Legal Assistant follows a structured workflow to help you understand your legal situation:

```
1. Intake → 2. Evidence Upload → 3. Document Generation → 4. Export/Delete
```

### 1. Intake Assessment
**Purpose**: Classify your legal matter and route you to the appropriate forum.

**What you provide**:
- **Description**: Brief summary of your situation (e.g., "Landlord won't fix broken heating")
- **Province**: Your province (defaults to Ontario)
- **Domain**: Legal area (insurance, landlordTenant, employment, etc.)
- **Timeline**: Key dates (optional)
- **Dispute amount**: If applicable (optional)

**What you get**:
- **Matter Classification**: Legal domain, sub-category, urgency level, jurisdiction
- **Forum Map**: Recommended forums in order (tribunal → court → alternative resolution)
- **Next Steps**: Specific guidance on what to do next

## Ontario Legal Navigator Features

### Four Pillars Classification
The system automatically classifies legal matters into four pillars:
- **Criminal**: Offences against the Criminal Code (assault, theft, uttering threats)
- **Family**: Domestic matters (divorce, custody, support) — Phase 2
- **Civil**: Private disputes (negligence, contract, property damage)
- **Administrative**: Regulatory and tribunal matters (L/T, employment, consumer protection)

Classification uses keyword matching and legal domain inference. Ambiguous cases flag multiple pillars for user clarification.

### Journey Tracker (5 Stages)
Visual progress indicator showing where user is in the legal process:
1. **Understand Your Situation**: Classify matter, gather facts
2. **Explore Your Options**: Review pathways, assess costs/risks
3. **Prepare Your Case**: Collect evidence, generate documents
4. **Take Action**: File with appropriate forum, follow procedures
5. **Resolution**: Settlement, hearing, judgment

Each stage shows completion status and suggested next actions.

### Plain Language Translation
**30+ legal terms** with plain language explanations:
- **Categories**: Procedural, Substantive, Forum-specific, Remedy, Party, General
- **Ontario-specific terms**: LTB (Landlord and Tenant Board), Small Claims $50K limit, HRTO (Human Rights Tribunal), occupiers' liability
- **Interactive tooltips**: Hover/click on legal terms for plain language translation, detailed explanation, and Learn More links (CanLII, ontario.ca, tribunals)
- **AutoTooltipText component**: Automatically detects and highlights legal terms in document text

**Readability Scorer**:
- **Flesch Reading Ease**: 0-100 score with grade levels (very-easy to very-difficult)
- **Legal complexity adjustments**: Penalty for legal/complex words
- **Metrics**: Avg sentence/word length, syllables per word, legal word count
- **Improvement suggestions**: Actionable feedback for plain language rewriting

### Limitation Periods Engine
**12 Ontario limitation periods** with urgency alerts:
- **General**: 2 years from discovery (most civil claims)
- **Municipal**: 10 days written notice + 2 years (Municipal Act, 2001)
- **Employment**: ESA 2 years, wrongful dismissal 2 years
- **Landlord/Tenant**: LTB application within 1 year
- **Human Rights**: HRTO 1 year from incident
- **Personal Injury**: 2 years from injury
- **Ultimate**: 15 years from act/omission (absolute limit)

**Urgency levels**:
- **Critical**: <10 days remaining (red badge)
- **Warning**: 11-30 days (orange badge)
- **Caution**: 31-90 days (yellow badge)
- **Info**: >90 days (blue badge)

**Municipal 10-day notice detection**: Auto-flags municipal property damage (trees, roads, sidewalks) requiring formal notice to municipal clerk.

### Cost Calculator & Risk Assessment
**4 core methods**:
1. **calculateCost()**: Filing fees + other costs (process server, photocopying, experts) + cost award risk
   - Ontario Small Claims: $115-$315 tiered by amount claimed
   - Superior Court: $270 filing fee
   - LTB/HRTO: Free
2. **assessFeeWaiver()**: Eligibility check based on LIM thresholds ($25K single, +$7K per household member)
3. **assessFinancialRisk()**: Risk level classification (minimal <$1K, moderate <$5K, significant <$15K, substantial >$15K)
4. **comparePathways()**: Side-by-side comparison with costs, timeframes, pros/cons for employment, insurance, L/T domains

**React UI components**:
- **CostEstimateCard**: Expandable cost breakdown with filing fees, other costs, risk assessment
- **FeeWaiverGuidance**: Eligibility guidance with income thresholds, application steps
- **FinancialRiskIndicator**: Visual risk badge with metrics breakdown
- **PathwayComparison**: Table comparison of multiple options (MOL vs Small Claims, CPO vs Chargeback, etc.)

### Action Plan Generator
**6 core components** for action-first UX:
1. **Acknowledgment**: Empathetic opening ("You're dealing with X. This can be stressful...")
2. **Immediate Actions**: Prioritized steps with urgency levels (URGENT/SOON/WHEN READY) and timeframes
3. **Your Role**: Clarification of what user IS and what user is NOT (e.g., "You are a witness, not the prosecutor")
4. **Settlement Pathways**: Options with pros/cons, typical pathway flagged
5. **What to Avoid**: Critical warnings by severity (CRITICAL/WARNING/CAUTION)
6. **Next Step Offers**: Document generation offers with action labels

**Domain-specific guidance**:
- **Criminal**: Occurrence number, medical docs, victim services; complainant role; peace bond pathway; no-contact warnings
- **Civil**: Evidence preservation, demand letter; plaintiff role with burden of proof; pre-trial settlement; photo-before-repair warnings
- **Municipal**: 10-day notice (critical urgent); insurance subrogation pathway
- **L/T**: LTB application, evidence gathering; tenant applicant role; no-rent-withholding warning
- **Employment**: Documentation, MOL complaint; complainant role; negotiated severance pathway; no-release-signing warning

**React UI components**:
- **AcknowledgmentBanner**: Empathetic opening with domain-specific colors
- **ImmediateActionsCard**: Prioritized action list with urgency badges
- **YourRoleExplainer**: "You ARE" vs "You are NOT" sections
- **SettlementPathwayCard**: Options with pros/cons, typical pathway highlighted
- **WhatToAvoidSection**: Severity-based warnings with expandable details
- **NextStepsOffer**: Document generation offers with action buttons

### October 2025 Ontario Court Reforms
**Small Claims Court**: Amount limit increased from $35,000 to **$50,000** (effective October 2025)

**Ontario Consolidation Procedures Project (OCPP)**:
- **Applies to**: Toronto Region Superior Court filings
- **PDF/A format required**: PDF/A-1b or PDF/A-2b (archival format)
- **File size limit**: 20MB maximum
- **Page size**: 8.5" x 11" standard
- **Naming conventions**: Uppercase alphanumeric + hyphens/underscores only

**OCPP Validator**:
- Automatic validation at intake for Toronto Region matters
- Comprehensive 1,900+ word PDF/A conversion guide (LibreOffice, MS Word, Adobe Acrobat Pro)
- Warning alerts in UI with checklist for compliance
- ValidationReport includes: compliant status, errors, warnings, conversion guidance

### 2. Evidence Upload
**Purpose**: Build a timeline and evidence index for your case.

**Supported formats**: PDF, PNG, JPG, EML, MSG, TXT

**What happens**:
- **Validation**: Files checked for format, size, corruption
- **Metadata extraction**: Dates, sender/recipient, document type
- **PII redaction**: Automatic redaction of addresses, phone numbers, SIN, DOB, account numbers
- **Indexing**: Evidence tagged and cataloged with hashes
- **Timeline generation**: Chronological timeline built from evidence dates
- **Gap detection**: Missing evidence periods identified
- **Alerts**: Credibility issues flagged (e.g., email screenshots instead of EML files)

### 3. Document Generation
**Purpose**: Create standardized packages for filing or submission.

**What you get**:
- **Forum map**: Markdown file with routing decisions and citations
- **Timeline**: Chronological event timeline with evidence references
- **Missing evidence checklist**: Gaps you should address
- **Draft documents**: Domain-specific forms, complaints, notices
- **Source manifest**: All legal authorities cited with URLs and retrieval dates
- **Evidence manifest**: All evidence files with metadata and tags

### 4. Data Lifecycle
**Purpose**: Manage your data securely.

**Operations**:
- **Export**: Package all data (classification, evidence, documents) as ZIP
- **Delete**: Request deletion (blocked if legal hold active)
- **Legal hold**: Prevent deletion during active litigation
- **Retention**: 60-day default, extendable for legal matters

---

## What Pillars Mean

- **Criminal**: Offences prosecuted by the state (e.g., assault, theft). Burden: beyond a reasonable doubt. Seek police help and consider legal advice for safety/urgency.
- **Civil**: Disputes between people or businesses (e.g., negligence, contract breach). Burden: balance of probabilities. Often about money or repairs.
- **Administrative**: Tribunal or regulator processes (e.g., LTB, HRTO, licensing, benefits). Burden often balance of probabilities or statute-specific tests.
- **Quasi-criminal**: Regulatory or by-law offences (e.g., parking/provincial offence tickets). Burden: statute-specific, can include fines or penalties.
- **Unknown/Ambiguous**: Provide more facts. When in doubt or facing deadlines, contact a lawyer or community legal clinic.
- Examples: “Slip and fall at a store” → Civil; “Eviction notice for non-payment” → Administrative (LTB); “Assault plus parking ticket” → Ambiguous (Criminal + Quasi-criminal).
- Limits: Information-only; not legal advice. Do not rely on this tool for emergencies or where court/tribunal deadlines are imminent—seek legal assistance.

---

## Using the Integration API

The `IntegrationAPI` class provides all functionality through a unified interface.

### Example Usage

```typescript
import { IntegrationAPI } from './api/IntegrationAPI';

// Initialize the API
const api = new IntegrationAPI();

// 1. Intake: Classify your matter
const intake = await api.intake({
  description: 'My insurance company denied my water damage claim without proper investigation',
  province: 'ON',
  domain: 'insurance',
  timeline: { keyDates: [
    { date: new Date('2025-01-15'), event: 'Water damage occurred' },
    { date: new Date('2025-01-20'), event: 'Filed claim with insurer' },
    { date: new Date('2025-02-10'), event: 'Claim denied' }
  ]},
  disputeAmount: 25000
});

console.log('Recommended forum:', intake.forumMap.recommended);
console.log('Next steps:', intake.nextSteps);

// 2. Upload evidence
const evidenceResult = await api.uploadEvidence(
  'case-123',
  {
    filename: 'denial_letter.pdf',
    buffer: pdfBuffer,
    mimeType: 'application/pdf',
    uploadedAt: new Date()
  }
);

console.log('Evidence indexed:', evidenceResult.index.id);
console.log('Timeline updated:', evidenceResult.timeline);
console.log('Gaps detected:', evidenceResult.gaps);

// 3. Generate documents
const packageResult = await api.generateDocuments('case-123', {
  domain: 'insurance',
  classification: intake.classification,
  evidence: [evidenceResult.index],
  userConfirmedFacts: [
    'Policy number: ABC123456',
    'Water damage occurred on January 15, 2025',
    'Insurer is XYZ Insurance Company'
  ]
});

console.log('Generated package:', packageResult.packageId);
console.log('Files:', packageResult.files.map(f => f.path));

// 4. Export data (includes everything)
const exportResult = await api.exportData('case-123');
console.log('Export package:', exportResult.exportPath);

// 5. Delete data (respects legal hold)
const deletionResult = await api.deleteData('case-123');
console.log('Deleted:', deletionResult.success);
```

---

## Evidence Management

### Best Practices

1. **Use Original Files**
   - Prefer EML/MSG over email screenshots
   - Use PDFs from original sources, not scanned/photographed
   - System will flag lower-credibility evidence

2. **Organize Chronologically**
   - Upload evidence in date order when possible
   - Timeline builds automatically from document dates

3. **Address Gaps**
   - Review missing evidence checklist
   - Fill gaps before finalizing package

4. **Verify PII Redaction**
   - System auto-redacts sensitive info
   - Review redacted documents to ensure accuracy

### Evidence Metadata

Each evidence file is indexed with:
- **Attachment ID**: Unique identifier
- **Filename**: Original filename
- **Date**: Extracted date (from email headers, PDF metadata, etc.)
- **Summary**: Brief description of content
- **Provenance**: Source type (official document, email, photo, etc.)
- **Tags**: Categorization (claim, denial, correspondence, etc.)
- **Hash**: SHA-256 for integrity verification
- **Credibility score**: 0-100 based on source type

---

## Document Generation

### Domain Modules

The system includes **10 specialized domain modules** for different legal areas:

#### 1. Insurance Domain
Generates:
1. **Internal complaint letter** (to insurer)
2. **Ombudsman complaint** (OmbudService for Banking and Investment)
3. **GIO complaint** (General Insurance OmbudService)
4. **FSRA complaint** (Financial Services Regulatory Authority)

#### 2. Landlord/Tenant Domain
Generates:
1. **LTB intake checklist** (Landlord and Tenant Board)
2. **Notice templates** (N-forms, T-forms as applicable)
3. **Evidence package** (timeline, correspondence, photos)
4. **T1/T2/T6 application guidance** with form-specific evidence checklists

#### 3. Civil Negligence Domain
Generates:
1. **Demand for Repair / Compensation** (demand/notice letter)
2. **Small Claims Court — Form 7A scaffold** (statement of claim scaffold)
3. **Evidence Checklist — Property Damage**
4. **Settlement guidance** (anticipate defense, insurance subrogation options)

Features:
- **Municipal 10-day notice detection**: Auto-flags tree/municipal property damage requiring formal notice to municipal clerk
- **Generate Form 7A quick action**: UI button for focused Form 7A package generation

#### 4. Employment Law Router Module
Generates:
1. **MOL Complaint Guide** (Ministry of Labour for ESA violations)
2. **Wrongful Dismissal Assessment** (Small Claims vs Superior Court routing)
3. **Severance Package Review** (rights and negotiation guidance)
4. **Multi-pathway comparison** (MOL → Small Claims → Superior Court)

#### 5. Municipal Property Damage Module
Generates:
1. **10-Day Notice Template** (to municipal clerk)
2. **Municipal Claim Process Guide** (Municipal Act, 2001 requirements)
3. **Evidence Collection Checklist** (photos, reports, witness statements)
4. **Critical deadline alerts** (10-day notice with urgency warnings)

#### 6. Criminal Domain (Informational Only)
Generates:
1. **Victim Services Ontario Guide** (V/WAP, safety planning, counseling)
2. **Evidence Checklist for Complainants** (photos, 911 records, medical docs)
3. **Your Role as Complainant** (witness not prosecutor, Crown's role, timeline expectations)
4. **Release Conditions Checklist** and **Victim Impact Statement scaffold**
5. **Police and Crown Process Guide** (disclosure, bail, trial dates)
6. **Peace Bond (810 order) guidance**

Note: Criminal domain provides **information only** — no legal strategy, no advice. Emphasizes seeking police help and legal counsel for safety/urgency.

#### 7. Consumer Protection Domain
Generates:
1. **Consumer Protection Ontario Complaint Guide** (CPO filing process, phone 416-326-8800)
2. **Chargeback Request Guide** (credit card dispute process, 60-120 day timeline)
3. **Service Dispute Letter** (template with Consumer Protection Act, 2002 rights)
4. **Unfair Practice Documentation Checklist** (false advertising, bait-and-switch, hidden fees)

Features:
- Multi-pathway presentation: CPO → Small Claims Court → Chargeback (if applicable) → BBB (informal)
- Chargeback guidance includes timeframes, documentation requirements, outcomes

#### 8. OCPP Filing Module (Toronto Region)
Generates:
1. **PDF/A Compliance Checklist** (format, page size, naming conventions)
2. **PDF/A Conversion Guide** (LibreOffice, MS Word, Adobe Acrobat Pro instructions)
3. **OCPP Validation Report** (file size ≤20MB, PDF/A-1b or PDF/A-2b, 8.5x11 pages)

Features:
- **October 2025 Ontario Court Reforms**: Validates Toronto Region Superior Court filings
- Comprehensive 1,900+ word conversion guide with troubleshooting steps

#### 9. Tree Damage Classifier Module
Generates:
1. **Municipal vs Private Liability Assessment** (ownership detection)
2. **10-Day Notice Template** (if municipal tree)
3. **Private Property Demand Letter** (if private tree)
4. **Evidence Checklist** (arborist reports, contractor estimates, photos)

Features:
- Automatic ownership detection from matter description/tags
- Routes to municipal process or civil negligence based on liability

#### 10. Generic Domain (Fallback)
- Used when no specialized module matches
- Creates general draft with evidence references
- Includes all citations and disclaimers
- Requires user confirmation for all facts

### Document Package Structure

```
package_<caseId>_<timestamp>/
├── manifests/
│   ├── source_manifest.json      # All legal authorities cited
│   └── evidence_manifest.json    # All evidence files indexed
├── forum_map.md                  # Routing decisions with rationale
├── timeline.md                   # Chronological event timeline
├── missing_evidence_checklist.md # Gaps to address
└── drafts/
    ├── internal_complaint.md     # Domain-specific drafts
    ├── ombudsman_complaint.md
    ├── gio_complaint.md
    └── fsra_complaint.md
```

---

## Data Lifecycle

### Export

```typescript
const result = await api.exportData(caseId);
// Creates ZIP with:
// - classification.json
// - evidence/ (all uploaded files)
// - documents/ (all generated packages)
// - audit_log.json
```

### Deletion

```typescript
// Regular deletion (respects legal hold)
const result = await api.deleteData(caseId);

// Apply legal hold (prevents deletion)
await api.applyLegalHold(caseId, 'Active litigation - case #CV-2025-12345');

// Clear legal hold (allows deletion)
await api.clearLegalHold(caseId);
```

### Retention

Default: **60 days** from last activity

Extendable for:
- Active legal matters
- Ongoing litigation
- Legal hold requirements

```typescript
await api.updateRetention(caseId, {
  retentionDays: 365,
  reason: 'Active tribunal proceeding'
});
```

---

## Domain-Specific Features

### Insurance
**Triggers**: Claims denial, coverage disputes, bad faith

**Special handling**:
- Routes through insurer → ombudsman → GIO/OmbudService → FSRA → court
- Generates 4-tier escalation documents
- Cites Insurance Act, FSRA guidelines, ombudsman terms of reference

### Landlord/Tenant
**Triggers**: Rent disputes, maintenance issues, eviction notices, damage claims

**Special handling**:
- Routes through RTA self-help → LTB → Superior Court (judicial review)
- Generates LTB-specific intake forms (T1, T2, T6 with form-specific guidance)
- Cites Residential Tenancies Act sections with e-Laws URLs
- Small Claims Court for monetary claims (≤50,000)

### Employment
**Triggers**: Wrongful dismissal, unpaid wages, ESA violations

**Special handling**:
- Routes through MOL complaint → Small Claims → Superior Court
- ESA violations: Ministry of Labour (free, fast, limited scope)
- Wrongful dismissal: Small Claims (<$50K) or Superior Court (>$50K)
- Severance package assessment with negotiation guidance

### Civil Negligence
**Triggers**: Property damage, personal injury, breach of contract

**Special handling**:
- Demand letter first (settlement emphasis)
- Small Claims Court for ≤50,000 (Ontario)
- Superior Court for >$50,000
- Municipal 10-day notice detection for municipal property
- Settlement pathway presentation (pre-trial resolution common)

### Municipal Property Damage
**Triggers**: Tree damage, road defects, municipal property incidents

**Special handling**:
- **Critical 10-day notice requirement** (Municipal Act, 2001)
- Municipal clerk notice template with delivery instructions
- Small Claims Court for ≤50,000, Superior Court for >$50,000
- Evidence requirements: photos before cleanup, witness statements

### Criminal (Informational Only)
**Triggers**: Assault, theft, uttering threats, other offences

**Special handling**:
- **Information only** — no legal advice or strategy
- Routes to Ontario Court of Justice (ON-OCJ)
- Victim services guidance (V/WAP, safety planning)
- Complainant role explanation (witness not prosecutor)
- No civil limitation periods (Crown controls timeline)
- Emphasizes police involvement and legal counsel

### Consumer Protection
**Triggers**: Refund disputes, warranty claims, service complaints, unfair practices

**Special handling**:
- Consumer Protection Ontario (CPO) complaint pathway
- Chargeback option for credit card payments (60-120 days)
- Service dispute letter with Consumer Protection Act, 2002 rights
- Multi-pathway: CPO → Small Claims → Chargeback → BBB
- Unfair practice documentation (false advertising, hidden fees)

### OCPP Filing (Toronto Region)
**Triggers**: Toronto Region Superior Court filings (October 2025 reforms)

**Special handling**:
- PDF/A format validation (PDF/A-1b or PDF/A-2b)
- File size limit: 20MB maximum
- Page size enforcement: 8.5" x 11"
- Naming convention validation: uppercase alphanumeric + hyphens/underscores
- Comprehensive PDF/A conversion guide (LibreOffice, MS Word, Adobe Acrobat Pro)

### Tree Damage Classifier
**Triggers**: Fallen tree damage, negligent tree maintenance

**Special handling**:
- Automatic ownership detection (municipal vs private)
- Municipal: 10-day notice + municipal claim process
- Private: Civil negligence demand letter + Small Claims/Superior Court
- Evidence requirements: arborist reports, contractor estimates, photos

---

## Compliance & Limitations

### What This System Does
✅ Provides factual legal information  
✅ Explains your options and potential forums  
✅ Helps organize evidence chronologically  
✅ Generates draft documents for review  
✅ Cites authoritative legal sources  
✅ Identifies gaps in evidence  

### What This System Does NOT Do
❌ Provide legal advice or recommendations  
❌ Make strategic decisions for you  
❌ Guarantee outcomes or success  
❌ Replace a lawyer for complex matters  
❌ Represent you in court or tribunals  
❌ Scrape or reconstruct restricted content  

### Legal Disclaimers

Every output includes:
- **"This is legal information, not legal advice"**
- **"Consider consulting a licensed lawyer"**
- **"No attorney-client relationship is created"**

### Source Access Rules

**Allowed**:
- CanLII API and direct linking
- Ontario e-Laws browsing/downloading
- Federal Justice Laws Website browsing/downloading
- Official tribunal/court websites (guidance documents)
- User-provided documents

**Prohibited**:
- Web scraping of restricted databases
- Reconstruction of paywalled case law
- Unauthorized access to proprietary legal research platforms

### Authority Citations

All legal authorities include:
- Full citation (e.g., *Residential Tenancies Act*, 2006, SO 2006, c 17, s 20)
- URL to official source (e.g., https://www.ontario.ca/laws/statute/06r17)
- Retrieval date (e.g., "Retrieved: 2025-12-25")
- Currency date (for legislation, e.g., "Current to: 2025-11-01")

---

## Project Structure

```
src/
├── core/
│   ├── models/               # TypeScript interfaces
│   ├── authority/            # Authority registry & lookup
│   ├── access/               # Source access control
│   ├── evidence/             # Validation, PII, indexing, timeline
│   ├── triage/               # Classification & routing
│   ├── upl/                  # Disclaimers & citations
│   ├── templates/            # Template library & style guide
│   ├── caselaw/              # Case law search (CanLII)
│   ├── documents/            # Drafting engine & packager
│   ├── domains/              # Domain-specific modules
│   ├── audit/                # Audit logging & manifests
│   └── lifecycle/            # Export, deletion, retention
├── api/
│   └── IntegrationAPI.ts     # Unified API
├── data/
│   └── initialAuthorities.ts # Legal authority seed data
└── tests/                    # Comprehensive test suite
```

---

## Getting Help

### Troubleshooting

**Issue**: Evidence file rejected  
**Solution**: Check format (PDF, PNG, JPG, EML, MSG, TXT only), ensure file size < 10MB

**Issue**: Timeline has gaps  
**Solution**: Review missing evidence checklist, upload additional documents

**Issue**: Deletion blocked  
**Solution**: Check for active legal hold; clear hold if litigation complete

**Issue**: Generated documents missing facts  
**Solution**: Provide userConfirmedFacts array when calling generateDocuments()

### Support

For bugs, feature requests, or questions:
- Review design documentation in `.kiro/specs/canadian-legal-assistant/`
- Check implementation plan in `.kiro/specs/canadian-legal-assistant/tasks.md`
- Run tests: `npm test`
- Check audit logs for operation history

---

## Next Steps

1. **Start with Intake**: Describe your situation and get initial routing
2. **Upload Evidence**: Build your timeline and evidence index
3. **Review Gaps**: Address missing evidence before generating documents
4. **Generate Documents**: Create forum-specific drafts
5. **Review Carefully**: All drafts require your review and confirmation
6. **Consult if Needed**: Consider consulting a lawyer for complex matters
7. **File/Submit**: Use generated packages for self-representation or lawyer consultation

---

**Remember**: This system empowers you with information and organization, but legal matters can be complex. When in doubt, consult a licensed lawyer.
