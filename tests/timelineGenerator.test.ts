import { describe, it, expect } from 'vitest';
import { TimelineGenerator } from '../src/core/evidence/TimelineGenerator';
import { EvidenceIndex } from '../src/core/models';

describe('TimelineGenerator', () => {
  const mockIndex: EvidenceIndex = {
    items: [
      {
        id: '1',
        filename: 'email1.eml',
        type: 'EML',
        date: '2025-01-01T10:00:00Z',
        provenance: 'user-provided',
        hash: 'abc1',
        credibilityScore: 0.8
      },
      {
        id: '2',
        filename: 'email2.eml',
        type: 'EML',
        date: '2025-01-08T14:00:00Z',
        provenance: 'user-provided',
        hash: 'abc2',
        credibilityScore: 0.8
      },
      {
        id: '3',
        filename: 'screenshot.png',
        type: 'PNG',
        date: '2025-02-15T09:00:00Z',
        provenance: 'user-provided',
        hash: 'abc3',
        credibilityScore: 0.7
      }
    ],
    generatedAt: new Date().toISOString(),
    sourceManifest: { sources: [] }
  };

  it('generates chronological timeline from evidence index', () => {
    const gen = new TimelineGenerator();
    const timeline = gen.generate(mockIndex);
    expect(timeline.length).toBe(3);
    expect(timeline[0].date).toBe('2025-01-01T10:00:00Z');
    expect(timeline[2].date).toBe('2025-02-15T09:00:00Z');
  });

  it('detects large gaps (> 7 days)', () => {
    const gen = new TimelineGenerator();
    const timeline = gen.generate(mockIndex);
    const gaps = gen.detectGaps(timeline);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps[0].durationDays).toBeGreaterThan(7);
  });

  it('assigns risk levels to gaps', () => {
    const gen = new TimelineGenerator();
    const timeline = gen.generate(mockIndex);
    const gaps = gen.detectGaps(timeline);
    const largeGap = gaps.find((g) => g.durationDays > 30);
    if (largeGap) expect(largeGap.riskLevel).toBe('high');
  });

  it('flags missing screenshot evidence', () => {
    const noScreenshot: EvidenceIndex = {
      items: [
        {
          id: '1',
          filename: 'mail.eml',
          type: 'EML',
          date: '2025-01-01T10:00:00Z',
          provenance: 'user-provided',
          hash: 'abc',
          credibilityScore: 0.8
        }
      ],
      generatedAt: new Date().toISOString(),
      sourceManifest: { sources: [] }
    };
    const gen = new TimelineGenerator();
    const timeline = gen.generate(noScreenshot);
    const alerts = gen.flagMissingEvidence(noScreenshot, timeline);
    expect(alerts.some((a) => a.type === 'screenshot')).toBe(true);
  });

  it('flags missing original emails', () => {
    const noEmails: EvidenceIndex = {
      items: [
        {
          id: '1',
          filename: 'doc.txt',
          type: 'TXT',
          date: '2025-01-01T10:00:00Z',
          provenance: 'user-provided',
          hash: 'abc',
          credibilityScore: 0.8
        }
      ],
      generatedAt: new Date().toISOString(),
      sourceManifest: { sources: [] }
    };
    const gen = new TimelineGenerator();
    const timeline = gen.generate(noEmails);
    const alerts = gen.flagMissingEvidence(noEmails, timeline);
    expect(alerts.some((a) => a.type === 'email-original')).toBe(true);
  });
});
