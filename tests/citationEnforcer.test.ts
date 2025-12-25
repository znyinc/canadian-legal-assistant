import { describe, it, expect } from 'vitest';
import { CitationEnforcer } from '../src/core/upl/CitationEnforcer';

describe('CitationEnforcer', () => {
  it('fails when citations are missing', () => {
    const enf = new CitationEnforcer();
    const res = enf.ensureCitations('The act requires notice.', false);
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('warns on advisory language', () => {
    const enf = new CitationEnforcer();
    const res = enf.ensureCitations('We recommend you sue immediately.', true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it('checks retrieval dates', () => {
    const enf = new CitationEnforcer();
    const res = enf.verifyRetrieval();
    expect(res.ok).toBe(false);
  });
});
