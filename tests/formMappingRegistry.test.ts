import { describe, it, expect } from 'vitest';
import { FormMappingRegistry } from '../src/core/templates/FormMappingRegistry';

describe('FormMappingRegistry', () => {
  describe('Form Mapping Retrieval', () => {
    it('should retrieve Form 7A mapping', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('form-7a-small-claims');

      expect(mapping).toBeDefined();
      expect(mapping?.formName).toBe('Small Claims Court Form 7A - Statement of Claim');
      expect(mapping?.authority).toBe('Superior Court of Justice - Small Claims Court');
      expect(mapping?.officialUrl).toContain('ontariocourtforms.on.ca');
    });

    it('should retrieve LTB Form T1 mapping', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('ltb-form-t1');

      expect(mapping).toBeDefined();
      expect(mapping?.formName).toBe('Landlord and Tenant Board Form T1 - Tenant Application');
      expect(mapping?.authority).toBe('Landlord and Tenant Board');
      expect(mapping?.officialUrl).toContain('tribunalsontario.ca');
    });

    it('should retrieve LTB Form L1 mapping', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('ltb-form-l1');

      expect(mapping).toBeDefined();
      expect(mapping?.formName).toContain('Eviction');
      expect(mapping?.sections.length).toBeGreaterThan(0);
    });

    it('should retrieve Victim Impact Statement mapping', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('victim-impact-statement');

      expect(mapping).toBeDefined();
      expect(mapping?.formName).toBe('Victim Impact Statement');
      expect(mapping?.jurisdiction).toBe('Ontario');
    });

    it('should return undefined for non-existent form', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('non-existent-form');

      expect(mapping).toBeUndefined();
    });
  });

  describe('Form 7A Detailed Mapping', () => {
    it('should have correct sections for Form 7A', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('form-7a-small-claims');

      expect(mapping?.sections).toHaveLength(3);
      expect(mapping?.sections[0].title).toBe('Part A - Claimant Information');
      expect(mapping?.sections[1].title).toBe('Part B - Defendant Information');
      expect(mapping?.sections[2].title).toBe('Part C - Claim Details');
    });

    it('should map claimant fields correctly', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('form-7a-small-claims');
      const claimantSection = mapping?.sections[0];

      expect(claimantSection?.fields).toHaveLength(3);
      expect(claimantSection?.fields[0].variableName).toBe('claimantName');
      expect(claimantSection?.fields[0].officialSection).toBe('Box 1');
      expect(claimantSection?.fields[1].variableName).toBe('claimantAddress');
      expect(claimantSection?.fields[2].variableName).toBe('claimantPhone');
    });

    it('should map claim details correctly', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('form-7a-small-claims');
      const claimSection = mapping?.sections[2];

      const amountField = claimSection?.fields.find(f => f.variableName === 'amountClaimed');
      expect(amountField).toBeDefined();
      expect(amountField?.officialSection).toBe('Box 3');
      expect(amountField?.sectionLabel).toBe('Amount Claimed');

      const particularsField = claimSection?.fields.find(f => f.variableName === 'particulars');
      expect(particularsField).toBeDefined();
      expect(particularsField?.officialSection).toBe('Section 6');
    });

    it('should include filing instructions for Form 7A', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('form-7a-small-claims');

      expect(mapping?.filingInstructions.length).toBeGreaterThan(0);
      expect(mapping?.filingInstructions.some(i => i.includes('filing fee'))).toBe(true);
      expect(mapping?.filingInstructions.some(i => i.includes('serve'))).toBe(true);
    });

    it('should include warnings for Form 7A', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('form-7a-small-claims');

      expect(mapping?.warnings).toBeDefined();
      expect(mapping?.warnings?.some(w => w.includes('2 years'))).toBe(true);
      expect(mapping?.warnings?.some(w => w.includes('$50,000'))).toBe(true);
    });
  });

  describe('Filing Guide Generation', () => {
    it('should generate filing guide with user data', () => {
      const registry = new FormMappingRegistry();
      const userData = {
        claimantName: 'Jane Smith',
        claimantAddress: '123 Main St, Toronto, ON M5V 1A1',
        claimantPhone: '416-555-0123',
        respondentName: 'ABC Construction Ltd.',
        respondentAddress: '456 Business Rd, Toronto, ON M6K 2B2',
        amountClaimed: '5000.00',
        courtLocation: 'Toronto',
        incidentDate: '2024-06-15',
        particulars: 'Defendant damaged my property on June 15, 2024. Repair costs totaled $5,000.',
      };

      const guide = registry.generateFilingGuide('form-7a-small-claims', userData);

      expect(guide).toContain('Jane Smith');
      expect(guide).toContain('ABC Construction Ltd.');
      expect(guide).toContain('5000.00');
      expect(guide).toContain('Toronto');
      expect(guide).toContain('How to Complete');
      expect(guide).toContain('Step-by-Step Instructions');
    });

    it('should include table with variable mappings', () => {
      const registry = new FormMappingRegistry();
      const userData = { claimantName: 'John Doe' };

      const guide = registry.generateFilingGuide('form-7a-small-claims', userData);

      expect(guide).toContain('| Official Form Field | Your Information |');
      expect(guide).toContain('John Doe');
    });

    it('should include official URL in guide', () => {
      const registry = new FormMappingRegistry();
      const guide = registry.generateFilingGuide('form-7a-small-claims', {});

      expect(guide).toContain('ontariocourtforms.on.ca');
      expect(guide).toContain('Download Link:');
    });

    it('should include warnings in filing guide', () => {
      const registry = new FormMappingRegistry();
      const guide = registry.generateFilingGuide('form-7a-small-claims', {});

      expect(guide).toContain('Important Warnings');
      expect(guide).toContain('NON-REFUNDABLE');
      expect(guide).toContain('limitation period');
    });

    it('should include legal disclaimer', () => {
      const registry = new FormMappingRegistry();
      const guide = registry.generateFilingGuide('form-7a-small-claims', {});

      expect(guide).toContain('Legal Disclaimer');
      expect(guide).toContain('information only');
      expect(guide).toContain('not legal advice');
    });

    it('should handle missing variables gracefully', () => {
      const registry = new FormMappingRegistry();
      const guide = registry.generateFilingGuide('form-7a-small-claims', {});

      expect(guide).toContain('[Claimant Name]');
      expect(guide).toContain('[Defendant Name]');
      expect(guide).toContain('[Amount Claimed]');
    });
  });

  describe('Data Summary Generation', () => {
    it('should generate data summary with sections', () => {
      const registry = new FormMappingRegistry();
      const userData = {
        claimantName: 'Jane Smith',
        amountClaimed: '5000.00',
      };

      const summary = registry.generateDataSummary('form-7a-small-claims', userData);

      expect(summary.formName).toBe('Small Claims Court Form 7A - Statement of Claim');
      expect(summary.authority).toBe('Superior Court of Justice - Small Claims Court');
      expect(summary.sections.length).toBeGreaterThan(0);
    });

    it('should include field-value pairs in summary', () => {
      const registry = new FormMappingRegistry();
      const userData = {
        claimantName: 'Jane Smith',
        claimantAddress: '123 Main St, Toronto, ON',
      };

      const summary = registry.generateDataSummary('form-7a-small-claims', userData);
      const claimantSection = summary.sections[0];

      expect(claimantSection.rows.some(r => r.value === 'Jane Smith')).toBe(true);
      expect(claimantSection.rows.some(r => r.value === '123 Main St, Toronto, ON')).toBe(true);
    });

    it('should include instructions in summary rows', () => {
      const registry = new FormMappingRegistry();
      const summary = registry.generateDataSummary('form-7a-small-claims', {});

      const rowsWithInstructions = summary.sections.flatMap(s => s.rows).filter(r => r.instructions);
      expect(rowsWithInstructions.length).toBeGreaterThan(0);
    });
  });

  describe('LTB Form Mappings', () => {
    it('should map LTB T1 tenant information correctly', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('ltb-form-t1');

      const tenantSection = mapping?.sections.find(s => s.title.includes('Tenant Information'));
      expect(tenantSection).toBeDefined();
      expect(tenantSection?.fields.some(f => f.variableName === 'tenantName')).toBe(true);
      expect(tenantSection?.fields.some(f => f.variableName === 'rentalAddress')).toBe(true);
    });

    it('should include LTB filing fee in instructions', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('ltb-form-t1');

      expect(mapping?.filingInstructions.some(i => i.includes('$53'))).toBe(true);
      expect(mapping?.filingInstructions.some(i => i.includes('fee waiver'))).toBe(true);
    });

    it('should warn about rent withholding for LTB T1', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('ltb-form-t1');

      expect(mapping?.warnings?.some(w => w.includes('withhold rent'))).toBe(true);
      expect(mapping?.warnings?.some(w => w.includes('evicted'))).toBe(true);
    });

    it('should map LTB L1 arrears details correctly', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('ltb-form-l1');

      const arrearsSection = mapping?.sections.find(s => s.title.includes('Arrears'));
      expect(arrearsSection).toBeDefined();
      expect(arrearsSection?.fields.some(f => f.variableName === 'monthlyRent')).toBe(true);
      expect(arrearsSection?.fields.some(f => f.variableName === 'rentOwed')).toBe(true);
    });

    it('should require N4 notice for LTB L1', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('ltb-form-l1');

      expect(mapping?.filingInstructions.some(i => i.includes('N4'))).toBe(true);
      expect(mapping?.warnings?.some(w => w.includes('N4'))).toBe(true);
    });
  });

  describe('Victim Impact Statement Mapping', () => {
    it('should map impact sections correctly', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('victim-impact-statement');

      const impactSection = mapping?.sections.find(s => s.title.includes('Impact Statement'));
      expect(impactSection).toBeDefined();
      expect(impactSection?.fields.some(f => f.variableName === 'emotionalImpact')).toBe(true);
      expect(impactSection?.fields.some(f => f.variableName === 'physicalImpact')).toBe(true);
      expect(impactSection?.fields.some(f => f.variableName === 'economicImpact')).toBe(true);
    });

    it('should warn about cross-examination for victim statements', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('victim-impact-statement');

      expect(mapping?.warnings?.some(w => w.includes('cross-examine'))).toBe(true);
      expect(mapping?.warnings?.some(w => w.includes('SENTENCING'))).toBe(true);
    });

    it('should instruct to submit through Crown Attorney', () => {
      const registry = new FormMappingRegistry();
      const mapping = registry.getMapping('victim-impact-statement');

      expect(mapping?.filingInstructions.some(i => i.includes('Crown Attorney'))).toBe(true);
    });
  });

  describe('Authority-Based Filtering', () => {
    it('should filter mappings by authority', () => {
      const registry = new FormMappingRegistry();
      const ltbForms = registry.getMappingsByAuthority('Landlord and Tenant Board');

      expect(ltbForms.length).toBeGreaterThanOrEqual(2); // T1 and L1
      expect(ltbForms.every(f => f.authority === 'Landlord and Tenant Board')).toBe(true);
    });

    it('should filter Small Claims Court forms', () => {
      const registry = new FormMappingRegistry();
      const scForms = registry.getMappingsByAuthority('Superior Court of Justice - Small Claims Court');

      expect(scForms.length).toBeGreaterThanOrEqual(1); // Form 7A
      expect(scForms[0].formId).toBe('form-7a-small-claims');
    });
  });
});
