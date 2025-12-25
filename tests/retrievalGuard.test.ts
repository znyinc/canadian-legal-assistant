import { describe, it, expect } from 'vitest';
import { RetrievalGuard } from '../src/core/caselaw/RetrievalGuard';

describe('RetrievalGuard', () => {
  it('wraps successful retrievals', async () => {
    const guard = new RetrievalGuard();
    const res = await guard.handle(async () => 'ok');
    expect(res.ok).toBe(true);
    expect(res.data).toBe('ok');
  });

  it('wraps failed retrievals', async () => {
    const guard = new RetrievalGuard();
    const res = await guard.handle(async () => {
      throw new Error('network');
    });
    expect(res.ok).toBe(false);
    expect(res.message).toContain('network');
  });

  it('provides failure messaging', () => {
    const guard = new RetrievalGuard();
    const msg = guard.failureMessage('CanLII', 'test');
    expect(msg).toContain('Could not retrieve');
  });
});
