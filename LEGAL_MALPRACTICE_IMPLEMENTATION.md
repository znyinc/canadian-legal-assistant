# Legal Malpractice Domain Implementation

## Problem Statement

**Issue:** App was misclassifying legal malpractice cases as civil negligence.

**Example Case:** Quinn Avery's case where lawyer Morgan Vance missed the limitation period on an underlying slip-and-fall claim:
- **What user sees:** App treated this as a regular slip-and-fall case
- **What should happen:** App should recognize this as a legal malpractice case (Quinn suing the lawyer for missing the deadline)
- **Impact:** Wrong guidance, wrong timelines, wrong documents, wrong forum

## Solution Overview

Created comprehensive **Legal Malpractice Domain Module** with Ontario-specific guidance including:
1. LawPRO notification procedures
2. "Case within a case" analysis framework
3. Expert witness instruction templates
4. Formal demand letter to defendant lawyer
5. Evidence preservation checklist

## Technical Implementation

### 1. Domain Type Addition
**File:** `src/core/models/index.ts`

Added `'legalMalpractice'` to Domain type union:
```typescript
export type Domain = 
  | 'criminal'
  | 'civil-negligence'
  | 'landlordTenant'
  | 'employment'
  | 'insurance'
  | 'humanRights'
  | 'municipalPropertyDamage'
  | 'tree-damage'
  | 'ocppFiling'
  | 'consumerProtection'
  | 'legalMalpractice'  // NEW
  | 'other';
```

### 2. Classification Logic
**File:** `src/core/triage/MatterClassifier.ts`

Added **priority detection** before civil negligence to prevent misclassification:

```typescript
// PRIORITIZE MALPRACTICE BEFORE CIVIL NEGLIGENCE
if (h.includes('malpractice') || 
    h.includes('solicitor negligence') || 
    h.includes('lawyer negligence') ||
    h.includes('professional negligence') ||
    h.includes('missed limitation') ||
    h.includes('missed deadline') ||
    h.includes('legal error') ||
    (h.includes('retainer') && h.includes('breach')) ||
    h.includes('lawpro') ||
    h.includes('case within a case')) {
  return 'legalMalpractice';
}
```

**Keywords detected:**
- malpractice
- solicitor negligence, lawyer negligence, professional negligence
- missed limitation, missed deadline
- legal error
- retainer + breach (combined)
- lawpro (Law Society's Professional Liability Insurer)
- case within a case (legal doctrine)

### 3. Domain Module
**File:** `src/core/domains/LegalMalpracticeDomainModule.ts` (227 lines)

Extends `BaseDomainModule` to generate 5 specialized documents:

**Documents Generated:**
1. **LawPRO Immediate Notification Guide**
   - Contact: 416-598-5800 (toll-free: 1-800-410-1013)
   - Mandatory reporting under Rules of Professional Conduct
   - Claims-made policy coverage explanation
   - Policy limits and deductibles

2. **Case-Within-a-Case Analysis Framework**
   - 4-element test: duty, breach, causation, damages
   - Underlying claim strength assessment
   - "But for" causation analysis
   - Proof requirements for each element

3. **Expert Witness Instruction Letter Template**
   - Qualification requirements (experience, credentials, independence)
   - Standard of care questions specific to Ontario practice
   - Conflict of interest check procedures
   - Opinion letter format requirements

4. **Formal Demand Letter to Defendant Lawyer**
   - Professional yet formal tone
   - 21-day settlement deadline (Ontario Small Claims practice)
   - Settlement offer opportunity
   - Litigation warning

5. **Evidence Preservation Checklist**
   - **Part A:** Retainer evidence (agreement, invoices, communications, deadlines)
   - **Part B:** Underlying claim evidence (all materials from original case)
   - Documentation requirements for "case within case" proof

**Helper Methods:**
- `extractClientName()`: Parses client name from classification notes
- `extractLawyerName()`: Identifies defendant lawyer's name
- `extractOriginalClaimType()`: Determines underlying claim type
- `extractDeadline()`: Finds missed deadline date
- `extractDamageAmount()`: Extracts potential damages value
- Validation methods for missing confirmations

### 4. Template Library
**File:** `src/core/templates/TemplateLibrary.ts`

Added 5 comprehensive templates with Ontario-specific legal content:

```typescript
'malpractice/lawpro_notice': `# LawPRO Immediate Notification Guide

**Contact LawPRO IMMEDIATELY:**
- Phone: 416-598-5800 (Toronto)
- Toll-free: 1-800-410-1013
- Online: lawpro.ca

**Why Report Now:**
Under the Rules of Professional Conduct, lawyers must report potential claims immediately.
LawPRO operates on a claims-made policy - coverage depends on when you report.

**What LawPRO Covers:**
- Professional liability insurance for Ontario lawyers
- Policy limits: Typically $1M per claim, $2M aggregate
- Deductible: Usually $5,000 per claim
...`,

'malpractice/case_within_case_analysis': `# Case-Within-a-Case Analysis Framework
...`,

// ... 3 more templates with detailed Ontario legal content
```

### 5. Backend Registration
**File:** `backend/src/server.ts`

Registered module in DomainModuleRegistry:

```typescript
import { LegalMalpracticeDomainModule } from '../src/core/domains/LegalMalpracticeDomainModule.js';

// ... in server initialization:
const registry = new DomainModuleRegistry();
registry.register(new LegalMalpracticeDomainModule());
```

### 6. Action Plan Integration
**File:** `src/core/actionPlan/ActionPlanGenerator.ts`

Added malpractice to situation acknowledgment map:

```typescript
const situationMap: Record<Domain, string> = {
  // ...
  legalMalpractice: "dealing with potential legal malpractice",
  // ...
};
```

## Testing

Created comprehensive test suite with **41 total tests** across 3 files:

### Classification Tests (15 tests)
**File:** `tests/legalMalpracticeClassification.test.ts`

Tests keyword detection and priority:
- ✅ Detects "legal malpractice"
- ✅ Detects "solicitor negligence"
- ✅ Detects "missed limitation period"
- ✅ Detects "lawpro"
- ✅ Detects "case within a case"
- ✅ **Prioritizes malpractice over civil negligence** (critical)
- ✅ Combined keywords work correctly
- ✅ Case-insensitive detection

### Template Tests (17 tests)
**File:** `tests/legalMalpracticeTemplates.test.ts`

Tests template rendering with variable interpolation:
- ✅ LawPRO notice renders with phone numbers
- ✅ Case-within-case analysis includes 4 elements
- ✅ Expert instruction includes qualification requirements
- ✅ Demand letter includes 21-day deadline
- ✅ Evidence checklist covers Parts A & B
- ✅ Variable substitution works ({{clientName}}, {{lawyerName}}, etc.)
- ✅ All templates include legal disclaimer

### Integration Tests (9 tests)
**File:** `tests/legalMalpracticeDomainModule.test.ts`

Tests end-to-end document generation:
- ✅ Generates all 5 drafts
- ✅ LawPRO notice includes mandatory reporting
- ✅ Case analysis includes damages calculation
- ✅ Expert letter includes standard of care questions
- ✅ Demand letter includes settlement opportunity
- ✅ Evidence checklist includes underlying claim evidence
- ✅ Missing confirmations tracked for incomplete data
- ✅ Package includes all manifests (source, evidence)
- ✅ Document packaging works correctly

**Test Results:**
```
✅ 41/41 legal malpractice tests passing
✅ 374/374 total tests passing (no regressions)
✅ Test duration: 6.39s
```

## Ontario Legal Requirements

### LawPRO Notification
- **When:** Immediately upon discovery of potential claim
- **Why:** Claims-made policy requires prompt reporting
- **How:** Phone 416-598-5800 or online at lawpro.ca
- **Who:** Mandatory under Rules of Professional Conduct

### Limitation Period
- **Period:** 2 years from discovery of malpractice
- **Authority:** Limitations Act, 2002, s.5
- **Discovery Rule:** Time runs from when client knew or ought to have known
- **Ultimate Limit:** 15 years from the act or omission

### Case-Within-a-Case Doctrine
**Four Elements to Prove:**
1. **Duty:** Lawyer owed duty of care (retainer relationship)
2. **Breach:** Lawyer fell below standard of care
3. **Causation:** "But for" the breach, client would have succeeded
4. **Damages:** Quantifiable loss from underlying claim

**Critical:** Client must prove they **would have won** the underlying case.

### Expert Witness Requirements
- **Qualifications:** Practicing lawyer in same field, 10+ years experience
- **Standard of Care:** What a competent Ontario lawyer would do in similar circumstances
- **Independence:** No conflicts of interest with either party
- **Opinion Format:** Written report with detailed analysis

## Document Generation Example

**Input:** Quinn Avery vs Morgan Vance (missed limitation on slip-and-fall)

**Classification:**
```json
{
  "domain": "legalMalpractice",
  "pillar": "civil",
  "jurisdiction": "Ontario",
  "urgency": "high",
  "notes": "Client: Quinn Avery. Lawyer: Morgan Vance. Missed limitation deadline on slip-and-fall claim. Deadline expired: 2025-01-10. Discovery: 2025-12-21. Potential damages: $100,000."
}
```

**Documents Generated:**
1. **LawPRO Notice** with phone numbers and mandatory reporting timeline
2. **Case Analysis** showing 4 elements and underlying slip-and-fall claim strength
3. **Expert Instruction** with standard of care questions for negligence practice
4. **Demand Letter** to Morgan Vance with 21-day deadline
5. **Evidence Checklist** requesting retainer, communications, and all slip-and-fall evidence

## Key Features

✅ **Correct Classification:** Malpractice detected **before** civil negligence  
✅ **Ontario-Specific:** LawPRO contact, Rules of Professional Conduct, Ontario limitation law  
✅ **Comprehensive Documents:** 5 specialized templates covering full case preparation  
✅ **Legal Accuracy:** Case-within-case doctrine, expert requirements, limitation rules  
✅ **User-Friendly:** Plain language explanations, actionable steps, clear deadlines  
✅ **Evidence-Focused:** Detailed checklists for both retainer and underlying claim  
✅ **Settlement-Oriented:** Demand letter includes 21-day negotiation window  

## Before vs After

### Before Implementation
❌ Quinn's case classified as "civil negligence" (slip-and-fall)  
❌ No LawPRO notification guidance  
❌ Wrong limitation period (2 years from injury, not discovery)  
❌ No case-within-case analysis framework  
❌ No expert witness instruction template  
❌ Generic demand letter (not lawyer-specific)  

### After Implementation
✅ Correctly classified as "legal malpractice"  
✅ LawPRO notification with 416-598-5800 contact  
✅ Correct limitation period (2 years from Dec 21, 2025 = Dec 21, 2027)  
✅ 4-element case-within-case framework included  
✅ Expert instruction letter with Ontario standard of care questions  
✅ Professional demand letter to defendant lawyer with 21-day deadline  

## Files Modified/Created

**Modified (4 files):**
- `src/core/models/index.ts` - Added legalMalpractice domain type
- `src/core/triage/MatterClassifier.ts` - Added priority malpractice detection
- `src/core/templates/TemplateLibrary.ts` - Added 5 templates + render() alias
- `src/core/actionPlan/ActionPlanGenerator.ts` - Added malpractice situation
- `backend/src/server.ts` - Registered LegalMalpracticeDomainModule

**Created (4 files):**
- `src/core/domains/LegalMalpracticeDomainModule.ts` - 227 lines, domain module
- `tests/legalMalpracticeClassification.test.ts` - 15 classification tests
- `tests/legalMalpracticeTemplates.test.ts` - 17 template rendering tests
- `tests/legalMalpracticeDomainModule.test.ts` - 9 integration tests

**Total:** 8 files changed, ~600 lines of code added

## Status

✅ **Task 25 Complete** (2025-12-29)  
✅ All 41 tests passing  
✅ Zero regressions (374/374 total tests)  
✅ Backend builds successfully  
✅ Ready for deployment  

## Next Steps

1. ✅ Documentation updated (AGENTS.md)
2. ⏳ Manual testing with dev servers
3. ⏳ E2E testing with Quinn Avery scenario
4. ⏳ User acceptance testing
5. ⏳ Production deployment

---

**Implementation completed by:** GitHub Copilot Agent  
**Date:** December 29, 2025  
**Test coverage:** 41/41 tests passing  
**Documentation:** Complete
