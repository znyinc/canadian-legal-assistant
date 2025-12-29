import { describe, it, expect } from 'vitest';
import { TemplateLibrary } from '../src/core/templates/TemplateLibrary';

describe('Consumer Protection Templates', () => {
  const library = new TemplateLibrary();

  it('renders Consumer Protection Ontario complaint guide', () => {
    const rendered = library.renderTemplate('consumer/cpo_complaint', {});
    expect(rendered).toContain('Consumer Protection Act, 2002');
    expect(rendered).toContain('Filing a Complaint with Consumer Protection Ontario');
    expect(rendered).toContain('https://www.ontario.ca/page/filing-consumer-complaint');
    expect(rendered).toContain('416-326-8800');
    expect(rendered).toContain('Small Claims Court');
    expect(rendered).toContain('Chargeback');
  });

  it('renders chargeback guide with key information', () => {
    const rendered = library.renderTemplate('consumer/chargeback_guide', {});
    expect(rendered).toContain('What is a chargeback?');
    expect(rendered).toContain('Product not delivered');
    expect(rendered).toContain('60-120 days');
    expect(rendered).toContain('credit card issuer');
    expect(rendered).toContain('Temporary credit');
    expect(rendered).toContain('Small Claims Court');
  });

  it('renders service dispute letter with variable interpolation', () => {
    const rendered = library.renderTemplate('consumer/service_dispute_letter', {
      businessName: 'Acme Repairs',
      consumerName: 'Jane Doe',
      serviceDate: '2025-11-15',
      contractReference: 'INV-12345',
      issueSummary: 'Incomplete repair work',
      resolutionRequested: 'Complete the work or refund $500'
    });
    expect(rendered).toContain('Acme Repairs');
    expect(rendered).toContain('Jane Doe');
    expect(rendered).toContain('2025-11-15');
    expect(rendered).toContain('INV-12345');
    expect(rendered).toContain('Incomplete repair work');
    expect(rendered).toContain('Complete the work or refund $500');
    expect(rendered).toContain('Consumer Protection Act, 2002');
    expect(rendered).toContain('10 business days');
  });

  it('renders unfair practice documentation checklist', () => {
    const rendered = library.renderTemplate('consumer/unfair_practice_documentation', {});
    expect(rendered).toContain('Unfair Practice Documentation');
    expect(rendered).toContain('Consumer Protection Act, 2002');
    expect(rendered).toContain('Prohibited Practices');
    expect(rendered).toContain('False, misleading, or deceptive');
    expect(rendered).toContain('Bait-and-switch');
    expect(rendered).toContain('Evidence to Gather');
    expect(rendered).toContain('Screenshots');
    expect(rendered).toContain('Consumer Protection Ontario complaint');
  });
});
