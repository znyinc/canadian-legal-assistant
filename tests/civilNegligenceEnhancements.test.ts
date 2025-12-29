import { describe, it, expect } from 'vitest';
import { CivilNegligenceDomainModule } from '../src/core/domains/CivilNegligenceDomainModule';

describe('CivilNegligenceDomainModule — Enhanced Drafts', () => {
  const mod = new CivilNegligenceDomainModule();

  it('generates demand letter for property damage', () => {
    const input: any = {
      classification: {
        parties: { names: ['Alice Smith'] },
        timeline: { start: '2025-12-01' },
        disputeAmount: 750,
        notes: ['Tree fell on fence', 'Damage to north side']
      },
      forumMap: '',
      timeline: '',
      missingEvidence: '',
      evidenceIndex: { items: [], generatedAt: new Date().toISOString(), sourceManifest: { sources: [] } },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    };

    const drafts = (mod as any).buildDrafts(input);
    const demandDraft = drafts.find((d: any) => d.title.includes('Demand Letter — Property Damage'));

    expect(demandDraft).toBeDefined();
    expect(demandDraft.sections[0].content).toContain('Alice Smith');
    expect(demandDraft.sections[0].content).toContain('2025-12-01');
    expect(demandDraft.sections[0].content).toContain('$750');
    expect(demandDraft.sections[0].content).toContain('Settlement Path');
  });

  it('generates anticipate defense guidance', () => {
    const input: any = {
      classification: {
        parties: { names: ['Bob Johnson'] }
      },
      forumMap: '',
      timeline: '',
      missingEvidence: '',
      evidenceIndex: { items: [], generatedAt: new Date().toISOString(), sourceManifest: { sources: [] } },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    };

    const drafts = (mod as any).buildDrafts(input);
    const defenseDraft = drafts.find((d: any) => d.title.includes('Anticipate the Defense'));

    expect(defenseDraft).toBeDefined();
    expect(defenseDraft.sections[0].content).toContain('Typical Defenses');
    expect(defenseDraft.sections[0].content).toContain('Settlement is common');
  });

  it('generates arborist report guidance', () => {
    const input: any = {
      classification: {
        parties: { names: ['Carol White'] }
      },
      forumMap: '',
      timeline: '',
      missingEvidence: '',
      evidenceIndex: { items: [], generatedAt: new Date().toISOString(), sourceManifest: { sources: [] } },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    };

    const drafts = (mod as any).buildDrafts(input);
    const arboristDraft = drafts.find((d: any) => d.title.includes('Arborist Report Guidance'));

    expect(arboristDraft).toBeDefined();
    expect(arboristDraft.sections[0].content).toContain('Species and condition');
    expect(arboristDraft.sections[0].content).toContain('Attach to demand letter');
  });

  it('generates contractor estimate guidance', () => {
    const input: any = {
      classification: {
        parties: { names: ['Dave Brown'] }
      },
      forumMap: '',
      timeline: '',
      missingEvidence: '',
      evidenceIndex: { items: [], generatedAt: new Date().toISOString(), sourceManifest: { sources: [] } },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    };

    const drafts = (mod as any).buildDrafts(input);
    const contractorDraft = drafts.find((d: any) => d.title.includes('Contractor Estimate Guidance'));

    expect(contractorDraft).toBeDefined();
    expect(contractorDraft.sections[0].content).toContain('line-items');
    expect(contractorDraft.sections[0].content).toContain('Get at least two estimates');
  });

  it('generates all settlement-focused drafts (minimum 6)', () => {
    const input: any = {
      classification: {
        parties: { names: ['Eve Green'] },
        disputeAmount: 1000
      },
      forumMap: '',
      timeline: '',
      missingEvidence: '',
      evidenceIndex: { items: [], generatedAt: new Date().toISOString(), sourceManifest: { sources: [] } },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    };

    const drafts = (mod as any).buildDrafts(input);

    // Expect at least: original demand notice, Form 7A, evidence checklist,
    // property damage demand letter, anticipate defense, arborist, contractor
    expect(drafts.length).toBeGreaterThanOrEqual(6);

    const titles = drafts.map((d: any) => d.title);
    expect(titles).toContain('Demand Letter — Property Damage');
    expect(titles).toContain('Anticipate the Defense — Civil Negligence');
    expect(titles).toContain('Arborist Report Guidance');
    expect(titles).toContain('Contractor Estimate Guidance');
  });
});
