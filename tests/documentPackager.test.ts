import { describe, it, expect } from 'vitest';
import { DocumentPackager } from '../src/core/documents/DocumentPackager';
import { DocumentDraft, EvidenceManifest, SourceManifest } from '../src/core/models';

const sourceManifest: SourceManifest = {
  entries: [
    {
      service: 'CanLII',
      url: 'https://www.canlii.org/en/on/laws/stat/soa-1992-c-32-5/latest/',
      retrievalDate: '2025-01-02'
    }
  ],
  compiledAt: '2025-01-02'
};

const evidenceManifest: EvidenceManifest = {
  items: [
    {
      id: 'e1',
      filename: 'email.eml',
      type: 'EML',
      hash: 'abc123',
      provenance: 'user-provided',
      credibilityScore: 0.7,
      date: '2025-01-01'
    }
  ],
  compiledAt: '2025-01-02'
};

const draft: DocumentDraft = {
  id: 'draft-1',
  title: 'Claim Notice',
  sections: [
    {
      heading: 'Facts',
      content: 'The event occurred on 2025-01-01.',
      evidenceRefs: [
        {
          evidenceId: 'e1',
          attachmentIndex: 1,
          timestamp: '2025-01-01'
        }
      ],
      confirmed: true
    }
  ],
  disclaimer: 'Information-only',
  citations: [
    {
      label: 'Attachment 1',
      url: 'https://www.canlii.org/en/on/laws/stat/soa-1992-c-32-5/latest/',
      retrievalDate: '2025-01-02',
      source: 'CanLII',
      evidenceId: 'e1'
    }
  ]
};

describe('DocumentPackager', () => {
  it('assembles package with manifests and drafts', () => {
    const packager = new DocumentPackager();
    const pkg = packager.assemble({
      packageName: 'test-package',
      forumMap: 'Forum map content',
      timeline: 'Timeline content',
      missingEvidenceChecklist: 'Missing evidence content',
      drafts: [draft],
      sourceManifest,
      evidenceManifest
    });

    const paths = pkg.files.map((f) => f.path);
    expect(paths).toContain('manifests/source_manifest.json');
    expect(paths).toContain('manifests/evidence_manifest.json');
    expect(paths).toContain('forum_map.md');
    expect(paths).toContain('timeline.md');
    expect(paths.some((p) => p.startsWith('drafts/'))).toBe(true);
    expect(pkg.folders.length).toBeGreaterThan(0);
  });

  it('adds placeholders and warnings when template files are missing', () => {
    const packager = new DocumentPackager();
    const pkg = packager.assemble({
      packageName: 'test-package',
      forumMap: 'Forum map content',
      timeline: 'Timeline content',
      missingEvidenceChecklist: 'Missing evidence content',
      drafts: [],
      sourceManifest,
      evidenceManifest
    });

    const hasPlaceholder = pkg.files.some((f) => f.content.startsWith('# Placeholder'));
    expect(hasPlaceholder).toBe(true);
    expect(pkg.warnings?.length).toBeGreaterThan(0);
  });
});
