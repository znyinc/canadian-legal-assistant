import { describe, it, expect } from 'vitest';
import { CivilNegligenceDomainModule } from '../src/core/domains/CivilNegligenceDomainModule';

describe('CivilNegligenceDomainModule', () => {
  it('detects matters mentioning trees or property damage', () => {
    const mod = new CivilNegligenceDomainModule();
    expect(mod.supportsMatter({ description: 'A tree fell on my car' })).toBe(true);
    expect(mod.supportsMatter({ tags: ['property-damage'] })).toBe(true);
    expect(mod.supportsMatter({ description: 'Slip and fall on sidewalk' })).toBe(false);
  });

  it('builds basic drafts', () => {
    const mod = new CivilNegligenceDomainModule();
    const input: any = {
      classification: {
        parties: { names: ['Alice'] },
        timeline: { start: '2024-01-01' },
        disputeAmount: 500
      },
      forumMap: '',
      timeline: '',
      missingEvidence: '',
      evidenceIndex: { items: [], generatedAt: new Date().toISOString(), sourceManifest: { sources: [] } },
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() }
    };

    const drafts = (mod as any).buildDrafts(input);
    expect(drafts.length).toBeGreaterThanOrEqual(1);
    expect(drafts.some((d: any) => d.title.includes('Small Claims'))).toBe(true);
    const form = drafts.find((d: any) => d.title.includes('Form 7A'));
    expect(form).toBeDefined();
    expect(form.sections[0].content).toContain('Claimant: Alice');
    expect(form.sections[0].content).toContain('Claim amount:');
  });

  it('generates demand letter for property damage', () => {
    const mod = new CivilNegligenceDomainModule();
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
    const mod = new CivilNegligenceDomainModule();
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
    const mod = new CivilNegligenceDomainModule();
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
    const mod = new CivilNegligenceDomainModule();
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
    const mod = new CivilNegligenceDomainModule();
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

    expect(drafts.length).toBeGreaterThanOrEqual(6);

    const titles = drafts.map((d: any) => d.title);
    expect(titles).toContain('Demand Letter — Property Damage');
    expect(titles).toContain('Anticipate the Defense — Civil Negligence');
    expect(titles).toContain('Arborist Report Guidance');
    expect(titles).toContain('Contractor Estimate Guidance');
  });
});
