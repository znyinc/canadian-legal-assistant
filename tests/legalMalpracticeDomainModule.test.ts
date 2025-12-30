import { describe, it, expect } from 'vitest';
import { LegalMalpracticeDomainModule } from '../src/core/domains/LegalMalpracticeDomainModule';
import {
  MatterClassification,
  ForumMap,
  Timeline,
  EvidenceIndex,
  AuthorityRef
} from '../src/core/models';

describe('LegalMalpracticeDomainModule', () => {
  const module = new LegalMalpracticeDomainModule();

  const mockForum: AuthorityRef = {
    id: 'ON-SC',
    name: 'Ontario Superior Court of Justice',
    type: 'court',
    jurisdiction: 'Ontario'
  };

  const mockForumMap: ForumMap = {
    domain: 'legalMalpractice',
    primaryForum: mockForum,
    alternatives: [],
    escalation: [],
    rationale: 'Legal malpractice claims proceed in Superior Court'
  };

  const mockTimeline: Timeline = {
    items: [],
    gaps: [],
    missingTypes: []
  };

  const mockEvidenceIndex: EvidenceIndex = {
    items: [],
    sources: [],
    generatedAt: new Date().toISOString(),
    sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
  };

  it('should have domain set to legalMalpractice', () => {
    expect(module.domain).toBe('legalMalpractice');
  });

  it('should generate 5 malpractice-specific drafts', () => {
    const classification: MatterClassification = {
      id: 'test-1',
      domain: 'legalMalpractice',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business'
      },
      disputeAmount: 100000,
      status: 'classified',
      notes: [
        'Client Quinn Avery hired lawyer Morgan Vance for slip-and-fall claim',
        'Missed limitation deadline of 2025-01-10',
        'Discovered error on 2025-12-21'
      ]
    };

    const output = module.generate({
      classification,
      forumMap: mockForumMap,
      timeline: mockTimeline,
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockEvidenceIndex.sourceManifest,
      packageName: 'malpractice-test',
      missingEvidence: []
    });

    expect(output.drafts).toHaveLength(5);
    expect(output.drafts.map((d) => d.type)).toEqual([
      'lawpro_notice',
      'case_within_case',
      'expert_instruction',
      'demand_letter',
      'evidence_checklist'
    ]);
  });

  it('should generate LawPRO Notice with correct content', () => {
    const classification: MatterClassification = {
      id: 'test-2',
      domain: 'legalMalpractice',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business'
      },
      status: 'classified',
      notes: [
        'Client Quinn Avery',
        'Lawyer Morgan Vance',
        'Missed deadline 2025-01-10',
        'Discovery 2025-12-21'
      ]
    };

    const output = module.generate({
      classification,
      forumMap: mockForumMap,
      timeline: mockTimeline,
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockEvidenceIndex.sourceManifest,
      packageName: 'lawpro-test',
      missingEvidence: []
    });

    const lawproNotice = output.drafts.find((d) => d.type === 'lawpro_notice');
    expect(lawproNotice).toBeDefined();
    expect(lawproNotice!.title).toBe('LawPRO Immediate Notification Guide');
    expect(lawproNotice!.content).toContain('LawPRO');
    expect(lawproNotice!.content).toContain('Quinn Avery');
    expect(lawproNotice!.content).toContain('Morgan Vance');
    expect(lawproNotice!.content).toContain('2025-01-10');
    expect(lawproNotice!.content).toContain('2025-12-21');
  });

  it('should generate Case-Within-Case Analysis with damages calculation', () => {
    const classification: MatterClassification = {
      id: 'test-3',
      domain: 'legalMalpractice',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business'
      },
      disputeAmount: 100000,
      status: 'classified',
      notes: ['Original slip-and-fall claim']
    };

    const output = module.generate({
      classification,
      forumMap: mockForumMap,
      timeline: mockTimeline,
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockEvidenceIndex.sourceManifest,
      packageName: 'case-analysis-test',
      missingEvidence: []
    });

    const caseAnalysis = output.drafts.find((d) => d.type === 'case_within_case');
    expect(caseAnalysis).toBeDefined();
    expect(caseAnalysis!.content).toContain('Case-Within-a-Case');
    expect(caseAnalysis!.content).toContain('$100,000');
    expect(caseAnalysis!.content).toContain('slip-and-fall');
    expect(caseAnalysis!.content).toContain('Likelihood of success');
  });

  it('should generate Expert Instruction Letter template', () => {
    const classification: MatterClassification = {
      id: 'test-4',
      domain: 'legalMalpractice',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business'
      },
      status: 'classified',
      notes: ['Defendant Morgan Vance, LL.B.']
    };

    const output = module.generate({
      classification,
      forumMap: mockForumMap,
      timeline: mockTimeline,
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockEvidenceIndex.sourceManifest,
      packageName: 'expert-test',
      missingEvidence: []
    });

    const expertLetter = output.drafts.find((d) => d.type === 'expert_instruction');
    expect(expertLetter).toBeDefined();
    expect(expertLetter!.title).toBe('Expert Witness Instruction Letter Template');
    expect(expertLetter!.content).toContain('Expert Opinion on Standard of Care');
    expect(expertLetter!.content).toContain('Morgan Vance');
    expect(expertLetter!.content).toContain('tickler systems');
  });

  it('should generate Formal Demand Letter', () => {
    const classification: MatterClassification = {
      id: 'test-5',
      domain: 'legalMalpractice',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business'
      },
      disputeAmount: 100000,
      status: 'classified',
      notes: [
        'Client Quinn Avery',
        'Lawyer Morgan Vance',
        'Discovery 2025-12-21',
        'Missed deadline 2025-01-10'
      ]
    };

    const output = module.generate({
      classification,
      forumMap: mockForumMap,
      timeline: mockTimeline,
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockEvidenceIndex.sourceManifest,
      packageName: 'demand-test',
      missingEvidence: []
    });

    const demandLetter = output.drafts.find((d) => d.type === 'demand_letter');
    expect(demandLetter).toBeDefined();
    expect(demandLetter!.content).toContain('NOTICE OF LEGAL MALPRACTICE CLAIM');
    expect(demandLetter!.content).toContain('Quinn Avery');
    expect(demandLetter!.content).toContain('Morgan Vance');
    expect(demandLetter!.content).toContain('$100,000');
    expect(demandLetter!.content).toContain('21 days');
    expect(demandLetter!.content).toContain('LawPRO');
  });

  it('should generate Evidence Preservation Checklist', () => {
    const classification: MatterClassification = {
      id: 'test-6',
      domain: 'legalMalpractice',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business'
      },
      status: 'classified',
      notes: ['Underlying slip-and-fall matter']
    };

    const output = module.generate({
      classification,
      forumMap: mockForumMap,
      timeline: mockTimeline,
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockEvidenceIndex.sourceManifest,
      packageName: 'checklist-test',
      missingEvidence: []
    });

    const checklist = output.drafts.find((d) => d.type === 'evidence_checklist');
    expect(checklist).toBeDefined();
    expect(checklist!.title).toBe('Evidence Preservation Checklist for Malpractice Claims');
    expect(checklist!.content).toContain('Retainer Agreement');
    expect(checklist!.content).toContain('Admission of error');
    expect(checklist!.content).toContain('Case-Within-Case');
    expect(checklist!.content).toContain('2 years from discovery');
  });

  it('should include missing confirmations for incomplete data', () => {
    const classification: MatterClassification = {
      id: 'test-7',
      domain: 'legalMalpractice',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business'
      },
      status: 'classified',
      notes: [] // No information provided
    };

    const output = module.generate({
      classification,
      forumMap: mockForumMap,
      timeline: mockTimeline,
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockEvidenceIndex.sourceManifest,
      packageName: 'missing-test',
      missingEvidence: []
    });

    // Check that missing confirmations are flagged
    const lawproNotice = output.drafts.find((d) => d.type === 'lawpro_notice');
    expect(lawproNotice!.missingConfirmations).toContain('Confirm client name for LawPRO notification');
    expect(lawproNotice!.missingConfirmations).toContain(
      'Confirm defendant lawyer name and contact information'
    );
    expect(lawproNotice!.missingConfirmations).toContain(
      'Confirm the specific deadline that was missed'
    );
  });

  it('should package all drafts with source and evidence manifests', () => {
    const classification: MatterClassification = {
      id: 'test-8',
      domain: 'legalMalpractice',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business'
      },
      status: 'classified',
      notes: []
    };

    const output = module.generate({
      classification,
      forumMap: mockForumMap,
      timeline: mockTimeline,
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockEvidenceIndex.sourceManifest,
      packageName: 'full-package-test',
      missingEvidence: []
    });

    expect(output.package.name).toBe('full-package-test');
    expect(output.package.files.length).toBeGreaterThan(0);
    expect(output.package.files.some((f) => f.path.includes('lawpro_notice'))).toBe(true);
    expect(output.package.files.some((f) => f.path.includes('case_within_case'))).toBe(true);
    expect(output.package.files.some((f) => f.path.includes('expert_instruction'))).toBe(true);
    expect(output.package.files.some((f) => f.path.includes('demand_letter'))).toBe(true);
    expect(output.package.files.some((f) => f.path.includes('evidence_checklist'))).toBe(true);
  });
});
