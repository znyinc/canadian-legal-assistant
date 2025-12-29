import { describe, it, expect } from 'vitest';
import { DisclaimerService, buildEmpathyBoundaries } from '../src/core/upl/DisclaimerService';

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

  it('renders empathy-focused CAN/CANNOT boundaries', () => {
    const text = buildEmpathyBoundaries({ jurisdiction: 'Ontario', audience: 'self-represented' });
    expect(text).toContain('What We CAN Do');
    expect(text).toContain('What We CANNOT Do');
    expect(text).toContain('Ontario');
  });

  it('builds structured empathy boundary plan with safe harbor', () => {
    const svc = new DisclaimerService();
    const plan = svc.empathyBoundaryPlan({ jurisdiction: 'Ontario', audience: 'self-represented' });
    expect(plan.canDo.length).toBeGreaterThan(0);
    expect(plan.cannotDo.length).toBeGreaterThan(0);
    expect(plan.safeHarbor).toContain('Safe Harbor Over Speed');
    expect(plan.examples[0].redirect).toMatch(/information/i);
  });

  it('detects advice requests and returns safe-harbor redirection', () => {
    const svc = new DisclaimerService();
    const advice = svc.adviceRequestGuidance('What should I do about this?');
    expect(advice.redirected).toBe(true);
    expect(advice.message).toContain('information-only');
    expect(advice.safeHarbor).toContain('Safe Harbor');
  });
});
