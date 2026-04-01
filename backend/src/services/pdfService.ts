export interface AccessiblePdfMetadata {
  title: string;
  language: 'en-CA' | 'fr-CA';
  pdfStandard: 'PDF/A-1b' | 'PDF/A-2b';
  taggedPdf: boolean;
  includesOcrTextLayerForScans: boolean;
  generatedAt: string;
}

export interface AccessibilityReadinessInput {
  isTaggedPdf?: boolean;
  hasOcrTextLayer?: boolean;
  pdfaLevel?: string;
}

export interface AccessibilityReadinessResult {
  compliant: boolean;
  warnings: string[];
}

export class PdfService {
  buildAccessibleMetadata(title: string, language: 'en-CA' | 'fr-CA' = 'en-CA'): AccessiblePdfMetadata {
    return {
      title,
      language,
      pdfStandard: 'PDF/A-1b',
      taggedPdf: true,
      includesOcrTextLayerForScans: true,
      generatedAt: new Date().toISOString(),
    };
  }

  validateAccessibilityReadiness(input: AccessibilityReadinessInput): AccessibilityReadinessResult {
    const warnings: string[] = [];

    if (input.isTaggedPdf === false) {
      warnings.push('Tagged PDF is required for accessible document structure.');
    }

    if (input.hasOcrTextLayer === false) {
      warnings.push('Scanned documents should include OCR text for screen-reader support.');
    }

    if (input.pdfaLevel && !['PDF/A-1b', 'PDF/A-2b'].includes(input.pdfaLevel)) {
      warnings.push('Use PDF/A-1b or PDF/A-2b for Ontario filing compatibility.');
    }

    return {
      compliant: warnings.length === 0,
      warnings,
    };
  }
}
