import { describe, it, expect } from 'vitest';
import { DisclaimerService } from '../src/core/upl/DisclaimerService';

describe('DisclaimerService', () => {
  it('produces legal information disclaimer', () => {
    const svc = new DisclaimerService();
    const text = svc.legalInformationDisclaimer({ jurisdiction: 'Ontario' });
    expect(text).toContain('legal information');
    expect(text).toContain('Ontario');
  });

  it('presents multiple pathways', () => {
    const svc = new DisclaimerService();
    const out = svc.multiPathwayPresentation([
      { label: 'Internal complaint', steps: ['File to insurer', 'Await response'] },
      { label: 'Tribunal', steps: ['File application', 'Serve respondent'], caveats: ['Check deadlines'] }
    ]);
    expect(out).toContain('1) Internal complaint');
    expect(out).toContain('2) Tribunal');
  });

  it('redirects advice requests', () => {
    const svc = new DisclaimerService();
    const res = svc.redirectAdviceRequest('What should I do about this case?');
    expect(res.redirected).toBe(true);
  });
});
