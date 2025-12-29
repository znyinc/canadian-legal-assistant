import { describe, it, expect } from 'vitest';
import { TemplateLibrary } from '../src/core/templates/TemplateLibrary';

describe('TemplateLibrary.renderTemplate()', () => {
  it('renders small claims form with provided context', () => {
    const lib = new TemplateLibrary();
    const content = lib.renderTemplate('civil/small_claims_form7a', {
      claimantName: 'Bob',
      respondentName: 'City of Toronto',
      amountClaimed: 1200,
      courtLocation: 'Toronto Small Claims Court',
      incidentDate: '2025-06-01',
      particulars: 'Tree fell on parked car.'
    });
    expect(content).toContain('Claimant: Bob');
    expect(content).toContain('City of Toronto');
    expect(content).toContain('Tree fell on parked car.');
  });
});