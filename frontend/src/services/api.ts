const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface Matter {
  id: string;
  createdAt: string;
  description: string;
  province: string;
  domain: string;
  disputeAmount?: number;
  classification?: string;
  forumMap?: string;
  metadata?: string;
}

export interface Evidence {
  id: string;
  filename: string;
  createdAt: string;
  fileSize: number;
  evidenceIndex?: string;
}

export interface EvidenceGap {
  start: string;
  end: string;
  durationDays: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MissingEvidenceAlert {
  type: 'screenshot' | 'email-original' | 'audio-video' | 'unknown';
  message: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  evidenceId?: string;
  filename?: string;
  type?: string;
  summary?: string;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  gaps: EvidenceGap[];
  alerts: MissingEvidenceAlert[];
  stats?: {
    totalEvidence: number;
    datedEvents: number;
    undatedEvidence: number;
    evidenceTypes: Record<string, number>;
  };
}

export interface ClassificationResult {
  classification: any;
  forumMap: any;
  nextSteps: string[];
  pillar?: string;
  pillarMatches?: string[];
  pillarAmbiguous?: boolean;
  pillarExplanation?: {
    burdenOfProof: string;
    overview: string;
    nextSteps: string[];
  };
  deadlineAlerts?: {
    urgency: 'critical' | 'warning' | 'caution' | 'info';
    daysRemaining: number;
    limitationPeriod: {
      name: string;
      period: string;
      description: string;
      consequence: string;
      learnMoreUrl?: string;
    };
    message: string;
    actionRequired: string;
    encouragement?: string;
  }[];
  ocppWarnings?: string[];
  journey?: {
    currentStage: string;
    percentComplete: number;
    steps: { id: string; label: string; status: string; nextSteps: string[] }[];
  };
  uplBoundaries?: {
    audience: string;
    jurisdiction: string;
    canDo: string[];
    cannotDo: string[];
    safeHarbor: string;
    examples: { request: string; redirect: string }[];
  };
  adviceRedirect?: {
    redirected: boolean;
    message: string;
    options: string[];
    safeHarbor: string;
    tone: 'gentle' | 'firm';
  };
  sandboxPlan?: {
    tier: string;
    label: string;
    rationale: string;
    actions: string[];
    humanReview: { required: boolean; reason?: string; steps: string[] };
    auditTrail: string[];
    controls: string[];
  };
}

export interface NuanceChatContext {
  source: 'llm' | 'fallback';
  model?: string;
  routeDecision?: {
    lane: 'fast-extract' | 'deep-reason' | 'fallback-local';
    provider: string;
    model: string;
    decisionReason: string;
    fallbackCause?: string;
  };
  confidence: number;
  domain: string;
  jurisdiction: string;
  urgency?: 'low' | 'medium' | 'high';
  incidentSummary: string;
  likelyTrack: string;
  remediationPattern: string;
  missingFacts: string[];
  evidenceChecklist: string[];
  directAnswer: string;
  immediateActions: string[];
  escalationCriteria: string[];
  singleNextQuestion?: string;
  conciseDisclaimer: string;
  readyToImport: boolean;
  importPayload: {
    description: string;
    domain: string;
    jurisdiction: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface NuanceChatResponse {
  message: string;
  context: NuanceChatContext;
  disclaimer?: string;
}

export interface MatterPreflightResponse {
  description: string;
  summary: string;
  domain: string;
  jurisdiction: string;
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
  source: 'llm' | 'fallback';
  model?: string;
  routeDecision?: {
    lane: 'fast-extract' | 'deep-reason' | 'fallback-local';
    provider: string;
    model: string;
    decisionReason: string;
    fallbackCause?: string;
  };
  directAnswer?: string;
  likelyTrack?: string;
  evidenceChecklist: string[];
  reviewRecommended: boolean;
}

export interface ProviderSettingsResponse {
  runtimeEditingEnabled: boolean;
  sourceFile: string;
  values: {
    liteLlmBaseUrl: string;
    liteLlmApiKeySet: boolean;
    liteLlmFastProvider: string;
    liteLlmSmartProvider: string;
    liteLlmFastModel: string;
    liteLlmSmartModel: string;
    openaiApiKeySet: boolean;
    openaiBaseUrl: string;
    openaiFastModel: string;
    openaiSmartModel: string;
    anthropicApiKeySet: boolean;
    anthropicBaseUrl: string;
    claudeFastModel: string;
    claudeSmartModel: string;
    geminiApiKeySet: boolean;
    geminiBaseUrl: string;
    geminiFastModel: string;
    geminiSmartModel: string;
    ollamaBaseUrl: string;
    ollamaFastModel: string;
    ollamaSmartModel: string;
    canliiApiKeySet: boolean;
  };
}

export interface ProviderSettingsUpdateRequest {
  canliiApiKey?: string;
  liteLlmBaseUrl?: string;
  liteLlmApiKey?: string;
  liteLlmFastProvider?: string;
  liteLlmSmartProvider?: string;
  liteLlmFastModel?: string;
  liteLlmSmartModel?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiFastModel?: string;
  openaiSmartModel?: string;
  anthropicApiKey?: string;
  anthropicBaseUrl?: string;
  claudeFastModel?: string;
  claudeSmartModel?: string;
  geminiApiKey?: string;
  geminiBaseUrl?: string;
  geminiFastModel?: string;
  geminiSmartModel?: string;
  ollamaBaseUrl?: string;
  ollamaFastModel?: string;
  ollamaSmartModel?: string;
}

export interface WorkflowStep {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  artifactType: string;
  recommended: boolean;
  tracks?: string[];
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

export interface WorkflowCitation {
  label: string;
  url: string;
  retrievalDate: string;
  source: string;
}

export interface WorkflowArtifact {
  id: string;
  stepId: string;
  title: string;
  artifactType: string;
  summary: string;
  content: string;
  citations: WorkflowCitation[];
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

export interface WorkflowStepState {
  stepId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  artifactIds: string[];
  lastGeneratedAt?: string;
}

export interface WorkflowRun {
  definitionId: string;
  version: string;
  matterId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'paused' | 'blocked';
  track: 'ontario-small-claims' | 'ontario-superior-simplified' | 'ontario-superior-ordinary';
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

export interface WorkflowStateResponse {
  definition: WorkflowDefinition;
  run: WorkflowRun;
}

export interface WorkflowArtifactResponse {
  run: WorkflowRun;
  artifact: WorkflowArtifact;
}

export interface WorkflowGateAssessmentResponse {
  run: WorkflowRun;
  result: DecisionGateResult;
}

export interface WorkflowResearchResponse {
  narrative: string;
  citations: WorkflowCitation[];
  bundle: {
    entries: Array<{
      service: string;
      url: string;
      retrievalDate: string;
      version?: string;
    }>;
    notes?: string[];
  };
  verifiedResources: WorkflowVerifiedResource[];
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const err = new Error(error.error || 'Request failed') as any;
      err.details = error.details;
      throw err;
    }

    return response.json();
  }

  // Matters
  async createMatter(data: {
    description: string;
    province: string;
    domain: string;
    disputeAmount?: number;
    structuredAnswers?: any[];
    variables?: Record<string, string | number | boolean>;
  }): Promise<Matter> {
    return this.request<Matter>('/matters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async preflightMatter(data: {
    description: string;
    province: string;
    domain?: string;
    disputeAmount?: number;
  }): Promise<MatterPreflightResponse> {
    return this.request<MatterPreflightResponse>('/matters/preflight', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMatter(id: string): Promise<Matter> {
    return this.request<Matter>(`/matters/${id}`);
  }

  async listMatters(): Promise<Matter[]> {
    return this.request<Matter[]>('/matters');
  }

  async classifyMatter(id: string): Promise<ClassificationResult> {
    return this.request<ClassificationResult>(`/matters/${id}/classify`, {
      method: 'POST',
    });
  }

  async deleteMatter(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/matters/${id}`, {
      method: 'DELETE',
    });
  }

  // Evidence
  async uploadEvidence(
    matterId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ evidence: Evidence; timeline: TimelineEvent[]; gaps: EvidenceGap[]; alerts: MissingEvidenceAlert[]; redactedPreview?: string }> {
    return new Promise((resolve, reject) => {
      const url = `${API_BASE}/evidence/${matterId}`;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (err) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      const fd = new FormData();
      fd.append('file', file);
      xhr.send(fd);
    });
  }

  async listEvidence(matterId: string): Promise<Evidence[]> {
    return this.request<Evidence[]>(`/evidence/${matterId}`);
  }

  async getTimeline(matterId: string): Promise<TimelineResponse> {
    return this.request<TimelineResponse>(`/evidence/${matterId}/timeline`);
  }

  // Documents
  async generateDocuments(
    matterId: string,
    userConfirmedFacts?: string[],
    requestedTemplates?: string[]
  ): Promise<any> {
    return this.request<any>(`/documents/${matterId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ userConfirmedFacts, requestedTemplates }),
    });
  }

  async listDocuments(matterId: string): Promise<any[]> {
    return this.request<any[]>(`/documents/${matterId}/documents`);
  }

  getDraftDownloadUrl(packageId: string, format: 'pdf' | 'word', draftIndex = 0): string {
    const safePackageId = encodeURIComponent(packageId);
    const safeFormat = encodeURIComponent(format);
    const safeDraftIndex = Number.isInteger(draftIndex) && draftIndex >= 0 ? draftIndex : 0;
    return `${API_BASE}/documents/${safePackageId}/download/${safeFormat}?draftIndex=${safeDraftIndex}`;
  }

  async getCourtFormsHealth(thresholdDays: number, refresh = false): Promise<any> {
    const safeThreshold = Number.isFinite(thresholdDays) && thresholdDays > 0 ? Math.floor(thresholdDays) : 30;
    const refreshFlag = refresh ? '1' : '0';
    return this.request<any>(`/export/forms/health?thresholdDays=${safeThreshold}&refresh=${refreshFlag}`);
  }

  // Audit
  async getAuditLog(matterId?: string): Promise<any[]> {
    const query = matterId ? `?matterId=${matterId}` : '';
    return this.request<any[]>(`/audit${query}`);
  }

  async getProviderSettings(): Promise<ProviderSettingsResponse> {
    return this.request<ProviderSettingsResponse>('/settings/providers');
  }

  async updateProviderSettings(payload: ProviderSettingsUpdateRequest): Promise<ProviderSettingsResponse> {
    return this.request<ProviderSettingsResponse>('/settings/providers', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Case Law
  async searchCaselaw(query: string): Promise<any> {
    return this.request<any>(`/caselaw/search?query=${encodeURIComponent(query)}`);
  }

  async getStatuteCitation(title: string, year?: number, section?: string): Promise<any> {
    let url = `/caselaw/statute?title=${encodeURIComponent(title)}`;
    if (year) url += `&year=${year}`;
    if (section) url += `&section=${encodeURIComponent(section)}`;
    return this.request<any>(url);
  }

  async getCourtGuidance(court: string): Promise<any> {
    return this.request<any>(`/caselaw/court-guidance?court=${encodeURIComponent(court)}`);
  }

  async sendNuanceChatMessage(payload: {
    message: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<NuanceChatResponse> {
    return this.request<NuanceChatResponse>('/conversational/nuance/respond', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getWorkflow(matterId: string): Promise<WorkflowStateResponse> {
    return this.request<WorkflowStateResponse>(`/workflows/matters/${matterId}/workflow`);
  }

  async startWorkflow(matterId: string): Promise<WorkflowStateResponse> {
    return this.request<WorkflowStateResponse>(`/workflows/matters/${matterId}/workflow/start`, {
      method: 'POST',
    });
  }

  async generateWorkflowStep(matterId: string, stepId: string): Promise<WorkflowArtifactResponse> {
    return this.request<WorkflowArtifactResponse>(`/workflows/matters/${matterId}/workflow/steps/${stepId}/generate`, {
      method: 'POST',
    });
  }

  async assessWorkflowGate(
    matterId: string,
    gateId: string,
    answers: Record<string, string>
  ): Promise<WorkflowGateAssessmentResponse> {
    return this.request<WorkflowGateAssessmentResponse>(`/workflows/matters/${matterId}/workflow/gates/${gateId}/assess`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async runWorkflowResearch(matterId: string, query: string): Promise<WorkflowResearchResponse> {
    return this.request<WorkflowResearchResponse>(`/workflows/matters/${matterId}/workflow/research`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }
}

export const api = new ApiClient();
