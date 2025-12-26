import DOMPurify from 'dompurify';

export function safeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  // Strip all tags/attributes to ensure plain text only
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function safeURL(input: unknown, allowedHosts?: string[]): string | undefined {
  if (typeof input !== 'string' || !input) return undefined;
  try {
    const u = new URL(input);
    if (!['http:', 'https:'].includes(u.protocol)) return undefined;
    if (allowedHosts && allowedHosts.length > 0) {
      const ok = allowedHosts.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`));
      if (!ok) return undefined;
    }
    return u.toString();
  } catch {
    return undefined;
  }
}
