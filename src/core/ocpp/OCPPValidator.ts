/**
 * OCPP Filing Validator
 * 
 * Validates filings for Ontario Consolidation Procedures (OCPP) compliance
 * with Toronto Region Superior Court requirements (October 2025 reforms).
 * 
 * Requirements:
 * - PDF/A format for long-term preservation
 * - 8.5" x 11" page size
 * - Maximum 20MB file size
 * - Proper naming conventions
 */

export interface OCPPValidationResult {
  compliant: boolean;
  errors: string[];
  warnings: string[];
}

export interface OCPPFilingRequirements {
  maxFileSize: number; // bytes
  requiredFormat: string;
  allowedPageSize: string;
  namingPattern: RegExp;
}

export class OCPPValidator {
  private static readonly TORONTO_REQUIREMENTS: OCPPFilingRequirements = {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    requiredFormat: 'PDF/A',
    allowedPageSize: '8.5x11',
    namingPattern: /^[A-Z0-9\-_]+\.(pdf|PDF)$/
  };

  /**
   * Validate OCPP filing for Toronto Region compliance
   */
  validateFiling(params: {
    filename: string;
    fileSize: number;
    isPDFA?: boolean;
    pageSize?: string;
    jurisdiction?: string;
  }): OCPPValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Only enforce for Toronto/Ontario Superior Court
    if (params.jurisdiction !== 'Ontario') {
      return { compliant: true, errors: [], warnings: [] };
    }

    // 1. File size validation
    if (params.fileSize > OCPPValidator.TORONTO_REQUIREMENTS.maxFileSize) {
      errors.push(
        `File size ${(params.fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum 20MB for OCPP filings`
      );
    }

    // 2. Naming convention validation
    if (!OCPPValidator.TORONTO_REQUIREMENTS.namingPattern.test(params.filename)) {
      warnings.push(
        `Filename "${params.filename}" does not follow OCPP naming convention (A-Z, 0-9, hyphens, underscores only)`
      );
    }

    // 3. PDF/A format validation (if format info available)
    if (params.isPDFA === false) {
      errors.push(
        'Document must be in PDF/A format for OCPP filings (Toronto Region Superior Court requirement)'
      );
      warnings.push(
        'Convert to PDF/A using: LibreOffice (Save as PDF/A), MS Word (Export > PDF/A), or Adobe Acrobat Pro (Tools > Standards > PDF/A)'
      );
    } else if (params.isPDFA === undefined) {
      warnings.push(
        'Unable to verify PDF/A compliance. Ensure document is saved in PDF/A-1b or PDF/A-2b format before filing.'
      );
    }

    // 4. Page size validation (if available)
    if (params.pageSize && params.pageSize !== '8.5x11' && params.pageSize !== 'Letter') {
      warnings.push(
        `Page size "${params.pageSize}" should be 8.5" x 11" (Letter) for OCPP filings`
      );
    }

    const compliant = errors.length === 0;

    return { compliant, errors, warnings };
  }

  /**
   * Generate OCPP compliance checklist
   */
  generateComplianceChecklist(): string {
    return `
# OCPP Filing Compliance Checklist (Toronto Region)

Before filing with Ontario Superior Court:

## Format Requirements
☐ Document saved in PDF/A-1b or PDF/A-2b format
☐ Page size: 8.5" x 11" (Letter)
☐ File size under 20MB
☐ Filename uses only A-Z, 0-9, hyphens, underscores

## Content Requirements
☐ Court file number visible on first page
☐ Party names correct (as per statement of claim)
☐ Page numbering continuous
☐ All exhibits embedded (no external links)
☐ Fonts embedded (not relying on system fonts)

## Verification
☐ Open in Adobe Reader → verify shows "PDF/A"
☐ Print preview → all pages render correctly
☐ Accessibility check (if using assistive tech)

## Conversion Tools
- LibreOffice: File → Export as PDF → Select "PDF/A-1b"
- MS Word: File → Export → Create PDF/XPS → Options → "PDF/A compliant"
- Adobe Acrobat Pro: Tools → Standards → Convert to PDF/A

📋 Failing to meet these requirements may result in clerk rejection or filing delays.
`.trim();
  }

  /**
   * Check if jurisdiction requires OCPP validation
   */
  requiresOCPPValidation(jurisdiction: string, domain: string): boolean {
    return (
      jurisdiction === 'Ontario' &&
      (domain === 'ocppFiling' || 
       domain === 'civilNegligence' || 
       domain === 'municipalPropertyDamage')
    );
  }
}
