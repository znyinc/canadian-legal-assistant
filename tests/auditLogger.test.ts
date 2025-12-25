import { describe, it, expect } from 'vitest';
import { AuditLogger } from '../src/core/audit/AuditLogger';

describe('AuditLogger', () => {
  it('records events with timestamps and ids', () => {
    const logger = new AuditLogger();
    const event = logger.log('source-access', 'system', 'Accessed CanLII');
    expect(event.id).toMatch(/audit-/);
    expect(event.timestamp).toBeTruthy();
    expect(logger.entries().length).toBe(1);
  });

  it('filters by type', () => {
    const logger = new AuditLogger();
    logger.log('source-access', 'system', 'Accessed CanLII');
    logger.log('export', 'system', 'Exported package');
    const exports = logger.filterByType('export');
    expect(exports.length).toBe(1);
  });
});
