import { Buffer } from 'node:buffer';
import { MatterClassifier } from '../core/triage/MatterClassifier';
import { ForumRouter } from '../core/triage/ForumRouter';
import { TimelineAssessor } from '../core/triage/TimelineAssessor';
import { PillarClassifier } from '../core/triage/PillarClassifier';
import { PillarExplainer } from '../core/triage/PillarExplainer';
import { JourneyTracker, JourneyProgress } from '../core/triage/JourneyTracker';
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
import { DomainModule, EvidenceIndex, EvidenceType, MatterClassification, SourceManifest, DocumentPackage, DocumentDraft } from '../core/models';
export interface IntakeRequest {
    classification: Partial<MatterClassification>;
}
export interface IntakeResponse {
    classification: MatterClassification & {
        pillar?: string;
        pillarMatches?: string[];
        pillarAmbiguous?: boolean;
    };
    forumMap: any;
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
}
export interface EvidenceUploadRequest {
    filename: string;
    content: Buffer;
    type: EvidenceType;
    provenance: 'user-provided' | 'official-api' | 'official-link';
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
}
export interface DocumentResponse {
    drafts: DocumentDraft[];
    package: DocumentPackage;
    warnings?: string[];
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
export declare class IntegrationAPI {
    private classifier;
    private router;
    private assessor;
    private pillar;
    private explainer;
    private journey;
    private authorities;
    private validator;
    private redactor;
    private indexer;
    private timeline;
    private drafting;
    private packager;
    private registry;
    private audit;
    private manifests;
    private lifecycle;
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
    });
    intake(req: IntakeRequest): IntakeResponse;
    uploadEvidence(req: EvidenceUploadRequest): EvidenceUploadResponse;
    generateDocuments(req: DocumentRequest): DocumentResponse;
    exportData(req: ExportRequest): import("../core/models").ExportResult;
    deleteData(req: DeletionRequest): import("../core/models").DeletionResult;
    auditLog(): import("../core/models").AuditEvent[];
    private pickModule;
    listRegisteredModules(): DomainModule[];
    private buildEvidenceManifest;
    private seedAuthorities;
}
//# sourceMappingURL=IntegrationAPI.d.ts.map