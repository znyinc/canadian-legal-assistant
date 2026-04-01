export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    return registration;
  } catch (error) {
    // Avoid throwing in app bootstrap; PWA registration should be non-blocking.
    console.warn('Service worker registration failed', error);
    return null;
  }
}
