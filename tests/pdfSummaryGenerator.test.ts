import { describe, it, expect } from 'vitest';
import { PDFSummaryGenerator } from '../src/core/documents/PDFSummaryGenerator';

describe('PDFSummaryGenerator', () => {
  describe('Summary Generation', () => {
    it('should generate summary for Form 7A', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {
          claimantName: 'Jane Smith',
          respondentName: 'ABC Corp',
          amountClaimed: '5000.00',
        },
      });

      expect(result.markdownContent).toBeDefined();
      expect(result.metadata.formName).toBe('Small Claims Court Form 7A - Statement of Claim');
      expect(result.filename).toContain('form-7a-small-claims_summary');
    });

    it('should include user data in summary content', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {
          claimantName: 'Jane Smith',
          respondentName: 'ABC Corp',
          amountClaimed: '5000.00',
        },
      });

      expect(result.markdownContent).toContain('Jane Smith');
      expect(result.markdownContent).toContain('ABC Corp');
      expect(result.markdownContent).toContain('5000.00');
    });

    it('should include prominent disclaimer', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {},
      });

      expect(result.markdownContent).toContain('NOT an official court document');
      expect(result.markdownContent).toContain('legal information, not legal advice');
    });

    it('should include official form URL', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {},
      });

      expect(result.markdownContent).toContain('ontariocourtforms.on.ca');
      expect(result.markdownContent).toContain('Download the official');
    });

    it('should include data summary table', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: { claimantName: 'John Doe' },
      });

      expect(result.markdownContent).toContain('| Official Form Section | Your Information |');
      expect(result.markdownContent).toContain('John Doe');
    });

    it('should include filing guide by default', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {},
        includeFilingGuide: true,
      });

      expect(result.markdownContent).toContain('Step-by-Step Instructions');
      expect(result.markdownContent).toContain('Filing Instructions');
    });

    it('should exclude filing guide if requested', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {},
        includeFilingGuide: false,
      });

      expect(result.markdownContent).not.toContain('Step-by-Step Instructions');
      expect(result.markdownContent).toContain('Summary of Information'); // Header should still be there
    });

    it('should include matter ID in filename when provided', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {},
        matterId: 'matter-123',
      });

      expect(result.filename).toContain('matter-123');
      expect(result.metadata.matterId).toBe('matter-123');
    });

    it('should include generation timestamp', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {},
      });

      expect(result.metadata.generatedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
      expect(result.markdownContent).toContain('Generated:');
    });

    it('should throw error for non-existent form', () => {
      const generator = new PDFSummaryGenerator();
      
      expect(() => {
        generator.generateSummary({
          formId: 'non-existent-form',
          variables: {},
        });
      }).toThrow('No form mapping found');
    });
  });

  describe('Batch Generation', () => {
    it('should generate multiple summaries', () => {
      const generator = new PDFSummaryGenerator();
      const results = generator.generateBatch([
        { formId: 'form-7a-small-claims', variables: { claimantName: 'Alice' } },
        { formId: 'ltb-form-t1', variables: { tenantName: 'Bob' } },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].metadata.formName).toContain('Form 7A');
      expect(results[1].metadata.formName).toContain('Form T1');
    });

    it('should include user data in batch results', () => {
      const generator = new PDFSummaryGenerator();
      const results = generator.generateBatch([
        { formId: 'form-7a-small-claims', variables: { claimantName: 'Alice Smith' } },
        { formId: 'ltb-form-t1', variables: { tenantName: 'Bob Jones' } },
      ]);

      expect(results[0].markdownContent).toContain('Alice Smith');
      expect(results[1].markdownContent).toContain('Bob Jones');
    });
  });

  describe('LTB Form Summaries', () => {
    it('should generate summary for LTB T1', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'ltb-form-t1',
        variables: {
          tenantName: 'John Smith',
          landlordName: 'ABC Property Management',
          rentalAddress: '123 Main St, Toronto, ON',
        },
      });

      expect(result.metadata.formName).toContain('Form T1');
      expect(result.metadata.authority).toBe('Landlord and Tenant Board');
      expect(result.markdownContent).toContain('John Smith');
      expect(result.markdownContent).toContain('ABC Property Management');
    });

    it('should include LTB filing fee information', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'ltb-form-t1',
        variables: {},
      });

      expect(result.markdownContent).toContain('$53');
      expect(result.markdownContent).toContain('fee waiver');
    });

    it('should warn about rent withholding for LTB T1', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'ltb-form-t1',
        variables: {},
      });

      expect(result.markdownContent).toContain('withhold rent');
      expect(result.markdownContent).toContain('Important Warnings');
    });

    it('should generate summary for LTB L1', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'ltb-form-l1',
        variables: {
          landlordName: 'Smith Property Inc.',
          tenantName: 'Alice Johnson',
          monthlyRent: '1500.00',
          rentOwed: '4500.00',
        },
      });

      expect(result.metadata.formName).toContain('Eviction');
      expect(result.markdownContent).toContain('Alice Johnson');
      expect(result.markdownContent).toContain('4500.00');
    });

    it('should include N4 notice requirement for L1', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'ltb-form-l1',
        variables: {},
      });

      expect(result.markdownContent).toContain('N4');
      expect(result.markdownContent).toContain('Important Warnings');
    });
  });

  describe('Victim Impact Statement Summary', () => {
    it('should generate summary for victim impact statement', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'victim-impact-statement',
        variables: {
          victimName: 'Jane Doe',
          caseNumber: 'CR-24-12345',
          emotionalImpact: 'Severe anxiety and fear',
        },
      });

      expect(result.metadata.formName).toBe('Victim Impact Statement');
      expect(result.markdownContent).toContain('Jane Doe');
      expect(result.markdownContent).toContain('CR-24-12345');
      expect(result.markdownContent).toContain('Severe anxiety and fear');
    });

    it('should include Crown Attorney contact guidance', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'victim-impact-statement',
        variables: {},
      });

      expect(result.markdownContent).toContain('Crown Attorney');
      expect(result.markdownContent).toContain('SENTENCING');
    });
  });

  describe('Header and Footer', () => {
    it('should include custom header when provided', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {},
        customHeader: 'Custom Header Text',
      });

      expect(result.markdownContent).toContain('Custom Header Text');
    });

    it('should include custom footer when provided', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {},
        customFooter: 'Custom Footer Information',
      });

      expect(result.markdownContent).toContain('Custom Footer Information');
    });

    it('should include resource links in footer', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {},
      });

      expect(result.markdownContent).toContain('Community Legal Education Ontario');
      expect(result.markdownContent).toContain('Legal Aid Ontario');
      expect(result.markdownContent).toContain('1-800-668-8258');
    });
  });

  describe('Available Forms', () => {
    it('should list available forms', () => {
      const generator = new PDFSummaryGenerator();
      const forms = generator.getAvailableForms();

      expect(forms).toContain('form-7a-small-claims');
      expect(forms).toContain('ltb-form-t1');
      expect(forms).toContain('ltb-form-l1');
      expect(forms).toContain('victim-impact-statement');
    });

    it('should check if form mapping exists', () => {
      const generator = new PDFSummaryGenerator();

      expect(generator.hasFormMapping('form-7a-small-claims')).toBe(true);
      expect(generator.hasFormMapping('ltb-form-t1')).toBe(true);
      expect(generator.hasFormMapping('non-existent-form')).toBe(false);
    });
  });

  describe('Markdown Escaping', () => {
    it('should escape special Markdown characters in user data', () => {
      const generator = new PDFSummaryGenerator();
      const result = generator.generateSummary({
        formId: 'form-7a-small-claims',
        variables: {
          claimantName: 'John | Smith*',
          particulars: 'Item #1: Description [with brackets]',
        },
      });

      // Should escape pipes, asterisks, brackets, etc.
      expect(result.markdownContent).toContain('John \\| Smith\\*');
      expect(result.markdownContent).toContain('\\[with brackets\\]');
    });
  });
});
