import { describe, it, expect } from 'vitest';
import { PdfService } from '../backend/src/services/pdfService';

describe('PdfService', () => {
  it('builds accessible metadata defaults for Ontario filing prep', () => {
    const service = new PdfService();
    const metadata = service.buildAccessibleMetadata('Summary of Information for Form 7A');

    expect(metadata.pdfStandard).toBe('PDF/A-1b');
    expect(metadata.taggedPdf).toBe(true);
    expect(metadata.includesOcrTextLayerForScans).toBe(true);
    expect(metadata.language).toBe('en-CA');
  });

  it('returns warnings when accessibility readiness checks fail', () => {
    const service = new PdfService();
    const result = service.validateAccessibilityReadiness({
      isTaggedPdf: false,
      hasOcrTextLayer: false,
      pdfaLevel: 'PDF/A-3',
    });

    expect(result.compliant).toBe(false);
    expect(result.warnings.some((w) => w.includes('Tagged PDF'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('OCR'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('PDF/A-1b or PDF/A-2b'))).toBe(true);
  });
});
