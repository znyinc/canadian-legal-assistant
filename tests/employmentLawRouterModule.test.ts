import { describe, it, expect } from 'vitest';
import { EmploymentLawRouterModule } from '../src/core/domains/EmploymentLawRouterModule';
import { DocumentDraftingEngine } from '../src/core/documents/DocumentDraftingEngine';
import { DocumentPackager } from '../src/core/documents/DocumentPackager';
import { EvidenceIndex } from '../src/core/models';

describe('EmploymentLawRouterModule', () => {
  let module: EmploymentLawRouterModule;
  let draftingEngine: DocumentDraftingEngine;
  let packager: DocumentPackager;

  beforeEach(() => {
    draftingEngine = new DocumentDraftingEngine();
    packager = new DocumentPackager();
    module = new EmploymentLawRouterModule(draftingEngine, packager);
  });

  describe('domain detection', () => {
    it('detects employment domain correctly', () => {
      expect(module.domain).toBe('employment');
    });

    it('extends BaseDomainModule correctly', () => {
      expect(module).toHaveProperty('domain');
      expect(typeof module['buildDrafts']).toBe('function');
    });
  });

  describe('draft generation', () => {
    it('generates 8 employment-specific drafts', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [
          {
            id: 'evidence-1',
            filename: 'payslip.pdf',
            type: 'PDF',
            metadata: { date: '2025-12-20' },
            credibilityScore: 0.9,
            tags: ['employment', 'termination']
          }
        ],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'high' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Dismissed December 1, 2025'
      };

      const drafts = module['buildDrafts'](input);

      expect(drafts).toHaveLength(8);
      expect(drafts[0].title).toContain('ESA Complaint vs Common Law');
      expect(drafts[1].title).toContain('Ministry of Labour');
      expect(drafts[2].title).toContain('Wrongful Dismissal');
      expect(drafts[3].title).toContain('Severance Pay');
      expect(drafts[4].title).toContain('Notice Requirements');
      expect(drafts[5].title).toContain('Evidence Checklist');
      expect(drafts[6].title).toContain('Limitation Periods');
      expect(drafts[7].title).toContain('Quick Actions');
    });

    it('includes ESA vs Common Law decision tree', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Employment termination'
      };

      const drafts = module['buildDrafts'](input);
      const decisionDraft = drafts[0];

      expect(decisionDraft.title).toContain('ESA Complaint vs Common Law');
      expect(decisionDraft.sections[0].heading).toContain('Quick Decision Tree');
      expect(decisionDraft.sections[0].content).toContain('ESA complaint');
      expect(decisionDraft.sections[0].content).toContain('common law wrongful dismissal');
    });

    it('provides Ministry of Labour complaint guidance', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'low' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Owed unpaid wages'
      };

      const drafts = module['buildDrafts'](input);
      const molDraft = drafts[1];

      expect(molDraft.title).toContain('Ministry of Labour');
      expect(molDraft.sections[0].heading).toContain('Eligibility');
      expect(molDraft.sections[1].heading).toContain('Award');
      expect(molDraft.sections[2].content).toContain('1-800-531-5551');
    });

    it('includes common law wrongful dismissal litigation guide', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'high' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Wrongful dismissal claim'
      };

      const drafts = module['buildDrafts'](input);
      const wrongfulDraft = drafts[2];

      expect(wrongfulDraft.title).toContain('Wrongful Dismissal');
      expect(wrongfulDraft.sections[0].heading).toContain('What is Wrongful Dismissal');
      expect(wrongfulDraft.sections[0].content).toContain('proper notice');
      expect(wrongfulDraft.sections[1].heading).toContain('Calculating Wrongful Dismissal Damages');
    });

    it('provides severance pay calculation guidance', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Severance dispute'
      };

      const drafts = module['buildDrafts'](input);
      const severanceDraft = drafts[3];

      expect(severanceDraft.title).toContain('Severance Pay');
      expect(severanceDraft.sections[0].content).toContain('severance');
      expect(severanceDraft.sections[0].content).toContain('2 weeks');
      expect(severanceDraft.sections[2].heading).toContain('Calculating');
    });

    it('explains notice requirements (ESA vs Common Law)', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'low' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Notice dispute'
      };

      const drafts = module['buildDrafts'](input);
      const noticeDraft = drafts[4];

      expect(noticeDraft.title).toContain('Notice Requirements');
      expect(noticeDraft.sections[0].heading).toContain('ESA Minimum');
      expect(noticeDraft.sections[1].heading).toContain('Common Law');
      expect(noticeDraft.sections[1].content).toContain('3 factors');
    });

    it('provides evidence checklist for employment claims', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'low' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Preparing evidence'
      };

      const drafts = module['buildDrafts'](input);
      const evidenceDraft = drafts[5];

      expect(evidenceDraft.title).toContain('Evidence Checklist');
      expect(evidenceDraft.sections[0].heading).toContain('Employment Relationship');
      expect(evidenceDraft.sections[0].content).toContain('Employment contract');
      expect(evidenceDraft.sections[0].content).toContain('Pay stubs');
    });

    it('includes limitation periods and deadlines', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'high' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Time-sensitive claim'
      };

      const drafts = module['buildDrafts'](input);
      const limitationDraft = drafts[6];

      expect(limitationDraft.title).toContain('Limitation Periods');
      expect(limitationDraft.sections[0].heading).toContain('Critical Limitation');
      expect(limitationDraft.sections[0].content).toContain('2 years');
      expect(limitationDraft.sections[0].content).toContain('strict');
    });

    it('provides interim relief and quick actions', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'high' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Just dismissed'
      };

      const drafts = module['buildDrafts'](input);
      const interimDraft = drafts[7];

      expect(interimDraft.title).toContain('Quick Actions');
      expect(interimDraft.sections[0].heading).toContain('Immediate Actions');
      expect(interimDraft.sections[1].heading).toContain('Negotiating Settlement');
      expect(interimDraft.sections[2].content).toContain('employment lawyer');
    });
  });

  describe('ESA vs litigation routing', () => {
    it('routes unpaid wages claim to ESA path', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'low' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Unpaid overtime wages'
      };

      const drafts = module['buildDrafts'](input);
      const decisionDraft = drafts[0];

      expect(decisionDraft.sections[0].content).toContain('unpaid wages');
      expect(decisionDraft.sections[0].content).toContain('ESA complaint');
    });

    it('routes broad damages claim to common law litigation', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'high' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Dismissed without notice after 10 years, lost benefits'
      };

      const drafts = module['buildDrafts'](input);
      const decisionDraft = drafts[0];

      expect(decisionDraft.sections[1].content).toContain('When NOT to choose ESA');
      expect(decisionDraft.sections[1].content).toContain('unfair treatment');
    });
  });

  describe('notice period calculation', () => {
    it('provides ESA minimum notice guidance (2 weeks)', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'low' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'ESA notice period'
      };

      const drafts = module['buildDrafts'](input);
      const noticeDraft = drafts[4];

      expect(noticeDraft.sections[0].content).toContain('2 weeks');
      expect(noticeDraft.sections[0].content).toContain('notice');
    });

    it('explains common law notice based on service length', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Common law notice analysis'
      };

      const drafts = module['buildDrafts'](input);
      const noticeDraft = drafts[4];

      expect(noticeDraft.sections[1].content).toContain('Length of Service');
      expect(noticeDraft.sections[1].content).toContain('10+ years');
      expect(noticeDraft.sections[1].content).toContain('3-24 months');
    });
  });

  describe('limitation period enforcement', () => {
    it('emphasizes strict 2-year deadline for ESA', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'high' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Deadline approaching'
      };

      const drafts = module['buildDrafts'](input);
      const limitationDraft = drafts[6];

      expect(limitationDraft.sections[0].heading).toContain('Critical Limitation');
      expect(limitationDraft.sections[0].content).toContain('2 years');
      expect(limitationDraft.sections[0].content).toContain('strict');
    });

    it('warns about statute-barred claims if deadline missed', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'high' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Deadline expired'
      };

      const drafts = module['buildDrafts'](input);
      const limitationDraft = drafts[6];

      expect(limitationDraft.sections[0].content).toContain('statute-barred');
      expect(limitationDraft.sections[0].content).toContain('FOREVER barred');
    });
  });

  describe('settlement negotiation guidance', () => {
    it('provides settlement strategy and templates', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Settlement negotiations'
      };

      const drafts = module['buildDrafts'](input);
      const interimDraft = drafts[7];

      expect(interimDraft.sections[1].heading).toContain('Settlement');
      expect(interimDraft.sections[1].content).toContain('full and final settlement');
      expect(interimDraft.sections[1].content).toContain('full release');
    });
  });

  describe('Ontario-specific content', () => {
    it('references Employment Standards Act and Ontario tribunals', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'low' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Ontario employment law'
      };

      const drafts = module['buildDrafts'](input);

      // Check multiple drafts for ESA references
      const hasESARef = drafts.some(d => d.sections.some(s => s.content.includes('Employment Standards Act')));
      expect(hasESARef).toBe(true);
    });

    it('provides MOL contact information', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [],
        compiledAt: new Date(),
        sourceManifest: {
          provenance: 'user-provided',
          entries: [],
          retrievedAt: new Date()
        }
      };

      const classification = {
        domain: 'employment' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'employee', respondent: 'employer' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Contact MOL'
      };

      const drafts = module['buildDrafts'](input);
      const molDraft = drafts[1];

      expect(molDraft.sections[2].content).toContain('1-800-531-5551');
      expect(molDraft.sections[2].content).toContain('ontario.ca');
    });
  });
});
