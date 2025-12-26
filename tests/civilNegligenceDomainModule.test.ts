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
});
