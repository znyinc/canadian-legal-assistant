import { MatterClassifier } from '../core/triage/MatterClassifier';
import { ForumRouter } from '../core/triage/ForumRouter';
import { TimelineAssessor } from '../core/triage/TimelineAssessor';
import { PillarClassifier } from '../core/triage/PillarClassifier';
import { PillarExplainer } from '../core/triage/PillarExplainer';
import { JourneyTracker } from '../core/triage/JourneyTracker';
import { AuthorityRegistry } from '../core/authority/AuthorityRegistry';
import { validateFile } from '../core/evidence/Validator';
import { redactPII } from '../core/evidence/PIIRedactor';
import { EvidenceIndexer } from '../core/evidence/EvidenceIndexer';
import { TimelineGenerator } from '../core/evidence/TimelineGenerator';
import { DocumentDraftingEngine } from '../core/documents/DocumentDraftingEngine';
import { DocumentPackager } from '../core/documents/DocumentPackager';
import { DomainModuleRegistry } from '../core/domains/DomainModuleRegistry';
import { AuditLogger } from '../core/audit/AuditLogger';
import { ManifestBuilder } from '../core/audit/ManifestBuilder';
import { DataLifecycleManager } from '../core/lifecycle/DataLifecycleManager';
import { initialAuthorities } from '../data/authorities';
export class IntegrationAPI {
    classifier;
    router;
    assessor;
    pillar;
    explainer;
    journey;
    authorities;
    validator;
    redactor;
    indexer;
    timeline;
    drafting;
    packager;
    registry;
    audit;
    manifests;
    lifecycle;
    constructor(options) {
        this.authorities = options?.authorities ?? this.seedAuthorities();
        this.classifier = options?.classifier ?? new MatterClassifier();
        this.router = options?.router ?? new ForumRouter(this.authorities);
        this.assessor = options?.assessor ?? new TimelineAssessor();
        this.pillar = options?.pillar ?? new PillarClassifier();
        this.explainer = options?.explainer ?? new PillarExplainer();
        this.journey = options?.journey ?? new JourneyTracker();
        this.validator = options?.validator ?? validateFile;
        this.redactor = options?.redactor ?? redactPII;
        this.indexer = options?.indexer ?? new EvidenceIndexer();
        this.timeline = options?.timeline ?? new TimelineGenerator();
        this.drafting = options?.drafting ?? new DocumentDraftingEngine();
        this.packager = options?.packager ?? new DocumentPackager();
        this.registry = options?.registry ?? new DomainModuleRegistry();
        this.audit = options?.audit ?? new AuditLogger();
        this.manifests = options?.manifests ?? new ManifestBuilder();
        this.lifecycle = options?.lifecycle ?? new DataLifecycleManager(this.audit);
    }
    intake(req) {
        const classification = this.classifier.classify(req.classification);
        const forumMap = this.router.route(classification);
        const timelineAssessment = this.assessor.assess(classification.timeline?.keyDates || []);
        // Preserve descriptive hints from the original request when running heuristics
        const mergedForDetection = { ...classification, ...req.classification };
        const municipal = this.assessor.detectMunicipalNotice(mergedForDetection, undefined);
        // Pillar classification and explanation
        const pillar = this.pillar.classify(mergedForDetection.description || classification.notes?.join(' ') || '');
        const matches = this.pillar.detectAllPillars(mergedForDetection.description || classification.notes?.join(' ') || '');
        const ambiguous = matches.length > 1;
        const expl = this.explainer.explain(pillar);
        const journey = this.journey.buildProgress({
            classification,
            forumMap,
            evidenceCount: 0,
            documentsGenerated: false
        });
        // attach pillar info to classification object for persistence
        classification.pillar = pillar;
        classification.pillarMatches = matches;
        classification.pillarAmbiguous = ambiguous;
        classification.journey = journey;
        this.audit.log('source-access', 'system', 'Matter intake processed', { domain: classification.domain, pillar, pillarMatches: matches });
        const alerts = [];
        if (municipal.required && municipal.message)
            alerts.push(municipal.message);
        return {
            classification,
            forumMap,
            timelineAssessment: JSON.stringify(timelineAssessment),
            pillar,
            pillarMatches: matches.length ? matches : undefined,
            pillarAmbiguous: ambiguous || undefined,
            pillarExplanation: { burdenOfProof: expl.burdenOfProof, overview: expl.overview, nextSteps: expl.nextSteps },
            journey,
            alerts: alerts.length ? alerts : undefined
        };
    }
    uploadEvidence(req) {
        const validation = this.validator(req.filename, req.content);
        if (!validation.ok) {
            throw new Error(validation.errors?.join(', ') || 'Validation failed');
        }
        const redaction = this.redactor(req.content.toString());
        if (req.sources) {
            const manifest = this.manifests.buildSourceManifest(req.sources);
            this.indexer.setSources(manifest.entries);
        }
        this.indexer.addItem(req.filename, req.content, req.type, req.provenance);
        const index = this.indexer.generateIndex();
        const timeline = this.timeline.generate(index);
        const gaps = this.timeline.detectGaps(timeline);
        const missingAlerts = this.timeline.flagMissingEvidence(index, timeline);
        this.audit.log('source-access', 'system', 'Evidence uploaded', { filename: req.filename });
        return { index, timeline, gaps, missingAlerts, redactedPreview: redaction.redacted };
    }
    generateDocuments(req) {
        const domainModule = this.pickModule(req.classification.domain);
        const evidenceManifest = this.buildEvidenceManifest(req.evidenceIndex);
        if (domainModule) {
            let result = domainModule.generate({
                classification: req.classification,
                forumMap: req.forumMap,
                timeline: req.timeline,
                missingEvidence: req.missingEvidence,
                evidenceIndex: req.evidenceIndex,
                sourceManifest: req.sourceManifest,
                evidenceManifest
            });
            this.audit.log('export', 'system', 'Documents generated', { domain: domainModule.domain });
            // If caller requested specific templates, filter drafts and package files
            if (req.requestedTemplates && req.requestedTemplates.length) {
                const requested = req.requestedTemplates;
                const keywords = requested.map((r) => r.split('/').pop()?.replace(/_/g, ' ').toLowerCase() || r.toLowerCase());
                const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
                const filteredDrafts = result.drafts.filter((d) => {
                    const t = normalize(d.title);
                    return keywords.some((k) => {
                        const tokens = k.split(/\s+/).filter(Boolean);
                        return tokens.every((tok) => t.includes(normalize(tok)));
                    });
                });
                // Reassemble package with filtered drafts
                const pkg = this.packager.assemble({
                    packageName: req.classification.domain,
                    forumMap: req.forumMap,
                    timeline: req.timeline,
                    missingEvidenceChecklist: req.missingEvidence,
                    drafts: filteredDrafts,
                    sourceManifest: req.sourceManifest,
                    evidenceManifest
                });
                result = { drafts: filteredDrafts, package: pkg, warnings: pkg.warnings };
            }
            return result;
        }
        // Fallback: single informational draft using generic drafting + packager
        const draft = this.drafting.createDraft({
            title: 'Draft Document',
            sections: [
                {
                    heading: 'Summary',
                    content: 'Informational draft generated without domain-specific module.',
                    evidenceRefs: [],
                    confirmed: false
                }
            ],
            evidenceIndex: req.evidenceIndex,
            jurisdiction: req.classification.jurisdiction,
            requireConfirmations: true
        });
        const pkg = this.packager.assemble({
            packageName: req.classification.domain,
            forumMap: req.forumMap,
            timeline: req.timeline,
            missingEvidenceChecklist: req.missingEvidence,
            drafts: [draft],
            sourceManifest: req.sourceManifest,
            evidenceManifest
        });
        this.audit.log('export', 'system', 'Documents generated (fallback)', { domain: req.classification.domain });
        return { drafts: [draft], package: pkg, warnings: pkg.warnings };
    }
    exportData(req) {
        const result = this.lifecycle.exportData(req);
        this.audit.log('export', req.actor, 'Export requested', { items: req.items });
        return result;
    }
    deleteData(req) {
        if (req.legalHold) {
            this.lifecycle.applyLegalHold(req.actor, req.reason || 'legal hold applied via deletion request');
        }
        const result = this.lifecycle.requestDeletion(req);
        this.audit.log('deletion', req.actor, 'Deletion requested', { items: req.items, status: result.status });
        return result;
    }
    auditLog() {
        return this.audit.entries();
    }
    pickModule(domain) {
        return this.registry.get(domain);
    }
    // Expose registered modules for introspection/testing
    listRegisteredModules() {
        return this.registry.list();
    }
    buildEvidenceManifest(index) {
        return this.manifests.buildEvidenceManifest(index);
    }
    seedAuthorities() {
        const registry = new AuthorityRegistry();
        initialAuthorities.forEach((a) => registry.add(a));
        return registry;
    }
}
//# sourceMappingURL=IntegrationAPI.js.map