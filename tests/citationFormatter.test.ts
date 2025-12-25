import { describe, it, expect } from 'vitest';
import { CitationFormatter } from '../src/core/caselaw/CitationFormatter';

describe('CitationFormatter', () => {
  it('formats case citations with retrieval date', () => {
    const fmt = new CitationFormatter();
    const text = fmt.formatCase({
      caseId: '1',
      title: 'Example v. Sample',
      court: 'ONCA',
      decisionDate: '2025-01-15',
      citation: '2025 ONCA 1',
      url: 'https://canlii.org/example'
    });
    expect(text).toContain('2025 ONCA 1');
    expect(text).toContain('retrieved');
  });

  it('formats statute citations with jurisdiction source and retrieval date', () => {
    const fmt = new CitationFormatter();
    const text = fmt.formatStatute({
      jurisdiction: 'Ontario',
      title: 'Residential Tenancies Act, 2006',
      provision: 's. 82',
      url: 'https://www.ontario.ca/laws/statute/06r17',
      retrievalDate: '2025-01-01'
    });
    expect(text).toContain('e-Laws');
    expect(text).toContain('retrieved 2025-01-01');
  });
});
