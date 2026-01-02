import { Buffer } from 'node:buffer';
import { MatterClassifier, ClassificationInput } from '../core/triage/MatterClassifier';
import { ForumRouter } from '../core/triage/ForumRouter';
import { TimelineAssessor } from '../core/triage/TimelineAssessor';
import { PillarClassifier } from '../core/triage/PillarClassifier';
import { PillarExplainer } from '../core/triage/PillarExplainer';
import { JourneyTracker, JourneyProgress } from '../core/triage/JourneyTracker';
import { AuthorityRegistry } from '../core/authority/AuthorityRegistry';
import { DisclaimerService } from '../core/upl/DisclaimerService';
import { A2ISandboxFramework, SandboxPlan } from '../core/upl/A2ISandboxFramework';
import { validateFile } from '../core/evidence/Validator';
import { redactPII } from '../core/evidence/PIIRedactor';
import { EvidenceIndexer } from '../core/evidence/EvidenceIndexer';
import { TimelineGenerator } from '../core/evidence/TimelineGenerator';
import { DocumentDraftingEngine } from '../core/documents/DocumentDraftingEngine';
import { DocumentPackager } from '../core/documents/DocumentPackager';
import { VariableExtractor } from '../core/documents/VariableExtractor';
import { DomainModuleRegistry } from '../core/domains/DomainModuleRegistry';
import { AuditLogger } from '../core/audit/AuditLogger';
import { ManifestBuilder } from '../core/audit/ManifestBuilder';
import { DataLifecycleManager } from '../core/lifecycle/DataLifecycleManager';
import { OCPPValidator } from '../core/ocpp/OCPPValidator';
import { LimitationPeriodsEngine, DeadlineAlert } from '../core/limitation/LimitationPeriodsEngine';
import { ActionPlanGenerator, ActionPlan } from '../core/actionPlan/ActionPlanGenerator';
import { initialAuthorities } from '../data/authorities';
import {
  Domain,
  DomainModule,
  EvidenceIndex,
  EvidenceType,
  MatterClassification,
  SourceManifest,
  EvidenceManifest,
  DocumentPackage,
  DocumentDraft,
  AccessMethod
} from '../core/models';

export interface IntakeRequest {
  classification: Partial<MatterClassification>;
  description?: string;
  province?: string;
  tags?: string[];
}

export interface IntakeResponse {
  classification: MatterClassification & { pillar?: string; pillarMatches?: string[]; pillarAmbiguous?: boolean; actionPlan?: ActionPlan };
  forumMap: any; // structured ForumMap object
  timelineAssessment: string;
  pillar?: string;
  pillarMatches?: string[];
  pillarAmbiguous?: boolean;
  pillarExplanation?: {
    burdenOfProof: string;
    overview: string;
    nextSteps: string[];
  };
  alerts?: string[];
  journey?: JourneyProgress;
  ocppWarnings?: string[]; // OCPP compliance warnings for Toronto Region
  deadlineAlerts?: DeadlineAlert[]; // Limitation period deadline alerts
  uplBoundaries?: ReturnType<DisclaimerService['empathyBoundaryPlan']>;
  adviceRedirect?: ReturnType<DisclaimerService['adviceRequestGuidance']>;
  sandboxPlan?: SandboxPlan;
  actionPlan?: ActionPlan; // Action plan for empathy-first UX display
}

export interface EvidenceUploadRequest {
  filename: string;
  content: Buffer;
  type: EvidenceType;
  provenance: AccessMethod;
  sources?: SourceManifest['entries'];
}

export interface EvidenceUploadResponse {
  index: EvidenceIndex;
  timeline: ReturnType<TimelineGenerator['generate']>;
  gaps: ReturnType<TimelineGenerator['detectGaps']>;
  missingAlerts: ReturnType<TimelineGenerator['flagMissingEvidence']>;
  redactedPreview: string;
}

export interface DocumentRequest {
  classification: MatterClassification;
  forumMap: string;
  timeline: string;
  missingEvidence: string;
  evidenceIndex: EvidenceIndex;
  sourceManifest: SourceManifest;
  requestedTemplates?: string[];
  description?: string;
  matterId?: string;
}

export interface DocumentResponse {
  drafts: DocumentDraft[];
  package: DocumentPackage;
  warnings?: string[];
  ocppValidation?: {
    compliant: boolean;
    errors: string[];
    warnings: string[];
    checklist?: string;
  };
}

export interface ExportRequest {
  actor: string;
  items: string[];
  manifest: SourceManifest;
}

export interface DeletionRequest {
  actor: string;
  items: string[];
  legalHold?: boolean;
  reason?: string;
}

export class IntegrationAPI {
  private classifier: MatterClassifier;
  private router: ForumRouter;
  private assessor: TimelineAssessor;
  private pillar: PillarClassifier;
  private explainer: PillarExplainer;
  private journey: JourneyTracker;
  private authorities: AuthorityRegistry;
  private validator: typeof validateFile;
  private redactor: typeof redactPII;
  private indexer: EvidenceIndexer;
  private timeline: TimelineGenerator;
  private drafting: DocumentDraftingEngine;
  private packager: DocumentPackager;
  private registry: DomainModuleRegistry;
  private audit: AuditLogger;
  private manifests: ManifestBuilder;
  private lifecycle: DataLifecycleManager;
  private ocppValidator: OCPPValidator;
  private limitationEngine: LimitationPeriodsEngine;
  private actionPlanGenerator: ActionPlanGenerator;
  private upl: DisclaimerService;
  private sandbox: A2ISandboxFramework;
  private variableExtractor: VariableExtractor;

  constructor(options?: {
    classifier?: MatterClassifier;
    router?: ForumRouter;
    assessor?: TimelineAssessor;
    pillar?: PillarClassifier;
    explainer?: PillarExplainer;
    journey?: JourneyTracker;
    authorities?: AuthorityRegistry;
    validator?: typeof validateFile;
    redactor?: typeof redactPII;
    indexer?: EvidenceIndexer;
    timeline?: TimelineGenerator;
    drafting?: DocumentDraftingEngine;
    packager?: DocumentPackager;
    registry?: DomainModuleRegistry;
    audit?: AuditLogger;
    manifests?: ManifestBuilder;
    lifecycle?: DataLifecycleManager;
    ocppValidator?: OCPPValidator;
    limitationEngine?: LimitationPeriodsEngine;
    actionPlanGenerator?: ActionPlanGenerator;
    upl?: DisclaimerService;
    sandbox?: A2ISandboxFramework;
  }) {
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
    this.ocppValidator = options?.ocppValidator ?? new OCPPValidator();
    this.limitationEngine = options?.limitationEngine ?? new LimitationPeriodsEngine();
    this.actionPlanGenerator = options?.actionPlanGenerator ?? new ActionPlanGenerator();
    this.upl = options?.upl ?? new DisclaimerService();
    this.sandbox = options?.sandbox ?? new A2ISandboxFramework();
    this.registry = options?.registry ?? new DomainModuleRegistry();
    this.audit = options?.audit ?? new AuditLogger();
    this.manifests = options?.manifests ?? new ManifestBuilder();
    this.lifecycle = options?.lifecycle ?? new DataLifecycleManager(this.audit);
    this.variableExtractor = new VariableExtractor();
  }

  intake(req: IntakeRequest): IntakeResponse {
    // Merge request-level description/tags into classification for detection
    const enrichedClassification = {
      ...req.classification,
      description: req.description || (req.classification as any).description,
      notes: (req.classification as any).notes || (req.description ? [req.description] : undefined),
      tags: req.tags || (req.classification as any).tags
    } as any;

    // Build a proper classifier input so domain detection uses free-form description text
    const classifierInput: ClassificationInput = {
      domainHint:
        (enrichedClassification.domainHint as string) ||
        (enrichedClassification.description as string) ||
        (req.description as string) ||
        '',
      jurisdictionHint:
        (enrichedClassification.jurisdiction as string) ||
        (enrichedClassification.jurisdictionHint as string) ||
        (req.province as string),
      claimantType: enrichedClassification.parties?.claimantType,
      respondentType: enrichedClassification.parties?.respondentType,
      disputeAmount: enrichedClassification.disputeAmount,
      urgencyHint: enrichedClassification.urgency,
      keyDates: enrichedClassification.timeline?.keyDates as string[] | undefined
    };

    // Preserve explicitly set domain/jurisdiction only when caller truly sets them; otherwise rely on detection
    const classificationResult = this.classifier.classify(classifierInput);
    const classification = {
      ...classificationResult,
      ...(enrichedClassification.domain && { domain: enrichedClassification.domain }),
      ...(enrichedClassification.jurisdiction && { jurisdiction: enrichedClassification.jurisdiction })
    } as any;
    const forumMap = this.router.route(classification);
    const timelineAssessment = this.assessor.assess(classification.timeline?.keyDates || []);
    // Preserve descriptive hints from the original request when running heuristics
    const mergedForDetection = { ...classification, ...enrichedClassification } as any;
    const municipal = this.assessor.detectMunicipalNotice(mergedForDetection, undefined);

    // Pillar classification and explanation
    const pillar = this.pillar.classify((mergedForDetection.description as string) || classification.notes?.join(' ') || '');
    const matches = this.pillar.detectAllPillars((mergedForDetection.description as string) || classification.notes?.join(' ') || '');
    const ambiguous = matches.length > 1;
    const expl = this.explainer.explain(pillar);

    const journey = this.journey.buildProgress({
      classification,
      forumMap,
      evidenceCount: 0,
      documentsGenerated: false
    });

    // attach pillar info to classification object for persistence
    (classification as any).pillar = pillar;
    (classification as any).pillarMatches = matches;
    (classification as any).pillarAmbiguous = ambiguous;
    (classification as any).journey = journey;

    this.audit.log('source-access', 'system', 'Matter intake processed', { domain: classification.domain, pillar, pillarMatches: matches });

    const alerts: string[] = [];
    if (municipal.required && municipal.message) alerts.push(municipal.message);

    // OCPP validation for Toronto Region filings
    const ocppWarnings: string[] = [];
    if (this.ocppValidator.requiresOCPPValidation(classification.jurisdiction, classification.domain)) {
      const checklist = this.ocppValidator.generateComplianceChecklist();
      ocppWarnings.push('⚠️ OCPP Filing Requirements: Toronto Region Superior Court requires PDF/A format, 8.5x11 page size, and files under 20MB.');
      ocppWarnings.push('Review compliance checklist before filing documents.');
    }

    // Limitation period deadline alerts (Ontario only)
    const deadlineAlerts: DeadlineAlert[] = [];
    if (classification.jurisdiction === 'Ontario') {
      const relevantPeriods = this.limitationEngine.getRelevantPeriods(
        classification.domain,
        req.description || mergedForDetection.description || '',
        req.tags || mergedForDetection.tags
      );
      
      // Generate alerts for each relevant period
      // In a real implementation, this would calculate from actual incident/discovery dates
      relevantPeriods.forEach(period => {
        const exampleDaysRemaining = period.id === 'ontario-municipal-10-day' ? 5 : 30;
        const alert = this.limitationEngine.calculateAlert(period.id, exampleDaysRemaining);
        if (alert) deadlineAlerts.push(alert);
      });
    }

    const uplBoundaries = this.upl.empathyBoundaryPlan({
      jurisdiction: classification.jurisdiction,
      domain: classification.domain,
      audience: 'self-represented'
    });
    const adviceRedirect = this.upl.adviceRequestGuidance(req.description || mergedForDetection.description || '');
    const sandboxPlan = this.sandbox.plan({
      domain: classification.domain,
      jurisdiction: classification.jurisdiction,
      urgency: classification.urgency as any
    });

    this.audit.log('other', 'system', 'UPL boundary enforcement applied', {
      tier: sandboxPlan.tier,
      redirected: adviceRedirect.redirected
    });

    // Generate action plan for empathy-first UX
    const actionPlan = this.actionPlanGenerator.generate(classification);

    // Persist boundary outputs and action plan for reloads
    (classification as any).uplBoundaries = uplBoundaries;
    (classification as any).adviceRedirect = adviceRedirect;
    (classification as any).sandboxPlan = sandboxPlan;
    (classification as any).actionPlan = actionPlan;

    return {
      classification,
      forumMap,
      timelineAssessment: JSON.stringify(timelineAssessment),
      pillar,
      pillarMatches: matches.length ? matches : undefined,
      pillarAmbiguous: ambiguous || undefined,
      pillarExplanation: { burdenOfProof: expl.burdenOfProof, overview: expl.overview, nextSteps: expl.nextSteps },
      journey,
      alerts: alerts.length ? alerts : undefined,
      ocppWarnings: ocppWarnings.length ? ocppWarnings : undefined,
      deadlineAlerts: deadlineAlerts.length ? deadlineAlerts : undefined,
      uplBoundaries,
      adviceRedirect,
      sandboxPlan,
      actionPlan
    };
  }

  uploadEvidence(req: EvidenceUploadRequest): EvidenceUploadResponse {
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

  /**
   * Lightweight helper used by HTTP routes to run intake classification from free-form text.
   * Uses description as the domain hint so malpractice and other keyword-based detections work
   * even when the initial domain came from a form preset.
   */
  classifyMatter(opts: { description: string; province?: string; domain?: Domain; disputeAmount?: number; tags?: string[] }) {
    const result = this.intake({
      classification: {
        // Provide description as the domain hint so classifier can detect malpractice keywords
        description: opts.description,
        domainHint: opts.description,
        jurisdiction: opts.province,
        disputeAmount: opts.disputeAmount
      } as any,
      description: opts.description,
      province: opts.province,
      tags: opts.tags
    });

    return result;
  }

  generateDocuments(req: DocumentRequest): DocumentResponse {
    const domainModule = this.pickModule(req.classification.domain);
    const evidenceManifest = this.buildEvidenceManifest(req.evidenceIndex);
    const formMappings = this.buildFormMappings(req);

    if (domainModule) {
      let result = domainModule.generate({
        classification: req.classification,
        forumMap: req.forumMap,
        timeline: req.timeline,
        missingEvidence: req.missingEvidence,
        evidenceIndex: req.evidenceIndex,
        sourceManifest: req.sourceManifest,
          evidenceManifest,
          description: req.description,
          formMappings,
          matterId: req.matterId
      });

      this.audit.log('export', 'system', 'Documents generated', { domain: domainModule.domain });

      // OCPP validation for Toronto Region filings
      let ocppValidation = undefined;
      if (this.ocppValidator.requiresOCPPValidation(req.classification.jurisdiction, req.classification.domain)) {
        // Perform basic validation (without actual file content, provide warnings)
        const validationResult = this.ocppValidator.validateFiling({
          filename: 'generated-document.pdf',
          fileSize: 0, // Will be validated at export time
          isPDFA: undefined, // Cannot verify format until actual PDF generated
          jurisdiction: req.classification.jurisdiction
        });

        ocppValidation = {
          ...validationResult,
          checklist: this.ocppValidator.generateComplianceChecklist()
        };
      }

      // If caller requested specific templates, filter drafts and package files
      if (req.requestedTemplates && req.requestedTemplates.length) {
        const requested = req.requestedTemplates;
        const keywords = requested.map((r) => r.split('/').pop()?.replace(/_/g, ' ').toLowerCase() || r.toLowerCase());
        const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
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
          evidenceManifest,
          jurisdiction: req.classification.jurisdiction,
          domain: req.classification.domain,
          formMappings,
          matterId: req.matterId
        });
        result = { drafts: filteredDrafts, package: pkg, warnings: pkg.warnings, ocppValidation };
      } else {
        result = { ...result, ocppValidation };
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
      evidenceManifest,
      jurisdiction: req.classification.jurisdiction,
      domain: req.classification.domain,
      formMappings,
      matterId: req.matterId
    });

    this.audit.log('export', 'system', 'Documents generated (fallback)', { domain: req.classification.domain });

    return { drafts: [draft], package: pkg, warnings: pkg.warnings };
  }

  exportData(req: ExportRequest) {
    const result = this.lifecycle.exportData(req);
    this.audit.log('export', req.actor, 'Export requested', { items: req.items });
    return result;
  }

  deleteData(req: DeletionRequest) {
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

  private pickModule(domain: Domain): DomainModule | undefined {
    return this.registry.get(domain);
  }

  // Expose registered modules for introspection/testing
  listRegisteredModules(): DomainModule[] {
    return this.registry.list();
  }

  private buildEvidenceManifest(index: EvidenceIndex): EvidenceManifest {
    return this.manifests.buildEvidenceManifest(index);
  }

  /**
   * Build form mappings for hybrid document generation so users get visual tables + filing guides.
   */
  private buildFormMappings(req: DocumentRequest): Array<{ formId: string; variables: Record<string, any> }> {
    const formIds = this.selectFormIdsForDomain(req.classification.domain);
    if (!formIds.length) return [];

    const description = req.description || req.classification.notes?.join(' ') || '';
    const variables = this.variableExtractor.extractFromDescription(description, req.classification);

    return formIds.map((formId) => ({ formId, variables }));
  }

  /**
   * Map domains to applicable official forms for summary generation.
   */
  private selectFormIdsForDomain(domain: Domain): string[] {
    switch (domain) {
      case 'civil-negligence':
      case 'legalMalpractice':
        return ['form-7a-small-claims'];
      case 'landlordTenant':
        return ['ltb-form-t1', 'ltb-form-l1'];
      case 'criminal':
        return ['victim-impact-statement'];
      default:
        return [];
    }
  }

  private seedAuthorities(): AuthorityRegistry {
    const registry = new AuthorityRegistry();
    initialAuthorities.forEach((a) => registry.add(a));
    return registry;
  }
}
