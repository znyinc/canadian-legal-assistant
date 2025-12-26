import { describe, it, expect } from 'vitest';
import { PillarClassifier } from '../src/core/triage/PillarClassifier';

describe('PillarClassifier', () => {
  it('classifies criminal matters', () => {
    const c = new PillarClassifier();
    expect(c.classify('I was assaulted in a bar')).toBe('Criminal');
  });

  it('classifies civil matters', () => {
    const c = new PillarClassifier();
    expect(c.classify('A tree fell on my car causing property damage')).toBe('Civil');
  });

  it('classifies administrative matters', () => {
    const c = new PillarClassifier();
    expect(c.classify('Landlord refuses to fix heating - LTB application')).toBe('Administrative');
  });

  it('classifies quasi-criminal matters', () => {
    const c = new PillarClassifier();
    expect(c.classify('Ticket for breaching a municipal by-law')).toBe('Quasi-Criminal');
  });

  it('prefers criminal when criminal and civil indicators present', () => {
    const c = new PillarClassifier();
    expect(c.classify('I was assaulted and my phone was stolen')).toBe('Criminal');
  });

  it('classifies defamation as civil', () => {
    const c = new PillarClassifier();
    expect(c.classify('A defamatory article caused reputational damage')).toBe('Civil');
  });

  it('classifies permit refusal as administrative', () => {
    const c = new PillarClassifier();
    expect(c.classify('Denied permit to renovate, need to appeal')).toBe('Administrative');
  });
});