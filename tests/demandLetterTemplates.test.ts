import { describe, it, expect } from 'vitest';
import { TemplateLibrary } from '../src/core/templates/TemplateLibrary';

describe('TemplateLibrary — Demand Letter Templates', () => {
  const templates = new TemplateLibrary();

  it('renders property damage demand letter', () => {
    const content = templates.renderTemplate('civil/demand_letter_property_damage', {
      respondentName: 'John Doe',
      claimantName: 'Jane Smith',
      incidentDate: '2025-12-01',
      propertyAddress: '123 Main St',
      damageDescription: 'Tree fell on fence, causing $500 in damage.',
      amountClaimed: 500
    });

    expect(content).toContain('John Doe');
    expect(content).toContain('Jane Smith');
    expect(content).toContain('2025-12-01');
    expect(content).toContain('Tree fell on fence');
    expect(content).toContain('$500');
    expect(content).toContain('Settlement Path');
  });

  it('renders contract dispute demand letter', () => {
    const content = templates.renderTemplate('civil/demand_letter_contract_dispute', {
      respondentName: 'ABC Corp',
      claimantName: 'Jane Smith',
      contractRef: 'Agreement dated 2024-05-01',
      issueSummary: 'Failed to deliver goods as specified.',
      amountClaimed: 1000
    });

    expect(content).toContain('ABC Corp');
    expect(content).toContain('Jane Smith');
    expect(content).toContain('Agreement dated 2024-05-01');
    expect(content).toContain('Failed to deliver goods');
    expect(content).toContain('$1000');
    expect(content).toContain('Settlement Path');
  });

  it('renders anticipate defense guidance', () => {
    const content = templates.renderTemplate('civil/anticipate_defense', {});

    expect(content).toContain('Anticipate the Defense');
    expect(content).toContain('Typical Defenses');
    expect(content).toContain('No negligence');
    expect(content).toContain('Contributory negligence');
    expect(content).toContain('Settlement is common');
  });

  it('renders arborist report guidance', () => {
    const content = templates.renderTemplate('civil/arborist_report_guidance', {});

    expect(content).toContain('Arborist Report Guidance');
    expect(content).toContain('Species and condition');
    expect(content).toContain('disease, rot, or structural failure');
    expect(content).toContain('Attach to demand letter');
  });

  it('renders contractor estimate guidance', () => {
    const content = templates.renderTemplate('civil/contractor_estimate_guidance', {});

    expect(content).toContain('Contractor Estimate Guidance');
    expect(content).toContain('line-items');
    expect(content).toContain('materials, labour');
    expect(content).toContain('Get at least two estimates');
  });
});
