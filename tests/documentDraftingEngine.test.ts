import { describe, it, expect } from 'vitest';
import { DocumentDraftingEngine } from '../src/core/documents/DocumentDraftingEngine';
import { EvidenceIndex } from '../src/core/models';

const sampleEvidenceIndex: EvidenceIndex = {
  items: [
    {
      id: 'e1',
      filename: 'email.eml',
      type: 'EML',
      date: '2025-01-01',
      summary: 'Email from claimant to insurer',
      provenance: 'user-provided',
      hash: 'abc123',
      tags: ['correspondence'],
      credibilityScore: 0.7
    }
  ],
  generatedAt: '2025-01-02',
  sourceManifest: {
    sources: [
      {
        service: 'CanLII',
        url: 'https://www.canlii.org/en/on/laws/stat/soa-1992-c-32-5/latest/soa-1992-c-32-5.html',
        retrievalDate: '2025-01-02'
      }
    ]
  }
};

describe('DocumentDraftingEngine', () => {
  it('builds evidence-grounded draft with citations and disclaimer', () => {
    const engine = new DocumentDraftingEngine();
    const draft = engine.createDraft({
      title: 'Claim Notice',
      sections: [
        {
          heading: 'Facts',
          content: 'The event occurred and evidence is attached.',
          evidenceRefs: [{ evidenceId: 'e1' }],
          confirmed: false
        }
      ],
      evidenceIndex: sampleEvidenceIndex,
      jurisdiction: 'Ontario'
    });

    expect(draft.disclaimer).toBeTruthy();
    expect(draft.citations.length).toBe(1);
    expect(draft.sections[0].evidenceRefs[0].attachmentIndex).toBe(1);
    expect(draft.missingConfirmations).toBeTruthy();
  });

  it('flags advisory tone and missing citations', () => {
    const engine = new DocumentDraftingEngine();
    const draft = engine.createDraft({
      title: 'Advisory Draft',
      sections: [
        {
          heading: 'Guidance',
          content: 'You should file immediately without delay.',
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: { ...sampleEvidenceIndex, sourceManifest: { sources: [] } },
      includeDisclaimer: false
    });

    expect(draft.citationWarnings).toBeTruthy();
    expect(draft.styleWarnings?.length).toBeGreaterThan(0);
  });
});
