export type Domain =
  | 'insurance'
  | 'landlordTenant'
  | 'employment'
  | 'humanRights'
  | 'civil-negligence'
  | 'municipalPropertyDamage'
  | 'criminal'
  | 'ocppFiling'
  | 'tree-damage'
  | 'estateSuccession'
  | 'consumerProtection'
  | 'legalMalpractice'
  | 'other';
export type Jurisdiction = 'Ontario' | 'Federal' | string;
export type PartyType = 'individual' | 'business' | 'government' | string;
export type EvidenceType = 'PDF' | 'PNG' | 'JPG' | 'EML' | 'MSG' | 'TXT';
export type AccessMethod = 'official-api' | 'official-site' | 'user-provided';

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
    start?: string; // ISO date
    end?: string; // ISO date
    keyDates?: string[]; // ISO dates
  };
  urgency?: 'low' | 'medium' | 'high';
  disputeAmount?: number;
  status?: 'unclassified' | 'classified' | 'needsInfo';
  notes?: string[];
}

export interface TriageOption {
  title: string;
  whenItFits: string;
  tradeoff: string;
}

export interface TriageEnvelope {
  assumption: string;
  whatMattersLegally: string[];
  issueBuckets: string[];
  pivotalQuestion: string;
  practicalOptions: TriageOption[];
  nextSteps24to72h: string[];
  uncertainty: string[];
}

export interface ConversationalClassificationSummary {
  domain: Domain | string;
  jurisdiction: Jurisdiction;
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
  pillarMatches?: string[];
}

export interface ConversationAlternativeDomain {
  domain: Domain | string;
  confidence: number;
}

export type ConversationReviewState =
  | 'needs-clarification'
  | 'ready-for-import'
  | 'needs-human-review';

export type ConversationSessionStatus =
  | 'active'
  | 'readyToImport'
  | 'imported'
  | 'needsReview'
  | 'closed';

export interface ConversationTurnResult {
  classification: ConversationalClassificationSummary;
  followUpQuestions: string[];
  confidence: number;
  confidenceHint?: string;
  confidenceProgressLabel?: string;
  isComplete: boolean;
  reviewState: ConversationReviewState;
  importReadiness: boolean;
  strategicBriefing: TriageEnvelope;
  unresolvedSignals?: string[];
  classificationAlternatives?: ConversationAlternativeDomain[];
}

export interface ConversationTranscriptTurn {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationImportArtifactSummary {
  id: string;
  source: 'llm' | 'fallback' | 'manual';
  readyToImport: boolean;
  createdAt: string;
}

export interface ConversationSessionState extends ConversationTurnResult {
  sessionId: string;
  status: ConversationSessionStatus;
  turnCount: number;
  maxTurns: number;
  latestAssistantMessage?: string;
  transcript: ConversationTranscriptTurn[];
  importArtifact?: ConversationImportArtifactSummary;
  createdAt: string;
  updatedAt: string;
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
  date?: string; // ISO date
  summary?: string;
  provenance: 'user-provided' | 'official-api' | 'official-site';
  hash: string;
  tags?: string[];
  credibilityScore?: number;
}

export interface SourceEntry {
  service: 'CanLII' | 'e-Laws' | 'Justice Laws';
  url: string;
  retrievalDate: string; // ISO date
  version?: string;
}

export interface EvidenceReference {
  evidenceId: string;
  attachmentIndex?: number;
  timestamp?: string; // ISO date
  description?: string;
}

export interface Citation {
  label: string;
  url: string;
  retrievalDate: string; // ISO date
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
  generatedAt: string; // ISO date
  sourceManifest: SourceManifest;
}

export interface SourceManifest {
  entries: SourceEntry[];
  accessLog?: { service: string; method: AccessMethod; timestamp: string }[];
  compiledAt: string; // ISO date
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
  compiledAt: string; // ISO date
  notes?: string[];
}

export interface Authority {
  id: string;
  name: string;
  type: 'court' | 'tribunal' | 'regulator';
  jurisdiction: Jurisdiction;
  version: string;
  updatedAt: string; // ISO date
  updateCadenceDays: number;
  escalationRoutes: string[]; // Authority ids
}

export interface SourceAccessPolicy {
  service: 'CanLII' | 'e-Laws' | 'Justice Laws';
  allowedMethods: AccessMethod[];
  blocked?: string[];
  rules?: {
    enforceCurrencyDates?: boolean;
    enforceBilingualText?: boolean; // Justice Laws
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
  /** Optional free-text description to improve variable extraction */
  description?: string;
  /** Optional form mapping payloads for hybrid document generation */
  formMappings?: Array<{ formId: string; variables: Record<string, any> }>;
  /** Matter identifier for traceability in generated summaries */
  matterId?: string;
}

export interface DomainModuleOutput {
  drafts: DocumentDraft[];
  package: DocumentPackage;
  warnings?: string[];
  ocppValidation?: {
    compliant: boolean;
    errors: string[];
    warnings: string[];
    checklist: string;
  };
}

export interface DomainModule {
  domain: Domain;
  generate(input: DomainModuleInput): DomainModuleOutput;
}

export type AuditEventType =
  | 'source-access'
  | 'export'
  | 'deletion'
  | 'retention-update'
  | 'legal-hold'
  | 'kit-event'
  | 'kit-execution'
  | 'error'
  | 'other';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: string; // ISO date
  actor: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ExportResult {
  exportedAt: string; // ISO date
  items: string[];
  manifest: SourceManifest;
}

export interface DeletionResult {
  deletedAt: string; // ISO date
  items: string[];
  legalHoldApplied: boolean;
  status: 'pending' | 'completed' | 'blocked';
  reason?: string;
}

export interface RetentionPolicy {
  days: number;
  legalHold: boolean;
  legalHoldReason?: string;
  updatedAt: string; // ISO date
}

export type WorkflowTrack =
  | 'ontario-small-claims'
  | 'ontario-superior-simplified'
  | 'ontario-superior-ordinary';

export type WorkflowStatus = 'not-started' | 'in-progress' | 'completed' | 'paused' | 'blocked';

export interface WorkflowStep {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  artifactType: string;
  recommended: boolean;
  tracks?: WorkflowTrack[];
}

export interface WorkflowPhase {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  steps: WorkflowStep[];
}

export interface DecisionGate {
  id: string;
  title: string;
  triggerPhaseId: string;
  questions: string[];
}

export interface WorkflowDefinition {
  id: string;
  version: string;
  jurisdiction: string;
  title: string;
  summary: string;
  phases: WorkflowPhase[];
  gates: DecisionGate[];
}

export interface WorkflowStepState {
  stepId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  artifactIds: string[];
  lastGeneratedAt?: string;
}

export interface WorkflowVerifiedResource {
  id: string;
  title: string;
  kind: 'file' | 'link';
  url: string;
  retrievalDate: string;
  sourceLabel: string;
  note?: string;
  localPath?: string;
}

export interface WorkflowArtifact {
  id: string;
  stepId: string;
  title: string;
  artifactType: string;
  summary: string;
  content: string;
  citations: Citation[];
  verifiedResources: WorkflowVerifiedResource[];
  generatedAt: string;
  source: 'llm' | 'fallback';
}

export interface GateScorecardItem {
  label: string;
  score: number;
  weight: number;
  detail?: string;
}

export interface GateScorecard {
  overall: number;
  items: GateScorecardItem[];
  summary: string;
}

export interface DecisionGateResult {
  gateId: string;
  outcome: 'proceed' | 'pause' | 'stop';
  answers: Record<string, string>;
  rationale: string;
  assessedAt: string;
  scorecard?: GateScorecard;
}

export interface WorkflowRun {
  definitionId: string;
  version: string;
  matterId: string;
  status: WorkflowStatus;
  track: WorkflowTrack;
  currentPhaseId: string;
  stepStates: WorkflowStepState[];
  artifacts: WorkflowArtifact[];
  gateResults: DecisionGateResult[];
  riskNotice: string;
  escalationFlags: string[];
  deadlineSummary: string[];
  costExposureSummary: string[];
  communicationLogItems: string[];
  startedAt: string;
  updatedAt: string;
}

export interface AuthorityCitationBundle {
  entries: SourceEntry[];
  notes?: string[];
}
