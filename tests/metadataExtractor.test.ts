import { describe, it, expect } from 'vitest';
import { extractMetadata } from '../src/core/evidence/MetadataExtractor';

describe('Metadata extractor', () => {
  it('extracts EML headers', () => {
    const content = Buffer.from(`From: alice@example.com\nTo: bob@example.com\nDate: Wed, 01 Jan 2025 12:00:00 -0500\nSubject: Test Email\n\nBody`, 'utf-8');
    const meta = extractMetadata('EML', content);
    expect(meta.sender).toContain('alice@example.com');
    expect(meta.recipient).toContain('bob@example.com');
    expect(meta.subject).toContain('Test Email');
    expect(meta.date).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('extracts date from TXT', () => {
    const meta = extractMetadata('TXT', Buffer.from('This happened on 2025-12-24 at noon.', 'utf-8'));
    expect(meta.date).toBe('2025-12-24');
    expect(meta.summary).toContain('This happened');
  });

  it('keeps minimal metadata for binary types', () => {
    const meta = extractMetadata('PDF', Buffer.from('%PDF-1.7', 'utf-8'));
    expect(meta.summary).toBeUndefined();
  });
});
