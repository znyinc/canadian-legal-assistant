import { describe, it, expect } from 'vitest';
import { EvidenceIndexer } from '../src/core/evidence/EvidenceIndexer';

describe('EvidenceIndexer', () => {
  it('adds items and generates index', () => {
    const indexer = new EvidenceIndexer();
    const item = indexer.addItem(
      'mail.eml',
      Buffer.from('From: alice@example.com\nDate: Wed, 01 Jan 2025 12:00:00 -0500\nSubject: Test\n\nBody', 'utf-8'),
      'EML',
      'user-provided'
    );
    expect(item.id).toBeDefined();
    expect(item.filename).toBe('mail.eml');
    expect(item.credibilityScore).toBeGreaterThan(0);

    const idx = indexer.generateIndex();
    expect(idx.items.length).toBe(1);
    expect(idx.generatedAt).toBeDefined();
  });

  it('computes SHA-256 hash', () => {
    const indexer = new EvidenceIndexer();
    const content = Buffer.from('test content', 'utf-8');
    const item = indexer.addItem('test.txt', content, 'TXT', 'user-provided');
    // SHA-256 of "test content"
    const expected = '6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72';
    expect(item.hash).toBe(expected);
  });

  it('boosts credibility for official-api provenance', () => {
    const indexer = new EvidenceIndexer();
    const content = Buffer.from('From: test@example.com\nDate: 2025-01-01\n\nData', 'utf-8');
    const apiItem = indexer.addItem('official.eml', content, 'EML', 'official-api');
    const userItem = indexer.addItem('user.eml', content, 'EML', 'user-provided');
    expect(apiItem.credibilityScore).toBeGreaterThan(userItem.credibilityScore);
  });

  it('boosts credibility for metadata completeness', () => {
    const indexer = new EvidenceIndexer();
    const rich = Buffer.from('From: a@ex.com\nTo: b@ex.com\nDate: 2025-01-01\nSubject: Test\n\nBody', 'utf-8');
    const sparse = Buffer.from('From: a@ex.com\n\nBody', 'utf-8');
    const richItem = indexer.addItem('rich.eml', rich, 'EML', 'user-provided');
    const sparseItem = indexer.addItem('sparse.eml', sparse, 'EML', 'user-provided');
    expect(richItem.credibilityScore).toBeGreaterThan(sparseItem.credibilityScore);
  });

  it('caps credibility at 1.0', () => {
    const indexer = new EvidenceIndexer();
    const content = Buffer.from('From: a@ex.com\nTo: b@ex.com\nDate: 2025-01-01\nSubject: Test\n\nBody', 'utf-8');
    const item = indexer.addItem('test.eml', content, 'EML', 'official-api');
    expect(item.credibilityScore).toBeLessThanOrEqual(1.0);
  });

  it('sets sources and includes in manifest', () => {
    const indexer = new EvidenceIndexer();
    indexer.setSources([
      { service: 'e-Laws', url: 'https://www.ontario.ca/laws', retrievalDate: '2025-01-01T00:00:00Z' }
    ]);
    const idx = indexer.generateIndex();
    expect(idx.sourceManifest.sources.length).toBe(1);
    expect(idx.sourceManifest.sources[0].service).toBe('e-Laws');
  });
});
