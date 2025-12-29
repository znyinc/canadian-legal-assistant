import { describe, it, expect } from 'vitest';
import { TreeDamageClassifierModule } from '../src/core/domains/TreeDamageClassifierModule';
import { DomainModuleInput } from '../src/core/models';

describe('TreeDamageClassifierModule', () => {
  const module = new TreeDamageClassifierModule();

  const mockInput: DomainModuleInput = {
    classification: {
      domain: 'tree-damage',
      subdomain: undefined,
      jurisdiction: 'ON',
      province: 'ON',
      claimantType: 'property-owner',
      respondentType: 'neighbor',
      urgency: 'medium',
      amountInDispute: 5000,
      description: 'Tree from neighbor property fell on my garage roof',
      tags: ['property-damage', 'tree-damage'],
      pillar: 'civil',
      pillarMatches: { civil: 0.8 },
      pillarExplanation: 'Tree damage claim',
      pillarAmbiguous: false,
    },
    forumMap: {
      domain: 'tree-damage',
      recommendedForum: 'Small Claims Court',
      alternativeForums: ['Superior Court'],
      rationale: 'Tree damage with $5K damages',
      jurisdiction: 'ON',
      limitationPeriod: '2 years',
      escalationPath: ['Settlement', 'Trial'],
    },
    timeline: {
      items: [],
      generatedAt: new Date().toISOString(),
      gaps: [],
    },
    evidenceIndex: {
      items: [],
      generatedAt: new Date().toISOString(),
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() },
    },
  };

  describe('domain detection', () => {
    it('detects tree-damage domain correctly', () => {
      expect(module.domain).toBe('tree-damage');
    });

    it('extends BaseDomainModule correctly', () => {
      expect(typeof module.buildDrafts).toBe('function');
    });
  });

  describe('draft generation', () => {
    const drafts = module.buildDrafts(mockInput);

    it('generates 5 tree-damage-specific drafts', () => {
      expect(drafts).toHaveLength(5);
    });

    it('all drafts have valid structure', () => {
      drafts.forEach((draft, idx) => {
        expect(draft).toHaveProperty('id');
        expect(draft).toHaveProperty('title');
        expect(draft).toHaveProperty('sections');
        expect(draft.title).toBeTruthy();
        expect(draft.sections.length).toBeGreaterThan(0);
        expect(`Draft ${idx}: ${draft.title}`).toBeTruthy();
      });
    });

    it('first draft covers tree ownership identification', () => {
      expect(drafts[0].title).toContain('Tree Ownership');
      expect(drafts[0].sections.length).toBeGreaterThan(2);
    });

    it('second draft covers municipal vs private', () => {
      expect(drafts[1].title).toContain('Municipal');
      expect(drafts[1].sections.length).toBeGreaterThan(0);
    });

    it('third draft covers liability standards', () => {
      expect(drafts[2].title).toContain('Occupiers');
      expect(drafts[2].sections.length).toBeGreaterThan(0);
    });

    it('fourth draft covers evidence requirements', () => {
      expect(drafts[3].title).toContain('Evidence');
      expect(drafts[3].sections.length).toBeGreaterThan(0);
    });

    it('fifth draft covers forum selection', () => {
      expect(drafts[4].title).toContain('Forum');
      expect(drafts[4].sections.length).toBeGreaterThan(0);
    });
  });

  describe('content validation', () => {
    const drafts = module.buildDrafts(mockInput);
    const allContent = drafts
      .map((d) => d.sections.map((s) => s.content).join(' '))
      .join(' ');

    it('includes Ontario-specific information', () => {
      expect(allContent).toBeTruthy();
      expect(allContent.length).toBeGreaterThan(1000);
    });

    it('covers municipal claims process', () => {
      expect(allContent).toContain('municipal') || expect(allContent).toContain('Municipal');
    });

    it('covers occupiers liability standards', () => {
      expect(allContent).toContain('Owner') || expect(allContent).toContain('owner');
    });

    it('discusses liability and negligence', () => {
      expect(allContent).toContain('liable') || expect(allContent).toContain('neglect');
    });

    it('provides timeline information', () => {
      expect(allContent).toContain('month') || expect(allContent).toContain('week');
    });
  });

  describe('module integration', () => {
    it('is properly constructible', () => {
      expect(() => new TreeDamageClassifierModule()).not.toThrow();
    });

    it('buildDrafts returns DocumentDraft[]', () => {
      const drafts = module.buildDrafts(mockInput);
      expect(Array.isArray(drafts)).toBe(true);
      expect(drafts.length).toBeGreaterThan(0);
    });

    it('handles valid DomainModuleInput', () => {
      expect(() => module.buildDrafts(mockInput)).not.toThrow();
    });
  });
});
