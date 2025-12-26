import { describe, it, expect } from 'vitest';
import { IntegrationAPI } from '../src/api/IntegrationAPI';
import { DomainModuleRegistry } from '../src/core/domains/DomainModuleRegistry';
import { InsuranceDomainModule } from '../src/core/domains/InsuranceDomainModule';
import { LandlordTenantDomainModule } from '../src/core/domains/LandlordTenantDomainModule';
import { CivilNegligenceDomainModule } from '../src/core/domains/CivilNegligenceDomainModule';
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
    expect(res.forumMap).toBeDefined();
    expect(res.forumMap.primaryForum).toBeDefined();
    expect(Array.isArray(res.forumMap.alternatives)).toBe(true);
    expect(Array.isArray(res.forumMap.escalation)).toBe(true);
    expect(typeof res.forumMap.rationale === 'string').toBe(true);
  });

  it('detects municipal 10-day notice when matter mentions municipal tree', () => {
    const res = api.intake({ classification: { description: 'A municipal tree fell on my car', jurisdictionHint: 'Ontario' } });
    expect(res.alerts).toBeDefined();
    expect(res.alerts && res.alerts[0].toLowerCase().includes('municipal')).toBe(true);
  });

  it('returns pillar classification and explanation for intake', () => {
    const res = api.intake({ classification: { description: 'I slipped and fell at a supermarket and broke my wrist', jurisdictionHint: 'Ontario' } });
    expect(res.pillar).toBeDefined();
    expect(res.pillarExplanation).toBeDefined();
    expect(res.pillarExplanation && res.pillarExplanation.overview.length).toBeGreaterThan(0);
    expect(res.pillarMatches).toBeUndefined();
    expect(res.pillarAmbiguous).toBeUndefined();
  });

  it('returns pillarMatches and ambiguous for multi-pillar descriptions', () => {
    const res = api.intake({ classification: { description: 'I was assaulted and also received a parking ticket', jurisdictionHint: 'Ontario' } });
    expect(res.pillarMatches).toBeDefined();
    expect(Array.isArray(res.pillarMatches)).toBe(true);
    expect(res.pillarMatches && res.pillarMatches.length).toBeGreaterThan(1);
    expect(res.pillarAmbiguous).toBe(true);
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

  it('returns only requested templates when requestedTemplates is provided', () => {
    const evidenceIndex = indexer.generateIndex();
    const sourceManifest = manifests.buildSourceManifest([]);

    // register civil negligence module for this test
    registry.register(new CivilNegligenceDomainModule());
    const api2 = new IntegrationAPI({ registry, manifests, indexer });

    const res = api2.generateDocuments({
      classification: {
        id: 'mc-2',
        domain: 'civil-negligence',
        jurisdiction: 'Ontario',
        parties: { claimantType: 'individual', respondentType: 'individual', names: ['Alice'] },
        timeline: { start: '2025-01-01' },
        disputeAmount: 500,
        status: 'classified'
      } as any,
      forumMap: 'Forum map',
      timeline: 'Timeline text',
      missingEvidence: 'Missing evidence',
      evidenceIndex,
      sourceManifest,
      requestedTemplates: ['civil/small_claims_form7a']
    });

    expect(res.drafts.length).toBe(1);
    expect(res.drafts[0].title.toLowerCase()).toContain('form 7a');
  });

  it('blocks deletion when legal hold is applied', () => {
    // apply hold through lifecycle manager exposed indirectly
    const sourceManifest = manifests.buildSourceManifest([]);
    api.deleteData({ actor: 'admin', items: ['pkg1'], legalHold: true, reason: 'investigation' });
    const result = api.deleteData({ actor: 'admin', items: ['pkg1'] });
    expect(result.status).toBe('blocked');
  });
});
