import { describe, it, expect } from 'vitest';
import { ConsumerDomainModule } from '../src/core/domains/ConsumerDomainModule';
import { MatterClassification, ForumMap } from '../src/core/models';

describe('ConsumerDomainModule', () => {
  const module = new ConsumerDomainModule();

  it('has domain set to consumerProtection', () => {
    expect(module.domain).toBe('consumerProtection');
  });

  it('generates Consumer Protection Ontario complaint guide', () => {
    const classification: MatterClassification = {
      id: 'test-consumer-1',
      domain: 'consumerProtection',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business',
        names: ['Consumer Name', 'Business Name']
      }
    };

    const forumMap: ForumMap = {
      domain: 'consumerProtection',
      primaryForum: {
        id: 'ON-SMALL',
        name: 'Ontario Small Claims Court',
        type: 'court',
        jurisdiction: 'Ontario'
      },
      alternatives: [],
      escalation: []
    };

    const result = module.generate({
      classification,
      forumMap,
      timeline: undefined,
      missingEvidence: [],
      evidenceIndex: { items: [], compiledAt: new Date().toISOString() },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    });

    expect(result.drafts).toHaveLength(4);
    const cpoGuide = result.drafts.find((d) => d.title === 'Consumer Protection Ontario Complaint Guide');
    expect(cpoGuide).toBeDefined();
    expect(cpoGuide?.sections[0].content).toContain('Consumer Protection Act, 2002');
    expect(cpoGuide?.sections[0].content).toContain('https://www.ontario.ca/page/filing-consumer-complaint');
  });

  it('generates chargeback guide draft', () => {
    const classification: MatterClassification = {
      id: 'test-consumer-2',
      domain: 'consumerProtection',
      jurisdiction: 'Ontario',
      parties: { claimantType: 'individual', respondentType: 'business' }
    };

    const forumMap: ForumMap = {
      domain: 'consumerProtection',
      primaryForum: {
        id: 'ON-SMALL',
        name: 'Ontario Small Claims Court',
        type: 'court',
        jurisdiction: 'Ontario'
      },
      alternatives: [],
      escalation: []
    };

    const result = module.generate({
      classification,
      forumMap,
      timeline: undefined,
      missingEvidence: [],
      evidenceIndex: { items: [], compiledAt: new Date().toISOString() },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    });

    const chargebackGuide = result.drafts.find((d) => d.title === 'Chargeback Request Guide');
    expect(chargebackGuide).toBeDefined();
    expect(chargebackGuide?.sections[0].content).toContain('chargeback');
    expect(chargebackGuide?.sections[0].content).toContain('credit card');
    expect(chargebackGuide?.sections[0].content).toContain('60-120 days');
  });

  it('generates service dispute letter with classification data', () => {
    const classification: any = {
      id: 'test-consumer-3',
      domain: 'consumerProtection',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business',
        claimantName: 'Alice Johnson',
        respondentName: 'XYZ Services Inc.'
      },
      timeline: { start: '2025-10-01' },
      description: 'Service was not provided as contracted',
      notes: ['INV-789', 'Refund $1,200']
    };

    const forumMap: ForumMap = {
      domain: 'consumerProtection',
      primaryForum: {
        id: 'ON-SMALL',
        name: 'Ontario Small Claims Court',
        type: 'court',
        jurisdiction: 'Ontario'
      },
      alternatives: [],
      escalation: []
    };

    const result = module.generate({
      classification,
      forumMap,
      timeline: undefined,
      missingEvidence: [],
      evidenceIndex: { items: [], compiledAt: new Date().toISOString() },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    });

    const disputeLetter = result.drafts.find((d) => d.title === 'Service Dispute Letter');
    expect(disputeLetter).toBeDefined();
    expect(disputeLetter?.sections[0].content).toContain('XYZ Services Inc.');
    expect(disputeLetter?.sections[0].content).toContain('Alice Johnson');
    expect(disputeLetter?.sections[0].content).toContain('2025-10-01');
    expect(disputeLetter?.sections[0].content).toContain('INV-789');
    expect(disputeLetter?.sections[0].content).toContain('Service was not provided as contracted');
    expect(disputeLetter?.sections[0].content).toContain('Refund $1,200');
    expect(disputeLetter?.missingConfirmations).toBeDefined();
    expect(disputeLetter?.missingConfirmations?.length).toBeGreaterThan(0);
  });

  it('generates unfair practice documentation checklist', () => {
    const classification: MatterClassification = {
      id: 'test-consumer-4',
      domain: 'consumerProtection',
      jurisdiction: 'Ontario',
      parties: { claimantType: 'individual', respondentType: 'business' }
    };

    const forumMap: ForumMap = {
      domain: 'consumerProtection',
      primaryForum: {
        id: 'ON-SMALL',
        name: 'Ontario Small Claims Court',
        type: 'court',
        jurisdiction: 'Ontario'
      },
      alternatives: [],
      escalation: []
    };

    const result = module.generate({
      classification,
      forumMap,
      timeline: undefined,
      missingEvidence: [],
      evidenceIndex: { items: [], compiledAt: new Date().toISOString() },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    });

    const unfairChecklist = result.drafts.find((d) => d.title === 'Unfair Practice Documentation Checklist');
    expect(unfairChecklist).toBeDefined();
    expect(unfairChecklist?.sections[0].content).toContain('Prohibited Practices');
    expect(unfairChecklist?.sections[0].content).toContain('False, misleading');
    expect(unfairChecklist?.sections[0].content).toContain('Evidence to Gather');
  });

  it('generates all four consumer protection drafts', () => {
    const classification: MatterClassification = {
      id: 'test-consumer-5',
      domain: 'consumerProtection',
      jurisdiction: 'Ontario',
      parties: { claimantType: 'individual', respondentType: 'business' }
    };

    const forumMap: ForumMap = {
      domain: 'consumerProtection',
      primaryForum: {
        id: 'ON-SMALL',
        name: 'Ontario Small Claims Court',
        type: 'court',
        jurisdiction: 'Ontario'
      },
      alternatives: [],
      escalation: []
    };

    const result = module.generate({
      classification,
      forumMap,
      timeline: undefined,
      missingEvidence: [],
      evidenceIndex: { items: [], compiledAt: new Date().toISOString() },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    });

    expect(result.drafts).toHaveLength(4);
    const titles = result.drafts.map((d) => d.title);
    expect(titles).toContain('Consumer Protection Ontario Complaint Guide');
    expect(titles).toContain('Chargeback Request Guide');
    expect(titles).toContain('Service Dispute Letter');
    expect(titles).toContain('Unfair Practice Documentation Checklist');

    // All drafts should have disclaimers
    result.drafts.forEach((draft) => {
      expect(draft.disclaimer).toBeDefined();
      expect(draft.disclaimer).toContain('legal information');
    });
  });
});
