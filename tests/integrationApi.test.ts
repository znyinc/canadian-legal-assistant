import { describe, it, expect } from 'vitest';
import { IntegrationAPI } from '../src/api/IntegrationAPI';
import { DomainModuleRegistry } from '../src/core/domains/DomainModuleRegistry';
import { InsuranceDomainModule } from '../src/core/domains/InsuranceDomainModule';
import { LandlordTenantDomainModule } from '../src/core/domains/LandlordTenantDomainModule';
import { CivilNegligenceDomainModule } from '../src/core/domains/CivilNegligenceDomainModule';
import { OCPPFilingModule } from '../src/core/domains/OCPPFilingModule';
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

  it('provides UPL boundaries, advice redirect, and sandbox plan on intake', () => {
    const res = api.intake({ classification: { description: 'What should I do about this municipal notice?', jurisdictionHint: 'Ontario' } });
    expect(res.uplBoundaries).toBeDefined();
    expect(res.uplBoundaries?.safeHarbor).toContain('Safe Harbor');
    expect(res.adviceRedirect).toBeDefined();
    expect(res.adviceRedirect?.redirected).toBe(true);
    expect(res.sandboxPlan).toBeDefined();
    expect(res.sandboxPlan?.actions.length).toBeGreaterThan(0);
  });

  it('blocks deletion when legal hold is applied', () => {
    // apply hold through lifecycle manager exposed indirectly
    const sourceManifest = manifests.buildSourceManifest([]);
    api.deleteData({ actor: 'admin', items: ['pkg1'], legalHold: true, reason: 'investigation' });
    const result = api.deleteData({ actor: 'admin', items: ['pkg1'] });
    expect(result.status).toBe('blocked');
  });

  it('returns OCPP warnings for Toronto Region OCPP filings on intake', () => {
    registry.register(new OCPPFilingModule());
    const api4 = new IntegrationAPI({ registry, manifests, indexer });
    
    const res = api4.intake({ 
      classification: { 
        domain: 'ocppFiling', // Explicitly set domain
        jurisdictionHint: 'Ontario',
        description: 'Need to consolidate related Superior Court actions'
      } 
    });
    
    expect(res.classification.domain).toBe('ocppFiling');
    expect(res.ocppWarnings).toBeDefined();
    expect(res.ocppWarnings && res.ocppWarnings.length).toBeGreaterThan(0);
    expect(res.ocppWarnings && res.ocppWarnings[0]).toContain('PDF/A');
  });

  it('returns OCPP validation in document generation response for OCPP domain', () => {
    registry.register(new OCPPFilingModule());
    const api3 = new IntegrationAPI({ registry, manifests, indexer });

    const evidenceIndex = indexer.generateIndex();
    const sourceManifest = manifests.buildSourceManifest([]);

    const res = api3.generateDocuments({
      classification: {
        id: 'mc-ocpp',
        domain: 'ocppFiling',
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

    expect(res.ocppValidation).toBeDefined();
    expect(res.ocppValidation && res.ocppValidation.checklist).toBeDefined();
    expect(res.ocppValidation && res.ocppValidation.checklist).toContain('PDF/A');
  });

  it('includes PDF/A conversion guide in package for OCPP filings', () => {
    registry.register(new OCPPFilingModule());
    const api4 = new IntegrationAPI({ registry, manifests, indexer });

    const evidenceIndex = indexer.generateIndex();
    const sourceManifest = manifests.buildSourceManifest([]);

    const res = api4.generateDocuments({
      classification: {
        id: 'mc-ocpp-pdfa',
        domain: 'ocppFiling',
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

    // Verify PDF/A conversion guide is included in package
    const pdfaGuide = res.package.files.find((f) => f.path === 'PDF_A_CONVERSION_GUIDE.md');
    expect(pdfaGuide).toBeDefined();
    expect(pdfaGuide?.content).toContain('PDF/A Format Conversion Guide');
    expect(pdfaGuide?.content).toContain('LibreOffice');
    
    // Verify warnings about PDF/A requirement
    expect(res.package.warnings).toBeDefined();
    expect(res.package.warnings?.some(w => w.includes('PDF/A format'))).toBe(true);
  });

  it('returns deadline alerts for matters with applicable limitation periods', () => {
    const api = new IntegrationAPI();
    
    // Test municipal property damage (should trigger 10-day notice + 2-year general)
    const municipalRes = api.intake({
      description: 'Tree fell on my car from city property',
      province: 'Ontario',
      tags: ['property-damage', 'tree-damage'],
      classification: {}
    });
    
    expect(municipalRes.deadlineAlerts).toBeDefined();
    expect(municipalRes.deadlineAlerts!.length).toBeGreaterThan(0);
    
    // Should have critical municipal 10-day notice alert
    const municipalAlert = municipalRes.deadlineAlerts!.find(
      a => a.limitationPeriod.id === 'ontario-municipal-10-day'
    );
    expect(municipalAlert).toBeDefined();
    expect(municipalAlert?.urgency).toBe('critical'); // 5 days remaining
    expect(municipalAlert?.message).toContain('10 days deadline');
    expect(municipalAlert?.actionRequired).toContain('notice');
    expect(municipalAlert?.encouragement).toBeDefined();
    
    // Test employment matter (should trigger ESA + wrongful dismissal)
    const employmentRes = api.intake({
      description: 'Terminated without cause after 10 years',
      province: 'Ontario',
      classification: { domain: 'employment' }
    });
    
    expect(employmentRes.deadlineAlerts).toBeDefined();
    const esaAlert = employmentRes.deadlineAlerts!.find(
      a => a.limitationPeriod.id === 'ontario-esa-complaint'
    );
    expect(esaAlert).toBeDefined();
    expect(esaAlert?.limitationPeriod.period).toBe('2 years');
    
    // Test landlord-tenant matter (should trigger LTB application period)
    const ltbRes = api.intake({
      description: 'Landlord refuses to fix heating in winter',
      province: 'Ontario',
      classification: { domain: 'landlordTenant' }
    });
    
    expect(ltbRes.deadlineAlerts).toBeDefined();
    const ltbAlert = ltbRes.deadlineAlerts!.find(
      a => a.limitationPeriod.id === 'ontario-ltb-application'
    );
    expect(ltbAlert).toBeDefined();
    expect(ltbAlert?.limitationPeriod.period).toBe('Varies (1 year typical)');

    // Test estate/succession matter (should trigger dependant support 6-month alert)
    const estateRes = api.intake({
      description: 'Probate issued, dependant needs support from estate',
      province: 'Ontario',
      classification: { domain: 'estateSuccession', notes: ['Probate issued on 2025-01-05'] }
    });

    expect(estateRes.deadlineAlerts).toBeDefined();
    const dependantAlert = estateRes.deadlineAlerts!.find(
      a => a.limitationPeriod.id === 'ontario-dependant-support-6-month'
    );
    expect(dependantAlert).toBeDefined();
    expect(dependantAlert?.limitationPeriod.period).toBe('6 months');
    expect(dependantAlert?.actionRequired).toMatch(/file/i);
    
    // Test non-Ontario matter (should have no Ontario-specific alerts)
    const bcRes = api.intake({
      description: 'Contract dispute in BC',
      province: 'British Columbia',
      classification: { jurisdiction: 'British Columbia' }
    });
    
    // BC matters should have empty deadlineAlerts (Ontario engine only)
    expect(bcRes.deadlineAlerts).toBeUndefined();
  });

  it('includes encouraging messaging in deadline alerts', () => {
    const api = new IntegrationAPI();
    
    const res = api.intake({
      description: 'Municipal tree damage on my property',
      province: 'Ontario',
      tags: ['municipal', 'tree-damage'],
      classification: {}
    });
    
    expect(res.deadlineAlerts).toBeDefined();
    const criticalAlert = res.deadlineAlerts!.find(a => a.urgency === 'critical');
    
    // Verify encouraging (not alarming) messaging
    expect(criticalAlert?.encouragement).toBeDefined();
    expect(criticalAlert?.encouragement).toMatch(/taking the right step|You have time|focus|Don't panic/i);
  });
});

