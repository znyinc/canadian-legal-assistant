import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerServiceWorker } from '../src/pwa/registerServiceWorker';

describe('registerServiceWorker', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('returns null when service workers are not supported', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    });

    const result = await registerServiceWorker();
    expect(result).toBeNull();
  });

  it('registers service worker when supported', async () => {
    const mockRegistration = { scope: '/' } as ServiceWorkerRegistration;
    const register = vi.fn().mockResolvedValue(mockRegistration);

    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: { register } },
      configurable: true,
      writable: true,
    });

    const result = await registerServiceWorker();

    expect(register).toHaveBeenCalledWith('/service-worker.js');
    expect(result).toBe(mockRegistration);
  });

  it('fails safely and returns null on registration error', async () => {
    const register = vi.fn().mockRejectedValue(new Error('boom'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: { register } },
      configurable: true,
      writable: true,
    });

    const result = await registerServiceWorker();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});
