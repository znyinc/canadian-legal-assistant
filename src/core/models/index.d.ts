export type Domain = 'insurance' | 'landlordTenant' | 'employment' | 'humanRights' | 'civil-negligence' | 'other';
export type Jurisdiction = 'Ontario' | 'Federal' | string;
export type PartyType = 'individual' | 'business' | 'government' | string;
export type EvidenceType = 'PDF' | 'PNG' | 'JPG' | 'EML' | 'MSG' | 'TXT';
export type AccessMethod = 'official-api' | 'official-link' | 'user-provided';
export interface MatterClassification {
    id: string;
    domain: Domain;
    jurisdiction: Jurisdiction;
    parties: {
        claimantType: PartyType;
        respondentType: PartyType;
        names?: string[];
    };
    timeline?: {
        start?: string;
        end?: string;
        keyDates?: string[];
    };
    urgency?: 'low' | 'medium' | 'high';
    disputeAmount?: number;
    status?: 'unclassified' | 'classified' | 'needsInfo';
    notes?: string[];
}
export interface AuthorityRef {
    id: string;
    name: string;
    type: 'court' | 'tribunal' | 'regulator';
    jurisdiction: Jurisdiction;
}
export interface ForumMap {
    domain: Domain;
    primaryForum: AuthorityRef;
    alternatives: AuthorityRef[];
    escalation: AuthorityRef[];
    rationale?: string;
}
export interface EvidenceItem {
    id: string;
    filename: string;
    type: EvidenceType;
    date?: string;
    summary?: string;
    provenance: 'user-provided' | 'official-api' | 'official-site';
    hash: string;
    tags?: string[];
    credibilityScore?: number;
}
export interface SourceEntry {
    service: 'CanLII' | 'e-Laws' | 'Justice Laws';
    url: string;
    retrievalDate: string;
    version?: string;
}
export interface EvidenceReference {
    evidenceId: string;
    attachmentIndex?: number;
    timestamp?: string;
    description?: string;
}
export interface Citation {
    label: string;
    url: string;
    retrievalDate: string;
    source: SourceEntry['service'];
    evidenceId?: string;
}
export interface DraftSection {
    heading: string;
    content: string;
    evidenceRefs: EvidenceReference[];
    confirmed: boolean;
}
export interface DocumentDraft {
    id: string;
    title: string;
    sections: DraftSection[];
    disclaimer?: string;
    citations: Citation[];
    styleWarnings?: string[];
    citationWarnings?: string[];
    missingConfirmations?: string[];
}
export interface EvidenceIndex {
    items: EvidenceItem[];
    generatedAt: string;
    sourceManifest: {
        sources: SourceEntry[];
    };
}
export interface SourceManifest {
    entries: SourceEntry[];
    compiledAt: string;
    notes?: string[];
}
export interface EvidenceManifestItem {
    id: string;
    filename: string;
    type: EvidenceType;
    hash: string;
    provenance: EvidenceItem['provenance'];
    credibilityScore?: number;
    date?: string;
}
export interface EvidenceManifest {
    items: EvidenceManifestItem[];
    compiledAt: string;
    notes?: string[];
}
export interface Authority {
    id: string;
    name: string;
    type: 'court' | 'tribunal' | 'regulator';
    jurisdiction: Jurisdiction;
    version: string;
    updatedAt: string;
    updateCadenceDays: number;
    escalationRoutes: string[];
}
export interface SourceAccessPolicy {
    service: 'CanLII' | 'e-Laws' | 'Justice Laws';
    allowedMethods: AccessMethod[];
    blocked?: string[];
    rules?: {
        enforceCurrencyDates?: boolean;
        enforceBilingualText?: boolean;
        blockScraping?: boolean;
    };
}
export interface PackagedFile {
    path: string;
    content: string;
}
export interface DocumentPackage {
    name: string;
    folders: string[];
    files: PackagedFile[];
    sourceManifest: SourceManifest;
    evidenceManifest: EvidenceManifest;
    warnings?: string[];
}
export interface DomainModuleInput {
    classification: MatterClassification;
    forumMap: string;
    timeline: string;
    missingEvidence: string;
    evidenceIndex: EvidenceIndex;
    sourceManifest: SourceManifest;
    evidenceManifest?: EvidenceManifest;
    packageName?: string;
}
export interface DomainModuleOutput {
    drafts: DocumentDraft[];
    package: DocumentPackage;
    warnings?: string[];
}
export interface DomainModule {
    domain: Domain;
    generate(input: DomainModuleInput): DomainModuleOutput;
}
export type AuditEventType = 'source-access' | 'export' | 'deletion' | 'retention-update' | 'legal-hold' | 'other';
export interface AuditEvent {
    id: string;
    type: AuditEventType;
    timestamp: string;
    actor: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface ExportResult {
    exportedAt: string;
    items: string[];
    manifest: SourceManifest;
}
export interface DeletionResult {
    deletedAt: string;
    items: string[];
    legalHoldApplied: boolean;
    status: 'pending' | 'completed' | 'blocked';
    reason?: string;
}
export interface RetentionPolicy {
    days: number;
    legalHold: boolean;
    legalHoldReason?: string;
    updatedAt: string;
}
//# sourceMappingURL=index.d.ts.map