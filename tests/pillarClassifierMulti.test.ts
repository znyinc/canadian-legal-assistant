import { describe, it, expect } from 'vitest';
import { PillarClassifier } from '../src/core/triage/PillarClassifier';

describe('PillarClassifier multi-detection', () => {
  it('detects multiple pillars present in one text', () => {
    const c = new PillarClassifier();
    const matches = c.detectAllPillars('I was assaulted and also received a parking ticket and my landlord refused repairs');
    // Should include Criminal, Quasi-Criminal and Administrative
    expect(matches).toEqual(expect.arrayContaining(['Criminal', 'Quasi-Criminal', 'Administrative']));
  });

  it('returns empty array for unknown text', () => {
    const c = new PillarClassifier();
    const matches = c.detectAllPillars('Just some vague complaint with no legal keywords');
    expect(matches.length).toBe(0);
  });
});