import { describe, it, expect } from 'vitest';
import { TimelineAssessor } from '../src/core/triage/TimelineAssessor';

describe('TimelineAssessor', () => {
  it('flags high risk when no dates provided', () => {
    const ta = new TimelineAssessor();
    const res = ta.assess([]);
    expect(res.risk).toBe('high');
  });

  it('flags medium risk for older events', () => {
    const ta = new TimelineAssessor();
    const past = new Date();
    past.setMonth(past.getMonth() - 8);
    const res = ta.assess([past.toISOString()]);
    expect(res.risk === 'medium' || res.risk === 'high').toBe(true);
  });

  it('flags low risk for recent events', () => {
    const ta = new TimelineAssessor();
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    const res = ta.assess([recent.toISOString()]);
    expect(res.risk).toBe('low');
  });
});
