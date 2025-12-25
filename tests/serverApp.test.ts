import { describe, it, expect } from 'vitest';
import { createApp } from '../backend/src/server';
import { IntegrationAPI } from '../src/api/IntegrationAPI';

describe('Server bootstrap', () => {
  it('attaches IntegrationAPI with registered domain modules to app.locals', () => {
    const app = createApp();
    const api = (app as any).locals.integrationApi as IntegrationAPI | undefined;
    expect(api).toBeDefined();

    const modules = api?.listRegisteredModules() || [];
    expect(modules.length).toBeGreaterThan(0);
    // Expect at least the insurance module to be registered
    expect(modules.some(m => m.domain === 'insurance')).toBe(true);
  });
});
