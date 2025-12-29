import { describe, it, expect } from 'vitest';
import { DocumentPackager } from '../src/core/documents/DocumentPackager';
import { TemplateLibrary } from '../src/core/templates/TemplateLibrary';

describe('DocumentPackager templates integration', () => {
  it('includes domain templates from TemplateLibrary into packaged files', () => {
    const lib = new TemplateLibrary();
    const packager = new DocumentPackager(lib as any);

    const pkg = packager.assemble({
      packageName: 'test',
      forumMap: 'forum',
      timeline: 'timeline',
      missingEvidenceChecklist: 'missing',
      drafts: [],
      sourceManifest: { entries: [], compiledAt: new Date().toISOString() },
      evidenceManifest: { items: [], compiledAt: new Date().toISOString() }
    });

    // Expect at least the civil templates to be present
    const paths = pkg.files.map((f) => f.path);
    expect(paths).toContain('templates/civil/demand_notice.md');
    expect(paths).toContain('templates/civil/small_claims_form7a.md');
    expect(paths).toContain('templates/civil/evidence_checklist.md');
  });
});
