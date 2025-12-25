import { describe, it, expect } from 'vitest';
import { StyleGuide } from '../src/core/templates/StyleGuide';

describe('StyleGuide', () => {
  it('lists core rules', () => {
    const sg = new StyleGuide();
    const rules = sg.rules();
    expect(rules.length).toBeGreaterThan(0);
  });

  it('warns on advisory language', () => {
    const sg = new StyleGuide();
    const res = sg.check('You should file immediately.');
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it('passes neutral text', () => {
    const sg = new StyleGuide();
    const res = sg.check('The record indicates the event occurred on 2025-01-01.');
    expect(res.ok).toBe(true);
  });
});
