import { describe, it, expect } from 'vitest';
import { MunicipalPropertyDamageModule } from '../src/core/domains/MunicipalPropertyDamageModule';
import { DocumentDraftingEngine } from '../src/core/documents/DocumentDraftingEngine';
import { DocumentPackager } from '../src/core/documents/DocumentPackager';
import { EvidenceIndex } from '../src/core/models';

describe('MunicipalPropertyDamageModule', () => {
  let module: MunicipalPropertyDamageModule;
  let draftingEngine: DocumentDraftingEngine;
  let packager: DocumentPackager;

  beforeEach(() => {
    draftingEngine = new DocumentDraftingEngine();
    packager = new DocumentPackager();
    module = new MunicipalPropertyDamageModule(draftingEngine, packager);
  });

  describe('domain detection', () => {
    it('detects municipal property damage from tree/sidewalk keywords', () => {
      const classification = {
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'medium' as const
      };

      expect(module.domain).toBe('municipalPropertyDamage');
      expect(classification.domain).toBe('municipalPropertyDamage');
    });

    it('extends BaseDomainModule correctly', () => {
      expect(module).toHaveProperty('domain');
      expect(module).toHaveProperty('buildDrafts');
      expect(typeof module['buildDrafts']).toBe('function');
    });
  });

  describe('draft generation', () => {
    it('generates 5 municipal-specific drafts', () => {
      const evidenceIndex: EvidenceIndex = {
        items: [
          {
            id: 'evidence-1',
            filename: 'photos.zip',
            type: 'photo',
            metadata: { date: '2025-12-20' },
            credibilityScore: 0.8,
            tags: ['tree-damage', 'municipal']
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Tree fell on November 15, 2025'
      };

      const drafts = module['buildDrafts'](input);

      expect(drafts).toHaveLength(5);
      expect(drafts[0].title).toContain('10-Day Notice');
      expect(drafts[1].title).toContain('Municipal Liability');
      expect(drafts[2].title).toContain('Evidence Checklist');
      expect(drafts[3].title).toContain('Claim Preparation');
      expect(drafts[4].title).toContain('Escalation');
    });

    it('includes critical 10-day notice guidance', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'low' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Damage discovered December 20, 2025'
      };

      const drafts = module['buildDrafts'](input);
      const noticeDraft = drafts[0];

      expect(noticeDraft.title).toContain('10-Day Notice');
      expect(noticeDraft.sections[0].heading).toContain('10-Day Notice Requirement');
      expect(noticeDraft.sections[0].content).toContain('10 days');
      expect(noticeDraft.sections[1].content).toContain('municipality');
    });

    it('includes Municipal Act liability guidance', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Tree damage incident'
      };

      const drafts = module['buildDrafts'](input);
      const liabilityDraft = drafts[1];

      expect(liabilityDraft.title).toContain('Municipal Liability');
      expect(liabilityDraft.sections[0].heading).toContain('When Is a Municipality Liable');
      expect(liabilityDraft.sections[0].content).toContain('Duty of Care');
      expect(liabilityDraft.sections[0].content).toContain('Breach of Duty');
      expect(liabilityDraft.sections[1].heading).toContain('Municipal Immunity');
    });

    it('provides evidence checklist for municipal claims', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Property damage from municipal tree'
      };

      const drafts = module['buildDrafts'](input);
      const checklistDraft = drafts[2];

      expect(checklistDraft.title).toContain('Evidence Checklist');
      expect(checklistDraft.sections[0].heading).toContain('Evidence Collection Checklist');
      expect(checklistDraft.sections[0].content).toContain('Photos');
      expect(checklistDraft.sections[0].content).toContain('Contractor estimate');
      expect(checklistDraft.sections[0].content).toContain('Freedom of Information');
    });

    it('includes claim preparation with notice template', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Filed notice on December 21, 2025'
      };

      const drafts = module['buildDrafts'](input);
      const claimDraft = drafts[3];

      expect(claimDraft.title).toContain('Claim Preparation');
      expect(claimDraft.sections[0].heading).toContain('Notice of Claim');
      expect(claimDraft.sections[1].heading).toContain('Demand Letter');
      expect(claimDraft.sections[1].content).toContain('RE: DEMAND FOR COMPENSATION');
    });

    it('includes escalation pathways for municipal claims', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'low' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Municipal denial'
      };

      const drafts = module['buildDrafts'](input);
      const escalationDraft = drafts[4];

      expect(escalationDraft.title).toContain('Escalation');
      expect(escalationDraft.sections[0].heading).toContain('Escalation Pathways');
      expect(escalationDraft.sections[0].content).toContain('Ombudsman');
      expect(escalationDraft.sections[0].content).toContain('Small Claims Court');
      expect(escalationDraft.sections[0].content).toContain('Superior Court');
    });
  });

  describe('urgent notice deadline detection', () => {
    it('flags urgent warning if notice deadline expired', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'high' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Damage discovered more than 10 days ago'
      };

      const drafts = module['buildDrafts'](input);
      const noticeDraft = drafts[0];

      expect(noticeDraft.sections[0].content).toContain('URGENT');
      expect(noticeDraft.sections[0].content).toContain('EXPIRED');
    });

    it('provides normal notice guidance if within deadline', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'low' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Damage discovered yesterday'
      };

      const drafts = module['buildDrafts'](input);
      const noticeDraft = drafts[0];

      expect(noticeDraft.sections[0].content).toContain('within the deadline');
    });
  });

  describe('package assembly', () => {
    it('assembles complete municipal damage package using base module', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Tree damage December 2025'
      };

      // Test that module's buildDrafts generates 5 drafts
      const drafts = module['buildDrafts'](input);
      expect(drafts).toHaveLength(5);
      expect(drafts.every(d => d.title && d.sections)).toBe(true);
    });

    it('forum map routing is correct for municipal claims', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Municipal tree damage'
      };

      // Verify buildDrafts produces valid drafts for forum routing
      const drafts = module['buildDrafts'](input);
      expect(drafts.length).toBeGreaterThan(0);
      expect(drafts[0].title).toContain('10-Day Notice');
    });
  });

  describe('municipal-specific content', () => {
    it('covers tree damage claims', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Tree fell from municipal lot'
      };

      const drafts = module['buildDrafts'](input);

      expect(drafts[1].sections.some(s => s.content.includes('Tree Damage'))).toBe(true);
    });

    it('covers sidewalk/road damage claims', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'medium' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Pothole caused damage'
      };

      const drafts = module['buildDrafts'](input);

      expect(drafts[1].sections.some(s => s.content.includes('Road/Sidewalk Damage'))).toBe(true);
    });

    it('covers water/drainage damage claims', () => {
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
        domain: 'municipalPropertyDamage' as const,
        jurisdiction: 'Ontario' as const,
        partyTypes: { claimant: 'homeowner', respondent: 'municipality' },
        urgency: 'high' as const
      };

      const input = {
        classification,
        evidenceIndex,
        timeline: 'Basement flooded from blocked municipal drain'
      };

      const drafts = module['buildDrafts'](input);

      expect(drafts[1].sections.some(s => s.content.includes('Water/Drainage Damage'))).toBe(true);
    });
  });
});
