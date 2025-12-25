import { describe, it, expect } from 'vitest';
import { redactPII } from '../src/core/evidence/PIIRedactor';

describe('PII redactor', () => {
  it('redacts email addresses', () => {
    const res = redactPII('Contact me at alice@example.com');
    expect(res.redacted).not.toContain('alice@example.com');
    expect(res.findings.some(f => f.type === 'email')).toBe(true);
  });
  it('redacts phone numbers', () => {
    const res = redactPII('Call +1 (416) 555-1234 now');
    expect(res.findings.some(f => f.type === 'phone')).toBe(true);
  });
  it('redacts SINs', () => {
    const res = redactPII('SIN: 123-456-789');
    expect(res.findings.some(f => f.type === 'sin')).toBe(true);
  });
  it('redacts DOB formats', () => {
    const res = redactPII('DOB 1990-01-01 and 31/12/2000');
    expect(res.findings.filter(f => f.type === 'dob').length).toBeGreaterThan(0);
  });
  it('redacts account numbers', () => {
    const res = redactPII('Account: 12345678');
    expect(res.findings.some(f => f.type === 'account')).toBe(true);
  });
});
