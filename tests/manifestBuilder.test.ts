import { describe, it, expect } from 'vitest';
import { ManifestBuilder } from '../src/core/audit/ManifestBuilder';
import { EvidenceIndex } from '../src/core/models';

describe('ManifestBuilder', () => {
  it('builds source manifest with compiled date', () => {
    const builder = new ManifestBuilder();
    const manifest = builder.buildSourceManifest([
      {
        service: 'CanLII',
        url: 'https://www.canlii.org',
        retrievalDate: '2025-01-01'
      }
    ]);
    expect(manifest.entries.length).toBe(1);
    expect(manifest.compiledAt).toBeTruthy();
  });

  it('builds evidence manifest from index', () => {
    const builder = new ManifestBuilder();
    const index: EvidenceIndex = {
      items: [
        {
          id: 'e1',
          filename: 'doc.pdf',
          type: 'PDF',
          hash: 'hash',
          provenance: 'user-provided'
        }
      ],
      generatedAt: '2025-01-01',
      sourceManifest: { sources: [] }
    };
    const manifest = builder.buildEvidenceManifest(index);
    expect(manifest.items[0].id).toBe('e1');
    expect(manifest.compiledAt).toBeTruthy();
  });
});
