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
npm test
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

Domain modules generate specialized document sets for specific legal areas.

#### Insurance Domain
Generates:
1. **Internal complaint letter** (to insurer)
2. **Ombudsman complaint** (OmbudService for Banking and Investment)
3. **GIO complaint** (General Insurance OmbudService)
4. **FSRA complaint** (Financial Services Regulatory Authority)

All include:
- Evidence references with attachment IDs
- Timeline of key events
- Legal authority citations with URLs
- Required confirmations (policy number, dates, parties)

#### Landlord/Tenant Domain
Generates:
1. **LTB intake checklist** (Landlord and Tenant Board)
2. **Notice templates** (N-forms, T-forms as applicable)
3. **Evidence package** (timeline, correspondence, photos)

All include:
- RTA citations with section numbers and URLs
- Tribunal procedure references
- Missing evidence checklist

#### Civil Negligence Domain (New)
Generates:
1. **Demand for Repair / Compensation** (demand/notice letter)
2. **Small Claims Court — Form 7A scaffold** (statement of claim scaffold)
3. **Evidence Checklist — Property Damage**

Template IDs (available in `TemplateLibrary`): `civil/demand_notice`, `civil/small_claims_form7a`, `civil/evidence_checklist`.

How to generate:
- From UI: Open the Matter, confirm facts, click **Generate Documents** → choose 'Civil Negligence' outputs.
- Via API: Call `IntegrationAPI.generateDocuments(matterId, { classification, evidenceIndex, forumMap, timeline })` and the domain module will produce drafts and a package.

Notes:
- Confirm exact amounts, dates, and names before finalizing or filing forms.
- Form 7A scaffold requires manual completion of exact dates and amounts before filing in Small Claims Court.

Municipal 10-day notice detection:
- The system heuristically detects when a municipal 10-day notice may be required (e.g., damage to municipal trees, public road, or municipal property). When detected, an alert appears in the classification results advising to send a formal notice to the municipal clerk within 10 days and to verify local by-laws.

Generate Form 7A quick action:
- From the Matter Overview page, if the matter is classified as civil negligence, click **Generate Form 7A** to create a focused Form 7A scaffold package. This action will navigate to the Documents tab where you can download the generated package and review the scaffold before filing.


### Generic Drafting (Fallback)

If no domain module matches, system uses generic drafting engine:
- Creates single general draft with evidence references
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
- Generates LTB-specific intake forms
- Cites Residential Tenancies Act sections with e-Laws URLs
- Flags tribunal jurisdiction limits ($35,000)

### Employment (Future - Phase 2)

**Planned**: Wrongful dismissal, unpaid wages, human rights

**Will include**: MOL complaint, HRTO application, Small Claims/Superior Court routing

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
