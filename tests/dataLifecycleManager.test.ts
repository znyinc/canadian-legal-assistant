import { describe, it, expect } from 'vitest';
import { DataLifecycleManager } from '../src/core/lifecycle/DataLifecycleManager';
import { SourceManifest } from '../src/core/models';

const sourceManifest: SourceManifest = {
  entries: [
    {
      service: 'CanLII',
      url: 'https://www.canlii.org/en/on',
      retrievalDate: '2025-01-02'
    }
  ],
  compiledAt: '2025-01-02'
};

describe('DataLifecycleManager', () => {
  it('updates retention and logs export', () => {
    const mgr = new DataLifecycleManager();
    const updated = mgr.updateRetention(90, 'admin');
    expect(updated.days).toBe(90);

    const exportResult = mgr.exportData({ actor: 'admin', items: ['pkg1'], manifest: sourceManifest });
    expect(exportResult.items[0]).toBe('pkg1');
    expect(mgr.auditLog().length).toBeGreaterThan(0);
  });

  it('blocks deletion when legal hold applies', () => {
    const mgr = new DataLifecycleManager();
    mgr.applyLegalHold('admin', 'investigation');
    const res = mgr.requestDeletion({ actor: 'admin', items: ['pkg1'] });
    expect(res.status).toBe('blocked');
    expect(res.legalHoldApplied).toBe(true);
  });
});
