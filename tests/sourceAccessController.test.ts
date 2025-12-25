import { describe, it, expect } from 'vitest';
import { SourceAccessController } from '../src/core/access/SourceAccessController';
import { SourceAccessPolicy, AccessMethod, SourceEntry } from '../src/core/models';

describe('SourceAccessController', () => {
  const canLII: SourceAccessPolicy = {
    service: 'CanLII',
    allowedMethods: ['official-api', 'official-link', 'user-provided'],
    rules: { blockScraping: true }
  };
  const eLaws: SourceAccessPolicy = {
    service: 'e-Laws',
    allowedMethods: ['official-link', 'user-provided'],
    rules: { enforceCurrencyDates: true }
  };
  const justice: SourceAccessPolicy = {
    service: 'Justice Laws',
    allowedMethods: ['official-link', 'user-provided'],
    rules: { enforceBilingualText: true }
  };

  it('validates allowed methods', () => {
    const ctl = new SourceAccessController();
    ctl.setPolicy(canLII);
    const ok = ctl.validateAccess('CanLII', 'official-api');
    expect(ok).toBe(true);

    const notOk = ctl.validateAccess('CanLII', 'user-provided' as AccessMethod);
    expect(notOk).toBe(true); // user-provided is allowed for provenance
  });

  it('logs access decisions', () => {
    const ctl = new SourceAccessController();
    ctl.setPolicy(canLII);
    ctl.validateAccess('CanLII', 'official-link');
    const logs = ctl.getLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].service).toBe('CanLII');
  });

  it('enforces currency dates for e-Laws entries', () => {
    const ctl = new SourceAccessController();
    ctl.setPolicy(eLaws);
    const entry: SourceEntry = { service: 'e-Laws', url: 'https://www.ontario.ca/laws', retrievalDate: '', version: 'current' };
    const res = ctl.validateSourceEntry(entry);
    expect(res.ok).toBe(false);
    expect(res.errors[0]).toContain('Missing retrievalDate');
  });

  it('enforces bilingual text rules for Justice Laws', () => {
    const ctl = new SourceAccessController();
    ctl.setPolicy(justice);
    const entry: SourceEntry = { service: 'Justice Laws', url: 'https://laws-lois.justice.gc.ca', retrievalDate: new Date().toISOString() };
    const res = ctl.validateSourceEntry(entry);
    expect(res.ok).toBe(false);
  });
});
