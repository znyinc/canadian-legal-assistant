import { describe, it, expect } from 'vitest';
import { IntegrationAPI } from '../src/api/IntegrationAPI';
import { DomainModuleRegistry } from '../src/core/domains/DomainModuleRegistry';
import { InsuranceDomainModule } from '../src/core/domains/InsuranceDomainModule';
import { LandlordTenantDomainModule } from '../src/core/domains/LandlordTenantDomainModule';
import { EvidenceIndexer } from '../src/core/evidence/EvidenceIndexer';
import { ManifestBuilder } from '../src/core/audit/ManifestBuilder';

describe('IntegrationAPI', () => {
  const registry = new DomainModuleRegistry();
  registry.register(new InsuranceDomainModule());
  registry.register(new LandlordTenantDomainModule());
  const manifests = new ManifestBuilder();
  const indexer = new EvidenceIndexer();

  const api = new IntegrationAPI({ registry, manifests, indexer });

  it('processes intake with classification and forum map', () => {
    const res = api.intake({ classification: { domainHint: 'insurance', jurisdictionHint: 'Ontario' } });
    expect(res.classification.domain).toBe('insurance');
    expect(res.forumMap.length).toBeGreaterThan(0);
  });

  it('uploads evidence and returns index, timeline, and redaction', () => {
    const content = Buffer.from('Call me at 555-123-4567');
    const res = api.uploadEvidence({
      filename: 'note.txt',
      content,
      type: 'TXT',
      provenance: 'user-provided'
    });
    expect(res.index.items.length).toBe(1);
    expect(res.redactedPreview).not.toContain('555');
    expect(res.timeline.length).toBeDefined();
  });

  it('generates documents via domain module', () => {
    const evidenceIndex = indexer.generateIndex();
    const sourceManifest = manifests.buildSourceManifest([
      { service: 'CanLII', url: 'https://www.canlii.org', retrievalDate: '2025-01-02' }
    ]);

    const res = api.generateDocuments({
      classification: {
        id: 'mc-1',
        domain: 'insurance',
        jurisdiction: 'Ontario',
        parties: { claimantType: 'individual', respondentType: 'business' },
        status: 'classified'
      },
      forumMap: 'Forum map',
      timeline: 'Timeline text',
      missingEvidence: 'Missing evidence',
      evidenceIndex,
      sourceManifest
    });

    expect(res.package.files.some((f) => f.path.startsWith('drafts/'))).toBe(true);
    expect(res.drafts.length).toBeGreaterThan(0);
  });

  it('blocks deletion when legal hold is applied', () => {
    // apply hold through lifecycle manager exposed indirectly
    const sourceManifest = manifests.buildSourceManifest([]);
    api.deleteData({ actor: 'admin', items: ['pkg1'], legalHold: true, reason: 'investigation' });
    const result = api.deleteData({ actor: 'admin', items: ['pkg1'] });
    expect(result.status).toBe('blocked');
  });
});
