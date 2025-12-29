import { describe, it, expect } from 'vitest';
import { OCPPValidator } from '../src/core/ocpp/OCPPValidator';

describe('OCPPValidator', () => {
  const validator = new OCPPValidator();

  describe('validateFiling', () => {
    it('passes validation for compliant PDF/A filing', () => {
      const result = validator.validateFiling({
        filename: 'MOTION-2025-01-15.pdf',
        fileSize: 5 * 1024 * 1024, // 5MB
        isPDFA: true,
        pageSize: '8.5x11',
        jurisdiction: 'Ontario'
      });

      expect(result.compliant).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails validation for oversized file', () => {
      const result = validator.validateFiling({
        filename: 'MOTION.pdf',
        fileSize: 25 * 1024 * 1024, // 25MB
        isPDFA: true,
        jurisdiction: 'Ontario'
      });

      expect(result.compliant).toBe(false);
      expect(result.errors.some((e) => e.includes('exceeds maximum 20MB'))).toBe(true);
    });

    it('fails validation for non-PDF/A format', () => {
      const result = validator.validateFiling({
        filename: 'MOTION.pdf',
        fileSize: 5 * 1024 * 1024,
        isPDFA: false,
        jurisdiction: 'Ontario'
      });

      expect(result.compliant).toBe(false);
      expect(result.errors.some((e) => e.includes('PDF/A format'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('Convert to PDF/A'))).toBe(true);
    });

    it('warns for invalid filename format', () => {
      const result = validator.validateFiling({
        filename: 'Motion with spaces.pdf',
        fileSize: 5 * 1024 * 1024,
        isPDFA: true,
        jurisdiction: 'Ontario'
      });

      expect(result.warnings.some((w) => w.includes('naming convention'))).toBe(true);
    });

    it('warns for non-Letter page size', () => {
      const result = validator.validateFiling({
        filename: 'MOTION.pdf',
        fileSize: 5 * 1024 * 1024,
        isPDFA: true,
        pageSize: 'A4',
        jurisdiction: 'Ontario'
      });

      expect(result.warnings.some((w) => w.includes('8.5" x 11"'))).toBe(true);
    });

    it('warns when PDF/A compliance cannot be verified', () => {
      const result = validator.validateFiling({
        filename: 'MOTION.pdf',
        fileSize: 5 * 1024 * 1024,
        isPDFA: undefined,
        jurisdiction: 'Ontario'
      });

      expect(result.warnings.some((w) => w.includes('Unable to verify PDF/A'))).toBe(true);
    });

    it('skips validation for non-Ontario jurisdiction', () => {
      const result = validator.validateFiling({
        filename: 'bad filename.pdf',
        fileSize: 25 * 1024 * 1024,
        isPDFA: false,
        jurisdiction: 'British Columbia'
      });

      expect(result.compliant).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('generateComplianceChecklist', () => {
    it('generates comprehensive checklist', () => {
      const checklist = validator.generateComplianceChecklist();

      expect(checklist).toContain('PDF/A-1b or PDF/A-2b');
      expect(checklist).toContain('8.5" x 11"');
      expect(checklist).toContain('20MB');
      expect(checklist).toContain('LibreOffice');
      expect(checklist).toContain('MS Word');
      expect(checklist).toContain('Adobe Acrobat');
    });
  });

  describe('requiresOCPPValidation', () => {
    it('requires validation for Ontario OCPP domain', () => {
      const required = validator.requiresOCPPValidation('Ontario', 'ocppFiling');
      expect(required).toBe(true);
    });

    it('requires validation for Ontario civil negligence', () => {
      const required = validator.requiresOCPPValidation('Ontario', 'civilNegligence');
      expect(required).toBe(true);
    });

    it('requires validation for Ontario municipal property damage', () => {
      const required = validator.requiresOCPPValidation('Ontario', 'municipalPropertyDamage');
      expect(required).toBe(true);
    });

    it('does not require validation for landlord/tenant domain', () => {
      const required = validator.requiresOCPPValidation('Ontario', 'landlordTenant');
      expect(required).toBe(false);
    });

    it('does not require validation for non-Ontario jurisdictions', () => {
      const required = validator.requiresOCPPValidation('British Columbia', 'ocppFiling');
      expect(required).toBe(false);
    });
  });
});
