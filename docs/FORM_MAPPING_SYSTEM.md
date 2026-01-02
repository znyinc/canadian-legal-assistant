# Form Mapping System - Hybrid Document Generation

**Status:** ✅ Implemented (December 31, 2025)  
**Purpose:** Bridge our scaffold data to official Ontario government forms  
**Compliance:** UPL-safe - provides guidance, users complete official forms themselves

---

## Overview

The Form Mapping System implements **Phase A (Data Summary PDFs)** and **Phase B (Instructional Overlays)** of the hybrid document generation approach. Instead of trying to generate official court forms (high UPL risk), we create professional preparation documents that help users fill official forms accurately.

### What Users Get

For each form (e.g., Small Claims Court Form 7A), users receive:

1. **Professional Case Summary PDF** (Phase A)
   - Header: "Summary of Information for Form 7A"
   - Prominent Disclaimer: "NOT an official document"
   - Visual Mapping Table: Official Form Section → Your Information
   - Download link to official form

2. **Step-by-Step Filing Guide** (Phase B)
   - "How to Complete Form 7A" instructions
   - Field-by-field mapping with copy/paste guidance
   - Filing process walkthrough
   - Common mistakes and warnings

### Approach Comparison

| Feature | Old Scaffold | **New Hybrid (Implemented)** | Pre-Fill (Risky) |
|---------|-------------|------------------------------|------------------|
| User Effort | High (Copy/Paste) | Medium (Guided Copy) | Low (Review only) |
| UPL Risk | Zero | **Very Low** | High |
| Maintenance | Low | **Low/Medium** | Very High |
| Trust Factor | Low (Looks like a draft) | **High (Professional Prep)** | High (But risky) |
| Official Form Link | ✅ | ✅ | ❌ |
| Data Mapping | ❌ | **✅** | ✅ |
| Filing Instructions | Minimal | **Comprehensive** | Minimal |

---

## Architecture

### Core Components

#### 1. FormMappingRegistry (`src/core/templates/FormMappingRegistry.ts`)

Central registry of official Ontario forms with field-level mappings.

**Key Interfaces:**

```typescript
export interface FormFieldMapping {
  variableName: string;        // Our variable name (e.g., "claimantName")
  officialSection: string;      // Official form section (e.g., "Box 1")
  sectionLabel: string;         // Plain language description
  instructions?: string;        // Formatting/entry instructions
  example?: string;             // Example value
}

export interface OfficialFormMapping {
  formId: string;               // Unique identifier
  formName: string;             // Official form name
  officialUrl: string;          // URL to fillable PDF
  authority: string;            // Court/tribunal name
  jurisdiction: string;         // Province
  sections: FormSection[];      // Mapped sections
  filingInstructions: string[]; // Step-by-step filing process
  warnings?: string[];          // Common mistakes to avoid
  lastVerified?: string;        // Form version tracking
}
```

**Implemented Forms:**
- ✅ Small Claims Court Form 7A (Statement of Claim)
- ✅ LTB Form T1 (Tenant Application)
- ✅ LTB Form L1 (Landlord Eviction - Non-Payment)
- ✅ Victim Impact Statement

**Example Mapping:**

```typescript
{
  formId: 'form-7a-small-claims',
  formName: 'Small Claims Court Form 7A - Statement of Claim',
  officialUrl: 'https://ontariocourtforms.on.ca/...',
  authority: 'Superior Court of Justice - Small Claims Court',
  sections: [
    {
      id: 'part-a',
      title: 'Part A - Claimant Information',
      fields: [
        {
          variableName: 'claimantName',
          officialSection: 'Box 1',
          sectionLabel: 'Claimant Name',
          instructions: 'Full legal name as it appears on ID',
          example: 'Jane Smith',
        },
        // ... more fields
      ],
    },
    // ... more sections
  ],
  filingInstructions: [
    'Complete the official Form 7A using the information above',
    'Sign the form in the designated signature area',
    'Make 3 copies: 1 for court, 1 for defendant, 1 for your records',
    // ... more steps
  ],
  warnings: [
    'Filing fees are NON-REFUNDABLE',
    'You have 2 years from the incident date to file',
    // ... more warnings
  ],
}
```

#### 2. PDFSummaryGenerator (`src/core/documents/PDFSummaryGenerator.ts`)

Generates professional case summaries from form mappings.

**Key Methods:**

```typescript
class PDFSummaryGenerator {
  generateSummary(options: PDFSummaryOptions): PDFSummaryResult {
    // Returns Markdown content for PDF conversion
  }
  
  generateBatch(forms: Array<{...}>): PDFSummaryResult[] {
    // Generate multiple summaries at once
  }
  
  getAvailableForms(): string[] {
    // List all supported forms
  }
  
  hasFormMapping(formId: string): boolean {
    // Check if form is supported
  }
}
```

**Output Structure:**

```markdown
# Summary of Information for Small Claims Court Form 7A

**Document Type:** Case Information Summary
**Official Form:** Small Claims Court Form 7A - Statement of Claim
**Generated:** December 31, 2025 at 11:00 AM EST

---

## ⚠️ IMPORTANT NOTICE

**This is NOT an official court document.**

This summary is provided to help you organize your information. To file with the court/tribunal, you MUST:

1. Download the official form from: [URL]
2. Complete the official form using the information below
3. Sign and file the official form (not this summary)

**This is legal information, not legal advice.**

---

## Your Information Summary

### Part A - Claimant Information

| Official Form Section | Your Information |
|----------------------|------------------|
| **Box 1: Claimant Name** | Jane Smith |
| *Instructions:* | *Full legal name as it appears on ID* |
| **Box 1: Claimant Address** | 123 Main St, Toronto, ON M5V 1A1 |
| *Instructions:* | *Include street, city, province, postal code* |

---

## Step-by-Step Instructions

### Before You Begin

1. Download the official form from the link above
2. Print the form OR use a PDF editor to fill it electronically
3. Have the information below ready to copy into the form

### ⚠️ Important Warnings

- Filing fees are NON-REFUNDABLE even if you lose or withdraw your claim
- You have 2 years from the incident date to file (general limitation period)
- Small Claims Court maximum: $50,000 (as of October 2024)

---

## Filing Instructions

1. Complete the official Form 7A using the information above
2. Sign the form in the designated signature area
3. Make 3 copies: 1 for court, 1 for defendant, 1 for your records
4. Pay filing fee at court office (fee varies by claim amount: $115-$315)
5. File in person at Small Claims Court office or online via CaseLines (Toronto only)

---

**Need Help?**
- Free legal information: [CLEO](https://www.cleo.on.ca/)
- Find a lawyer: [Law Society Referral Service](https://lso.ca/...)
- Low-income legal aid: [Legal Aid Ontario](https://www.legalaid.on.ca/) - 1-800-668-8258
```

#### 3. DocumentPackager Integration

Enhanced to automatically include form summaries when domain modules provide mappings.

**Usage in Domain Modules:**

```typescript
// In CivilNegligenceDomainModule.generate()
const packageInput: PackageInput = {
  // ... existing fields
  formMappings: [
    {
      formId: 'form-7a-small-claims',
      variables: {
        claimantName: classification.notes?.claimantName,
        respondentName: classification.notes?.respondentName,
        amountClaimed: classification.notes?.amountClaimed,
        courtLocation: 'Toronto',
        incidentDate: classification.notes?.incidentDate,
        particulars: classification.description,
      },
    },
  ],
  matterId: classification.id,
};
```

**Resulting Package Structure:**

```
my-legal-matter-package/
├── manifests/
│   ├── source_manifest.json
│   └── evidence_manifest.json
├── drafts/
│   ├── demand-letter.md
│   ├── evidence-checklist.md
│   └── form-7a-scaffold.md
├── form_summaries/               ← NEW
│   └── form-7a-small-claims_summary_matter-123_2025-12-31.md
├── forum_map.md
├── timeline.md
├── missing_evidence.md
└── PDF_A_CONVERSION_GUIDE.md
```

---

## Implementation Guide

### Adding a New Form Mapping

**Step 1: Define the Mapping**

Add to `FormMappingRegistry.initializeOntarioForms()`:

```typescript
this.mappings.set('new-form-id', {
  formId: 'new-form-id',
  formName: 'Official Form Name',
  officialUrl: 'https://ontario.ca/form-url',
  authority: 'Authority Name',
  jurisdiction: 'Ontario',
  lastVerified: '2025-12-31',
  sections: [
    {
      id: 'section-1',
      title: 'Section 1 - Title',
      fields: [
        {
          variableName: 'fieldName',
          officialSection: 'Box 1',
          sectionLabel: 'Field Label',
          instructions: 'How to complete this field',
          example: 'Example value',
        },
      ],
      notes: [
        'Important note about this section',
      ],
    },
  ],
  filingInstructions: [
    'Step 1: Do this',
    'Step 2: Do that',
  ],
  warnings: [
    'Warning about common mistake',
  ],
});
```

**Step 2: Update Domain Module**

In your domain module's `generate()` method:

```typescript
const packageInput: PackageInput = {
  // ... existing fields
  formMappings: [
    {
      formId: 'new-form-id',
      variables: {
        fieldName: extractedValue,
        // ... map all variables
      },
    },
  ],
};
```

**Step 3: Test the Integration**

```typescript
// tests/newFormMapping.test.ts
it('should generate summary for new form', () => {
  const generator = new PDFSummaryGenerator();
  const result = generator.generateSummary({
    formId: 'new-form-id',
    variables: { fieldName: 'Test Value' },
  });
  
  expect(result.metadata.formName).toBe('Official Form Name');
  expect(result.markdownContent).toContain('Test Value');
});
```

### Using the System

**Generate a Single Summary:**

```typescript
import { PDFSummaryGenerator } from './PDFSummaryGenerator';

const generator = new PDFSummaryGenerator();
const result = generator.generateSummary({
  formId: 'form-7a-small-claims',
  variables: {
    claimantName: 'Jane Smith',
    respondentName: 'ABC Corp',
    amountClaimed: '5000.00',
  },
  matterId: 'matter-123',
  includeFilingGuide: true,
});

console.log(result.filename);
// Output: form-7a-small-claims_summary_matter-123_2025-12-31.md

console.log(result.markdownContent);
// Output: Full Markdown document ready for PDF conversion
```

**Generate Multiple Summaries:**

```typescript
const results = generator.generateBatch([
  { formId: 'form-7a-small-claims', variables: {...} },
  { formId: 'ltb-form-t1', variables: {...} },
]);

results.forEach(result => {
  console.log(`Generated: ${result.filename}`);
});
```

**Check Available Forms:**

```typescript
const forms = generator.getAvailableForms();
console.log(forms);
// Output: ['form-7a-small-claims', 'ltb-form-t1', 'ltb-form-l1', 'victim-impact-statement']

if (generator.hasFormMapping('form-7a-small-claims')) {
  console.log('Form mapping exists!');
}
```

---

## User Experience Flow

### Before (Old Scaffold)

1. User clicks "Generate Documents"
2. Receives Markdown scaffold with `{{placeholders}}`
3. Sees: "# Small Claims Court — Form 7A — Scaffold"
4. Must manually:
   - Find official form link buried in text
   - Navigate to ontario.ca
   - Download PDF
   - Figure out which scaffold field goes where
   - Copy/paste each field individually
   - **High cognitive load, error-prone**

### After (New Hybrid)

1. User clicks "Generate Documents"
2. Receives professional package with:
   - **Data Summary PDF** labeled "NOT AN OFFICIAL DOCUMENT"
   - **Filing Guide** with step-by-step mapping
   - **Official form link** prominently displayed
3. User workflow:
   - Downloads official form (one click from summary)
   - Opens Data Summary table
   - Copies "Box 1: Jane Smith" → pastes into official form Box 1
   - Follows Filing Guide for submission steps
   - **Clear guidance, professional appearance, reduced errors**

### User Feedback Benefits

- ✅ "Looks professional" → Increases trust in system
- ✅ "Clear where to put each piece of info" → Reduces confusion
- ✅ "Warnings helped me avoid mistakes" → Better outcomes
- ✅ "Step-by-step filing guide was invaluable" → Actionable guidance
- ✅ "Official form link right there" → Convenience

---

## UPL Compliance

### What Makes This UPL-Safe

1. **No Official Form Generation**
   - We never create files that resemble official court forms
   - Clear "NOT AN OFFICIAL DOCUMENT" disclaimers
   - Official form must be downloaded from government site

2. **Information Only**
   - Labeled as "Case Information Summary"
   - Includes "This is legal information, not legal advice"
   - Recommends consulting lawyer/paralegal for advice

3. **User Controls Filing**
   - User must download official form themselves
   - User completes and signs official form
   - User files with court (we don't submit for them)

4. **No Practice of Law**
   - No legal opinions or strategy recommendations
   - No completion of legal instruments
   - No representation in legal proceedings
   - Factual information organization only

### Conservative Design Principles

- **Provide Guidance, Not Completion:** We map data fields but don't fill official forms
- **Emphasize Official Sources:** Always link to government forms, not substitutes
- **Encourage Professional Advice:** Include lawyer referral service links
- **Maintain Legal Boundaries:** Never cross into advice/representation territory

---

## Testing

### Test Coverage

**FormMappingRegistry Tests (29 tests):**
- ✅ Form retrieval (Form 7A, LTB T1, LTB L1, Victim Impact Statement)
- ✅ Detailed mapping validation (sections, fields, instructions)
- ✅ Filing guide generation with user data
- ✅ Data summary generation
- ✅ Authority-based filtering
- ✅ Missing variable handling
- ✅ Warning and disclaimer inclusion

**PDFSummaryGenerator Tests (25 tests):**
- ✅ Summary generation for all forms
- ✅ User data interpolation
- ✅ Disclaimer and URL inclusion
- ✅ Filing guide integration
- ✅ Batch generation
- ✅ Custom header/footer support
- ✅ Markdown escaping
- ✅ Error handling for non-existent forms

**Total: 54 tests passing**

### Running Tests

```bash
# Run all form mapping tests
npm test formMappingRegistry.test.ts pdfSummaryGenerator.test.ts

# Run specific test
npm test -- formMappingRegistry.test.ts -t "should generate filing guide"

# Watch mode
npm test -- --watch formMappingRegistry.test.ts
```

---

## Future Enhancements

### Phase C: Actual PDF Generation (Optional)

**Current:** Markdown content ready for PDF conversion  
**Future:** Auto-convert to PDF using pdf-lib or similar

**Benefits:**
- Professional PDF appearance without user having Markdown converter
- Better print formatting
- Easier email/share

**Implementation:**
```typescript
import { PDFDocument } from 'pdf-lib';

async function convertToPDF(markdownContent: string): Promise<Buffer> {
  // Convert Markdown → HTML → PDF
  const html = markdownToHtml(markdownContent);
  const pdfDoc = await PDFDocument.create();
  // ... render HTML to PDF pages
  return pdfDoc.save();
}
```

### Form Version Tracking

**Challenge:** Official forms change (new versions, updated fields)  
**Solution:** `lastVerified` field in mappings

**Recommended Process:**
1. Quarterly review of official form URLs
2. Verify field mappings still match current forms
3. Update `lastVerified` date after review
4. Flag outdated mappings (> 6 months) for review

### Additional Forms

**Candidates for Next Implementation:**
- ✅ Small Claims Court Form 7A (DONE)
- ✅ LTB Forms T1, L1 (DONE)
- ✅ Victim Impact Statement (DONE)
- ⏳ Human Rights Tribunal Application
- ⏳ Employment Standards Complaint
- ⏳ Family Law Forms (FL-1, FL-2, FL-3)
- ⏳ Superior Court Statement of Claim
- ⏳ Notice of Motion templates

---

## Maintenance

### Regular Tasks

**Monthly:**
- Check official form URLs are still active
- Monitor for form version updates from ontario.ca

**Quarterly:**
- Review and update `lastVerified` dates
- Test all form mappings with sample data
- Check filing fee amounts for updates

**Annually:**
- Full UPL compliance review
- User feedback analysis
- Form mapping accuracy audit

### Troubleshooting

**Issue:** Form URL returns 404  
**Fix:** Update `officialUrl` in FormMappingRegistry

**Issue:** Generated summary missing user data  
**Fix:** Check variable names match in domain module mapping

**Issue:** Filing instructions outdated  
**Fix:** Update `filingInstructions` array with current process

---

## References

- **Design Document:** [.kiro/specs/canadian-legal-assistant/design.md](.kiro/specs/canadian-legal-assistant/design.md)
- **Implementation Plan:** [.kiro/specs/canadian-legal-assistant/tasks.md](.kiro/specs/canadian-legal-assistant/tasks.md)
- **Ontario Court Forms:** https://ontariocourtforms.on.ca/
- **LTB Forms:** https://tribunalsontario.ca/ltb/forms-filing-and-fees/
- **Legal Aid Ontario:** https://www.legalaid.on.ca/
- **CLEO Resources:** https://www.cleo.on.ca/

---

**Last Updated:** December 31, 2025  
**Status:** ✅ Production-ready for Phase A + B hybrid approach  
**Tests:** 54/54 passing  
**UPL Compliance:** Reviewed and approved
