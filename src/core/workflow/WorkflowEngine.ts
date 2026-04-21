import {
  AuthorityCitationBundle,
  Citation,
  DecisionGateResult,
  MatterClassification,
  SourceEntry,
  WorkflowArtifact,
  WorkflowDefinition,
  WorkflowPhase,
  WorkflowRun,
  WorkflowStatus,
  WorkflowStep,
  WorkflowStepState,
  WorkflowTrack,
  WorkflowVerifiedResource,
  GateScorecard,
  GateScorecardItem,
} from '../models';
import { ONTARIO_CIVIL_WORKFLOW_DEFINITION } from './OntarioCivilWorkflowDefinition';
import fs from 'fs';
import path from 'path';

interface WorkflowMatterContext {
  matterId: string;
  description: string;
  province: string;
  domain: string;
  disputeAmount?: number | null;
  classification?: MatterClassification | null;
  forumMap?: any;
  evidence?: Array<{ filename: string; mimeType?: string; metadata?: string | null }>;
  documents?: Array<{ packageId: string; packageData?: string | null }>;
}

interface ResearchRequest {
  matter: WorkflowMatterContext;
  query: string;
}

export interface ResearchResponse {
  narrative: string;
  citations: Citation[];
  bundle: AuthorityCitationBundle;
  verifiedResources: WorkflowVerifiedResource[];
  source: 'llm' | 'fallback';
  model?: string;
}

export interface WorkflowLlmRequest {
  matter: WorkflowMatterContext;
  query: string;
  authorityBundle: AuthorityCitationBundle;
  fallbackNarrative: string;
}

export interface WorkflowLlmResult {
  content: string;
  model?: string;
}

export interface WorkflowLlmClient {
  enabled: boolean;
  generateResearchNarrative(request: WorkflowLlmRequest): Promise<WorkflowLlmResult | null>;
}

function isoDate(): string {
  return new Date().toISOString();
}

function normalizeTrack(track?: string): WorkflowTrack {
  if (track === 'ontario-small-claims' || track === 'ontario-superior-simplified' || track === 'ontario-superior-ordinary') {
    return track;
  }
  return 'ontario-small-claims';
}

interface OfficialLinkResource {
  id: string;
  title: string;
  url: string;
  sourceLabel: string;
  note?: string;
}

const OFFICIAL_ONTARIO_LINKS: Record<string, OfficialLinkResource[]> = {
  default: [
    {
      id: 'ontario-court-forms-master',
      title: 'Ontario Court Forms',
      url: 'https://ontariocourtforms.on.ca/en/',
      sourceLabel: 'Ontario Court Forms',
      note: 'Primary hub for Ontario court-based forms.',
    },
    {
      id: 'ontario-cfr-master',
      title: 'Central Forms Repository',
      url: 'https://forms.mgcs.gov.on.ca',
      sourceLabel: 'Central Forms Repository',
      note: 'Primary hub for general Ontario government forms.',
    },
  ],
  'filing-service-checklist': [
    {
      id: 'civil-procedure-forms',
      title: 'Rules of Civil Procedure Forms',
      url: 'https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/',
      sourceLabel: 'Ontario Court Forms',
      note: 'Official Superior Court civil forms hub.',
    },
    {
      id: 'small-claims-forms',
      title: 'Small Claims Court Forms',
      url: 'https://ontariocourtforms.on.ca/en/rules-of-the-small-claims-court-forms/',
      sourceLabel: 'Ontario Court Forms',
      note: 'Official Small Claims Court forms hub.',
    },
  ],
  'pleadings-support': [
    {
      id: 'civil-procedure-forms-pleadings',
      title: 'Rules of Civil Procedure Forms',
      url: 'https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/',
      sourceLabel: 'Ontario Court Forms',
      note: 'Use for statements of claim, affidavits, motions, and civil pleadings.',
    },
    {
      id: 'small-claims-online-filing',
      title: 'Small Claims Court Online Filing',
      url: 'https://www.ontario.ca/page/file-small-claims-court-documents-online',
      sourceLabel: 'Ontario.ca',
      note: 'Official Ontario filing flow for many standard Small Claims documents.',
    },
  ],
  'rule-49-strategy': [
    {
      id: 'civil-procedure-offer-forms',
      title: 'Rules of Civil Procedure Forms',
      url: 'https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/',
      sourceLabel: 'Ontario Court Forms',
      note: 'Official source for Rule 49 offer and acceptance forms.',
    },
  ],
  'pre-trial-brief': [
    {
      id: 'civil-procedure-pretrial-forms',
      title: 'Rules of Civil Procedure Forms',
      url: 'https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/',
      sourceLabel: 'Ontario Court Forms',
      note: 'Use the civil forms hub for pre-trial and scheduling forms.',
    },
  ],
  'costs-submission': [
    {
      id: 'civil-procedure-costs-forms',
      title: 'Rules of Civil Procedure Forms',
      url: 'https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/',
      sourceLabel: 'Ontario Court Forms',
      note: 'Official source for costs-related civil forms and related court documents.',
    },
  ],
  'appeal-workflow': [
    {
      id: 'civil-procedure-appeal-forms',
      title: 'Rules of Civil Procedure Forms',
      url: 'https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/',
      sourceLabel: 'Ontario Court Forms',
      note: 'Official forms hub for notices of appeal and civil appeal materials.',
    },
  ],
};

export class WorkflowEngine {
  constructor(private llmClient?: WorkflowLlmClient) {}

  setLlmClient(llmClient?: WorkflowLlmClient): void {
    this.llmClient = llmClient;
  }

  getDefinitions(): WorkflowDefinition[] {
    return [this.cloneDefinition(ONTARIO_CIVIL_WORKFLOW_DEFINITION)];
  }

  startWorkflow(matter: WorkflowMatterContext, existing?: WorkflowRun | null): WorkflowRun {
    if (existing) {
      return this.refreshDerivedState(matter, existing);
    }

    const definition = this.cloneDefinition(ONTARIO_CIVIL_WORKFLOW_DEFINITION);
    const track = this.selectTrack(matter);
    const filteredPhases = definition.phases.map((phase) => ({
      ...phase,
      status: phase.id === 'phase-7' ? 'in-progress' : 'not-started',
      steps: phase.steps.filter((workflowStep) => !workflowStep.tracks || workflowStep.tracks.includes(track)),
    }));

    const stepStates: WorkflowStepState[] = filteredPhases.flatMap((phase) =>
      phase.steps.map((workflowStep) => ({
        stepId: workflowStep.id,
        status: phase.id === 'phase-7' ? 'in-progress' : 'not-started',
        artifactIds: [],
      })),
    );

    const run: WorkflowRun = {
      definitionId: definition.id,
      version: definition.version,
      matterId: matter.matterId,
      status: 'in-progress',
      track,
      currentPhaseId: 'phase-7',
      stepStates,
      artifacts: [],
      gateResults: [],
      riskNotice: this.buildRiskNotice(matter),
      escalationFlags: this.detectEscalationFlags(matter),
      deadlineSummary: this.buildDeadlineSummary(matter),
      costExposureSummary: this.buildCostSummary(matter),
      communicationLogItems: [],
      startedAt: isoDate(),
      updatedAt: isoDate(),
    };

    return this.refreshDerivedState(matter, run);
  }

  getWorkflow(matter: WorkflowMatterContext, run?: WorkflowRun | null) {
    const workflowRun = this.startWorkflow(matter, run);
    const definition = this.definitionForTrack(workflowRun.track, workflowRun);
    return {
      definition,
      run: workflowRun,
    };
  }

  async generateArtifact(
    matter: WorkflowMatterContext,
    run: WorkflowRun,
    stepId: string,
  ): Promise<{ run: WorkflowRun; artifact: WorkflowArtifact }> {
    const definition = this.definitionForTrack(run.track, run);
    const workflowStep = this.findStep(definition.phases, stepId);
    if (!workflowStep) {
      throw new Error(`Workflow step not found: ${stepId}`);
    }

    const research = await this.research({
      matter,
      query: `${workflowStep.title} ${matter.description}`.trim(),
    });
    const summary = this.buildArtifactSummary(workflowStep, matter);
    const content = this.buildArtifactContent(workflowStep, matter, research.narrative);
    const artifact: WorkflowArtifact = {
      id: `artifact-${workflowStep.id}-${Date.now()}`,
      stepId: workflowStep.id,
      title: workflowStep.title,
      artifactType: workflowStep.artifactType,
      summary,
      content,
      citations: research.citations,
      verifiedResources: this.resolveVerifiedResources(workflowStep, matter),
      generatedAt: isoDate(),
      source: research.source,
    };

    const nextRun: WorkflowRun = {
      ...run,
      artifacts: [...run.artifacts.filter((item) => item.stepId !== stepId), artifact],
      stepStates: run.stepStates.map((item) =>
        item.stepId === stepId
          ? { ...item, status: 'completed', lastGeneratedAt: artifact.generatedAt, artifactIds: [artifact.id] }
          : item
      ),
      updatedAt: isoDate(),
    };

    return {
      run: this.refreshDerivedState(matter, nextRun),
      artifact,
    };
  }

  assessGate(
    matter: WorkflowMatterContext,
    run: WorkflowRun,
    gateId: string,
    answers: Record<string, string>,
  ): { run: WorkflowRun; result: DecisionGateResult } {
    const lowerAnswers = Object.values(answers).join(' ').toLowerCase();
    const completedSteps = new Set(
      run.stepStates
        .filter((item) => item.status === 'completed')
        .map((item) => item.stepId),
    );

    let outcome: 'proceed' | 'pause' | 'stop' = lowerAnswers.includes('stop') || lowerAnswers.includes('expired') || lowerAnswers.includes('wrong')
      ? 'stop'
      : lowerAnswers.includes('pause') || lowerAnswers.includes('uncertain') || lowerAnswers.includes('settle')
      ? 'pause'
      : 'proceed';

    if (gateId === 'gate-3') {
      const missingDiscoveryBaseline = ['affidavit-of-documents', 'document-production'].some((stepId) => !completedSteps.has(stepId));
      if (missingDiscoveryBaseline && outcome === 'proceed') {
        outcome = 'pause';
      }
    }

    if (gateId === 'gate-4') {
      const missingPreTrialBaseline = ['rule-49-offer-strategy', 'pre-trial-conference-preparation'].some((stepId) => !completedSteps.has(stepId));
      if (missingPreTrialBaseline && outcome === 'proceed') {
        outcome = 'pause';
      }
    }

    if (gateId === 'gate-5') {
      if (!completedSteps.has('judgment-analysis') && outcome === 'proceed') {
        outcome = 'pause';
      }
      if (lowerAnswers.includes('accept') && lowerAnswers.includes('judgment')) {
        outcome = 'stop';
      }
    }

    const result: DecisionGateResult = {
      gateId,
      outcome,
      answers,
      rationale: this.buildGateRationale(gateId, outcome, matter),
      assessedAt: isoDate(),
      scorecard: this.buildGateScorecard(gateId, completedSteps),
    };

    const nextRun: WorkflowRun = {
      ...run,
      gateResults: [...run.gateResults.filter((item) => item.gateId !== gateId), result],
      status: outcome === 'stop' ? 'blocked' : outcome === 'pause' ? 'paused' : 'in-progress',
      updatedAt: isoDate(),
    };

    return {
      run: this.refreshDerivedState(matter, nextRun),
      result,
    };
  }

  async research(request: ResearchRequest): Promise<ResearchResponse> {
    const bundle = this.buildAuthorityBundle(request.query);
    const citations = bundle.entries.map((entry, index) => this.toCitation(entry, index));
    const fallbackNarrative = this.buildFallbackResearchNarrative(request.matter, request.query, bundle);

    if (!this.llmClient?.enabled) {
      return {
        narrative: fallbackNarrative,
        citations,
        bundle,
        verifiedResources: this.resolveResearchResources(request.query),
        source: 'fallback',
      };
    }

    try {
      const result = await this.llmClient.generateResearchNarrative({
        matter: request.matter,
        query: request.query,
        authorityBundle: bundle,
        fallbackNarrative,
      });
      const content = result?.content?.trim();

      return {
        narrative: content || fallbackNarrative,
        citations,
        bundle,
        verifiedResources: this.resolveResearchResources(request.query),
        source: content ? 'llm' : 'fallback',
        model: result?.model,
      };
    } catch {
      return {
        narrative: fallbackNarrative,
        citations,
        bundle,
        verifiedResources: this.resolveResearchResources(request.query),
        source: 'fallback',
      };
    }
  }

  private cloneDefinition(definition: WorkflowDefinition): WorkflowDefinition {
    return JSON.parse(JSON.stringify(definition)) as WorkflowDefinition;
  }

  private selectTrack(matter: WorkflowMatterContext): WorkflowTrack {
    const amount = matter.disputeAmount || matter.classification?.disputeAmount || 0;
    if (amount > 200000) {
      return 'ontario-superior-ordinary';
    }
    if (amount > 35000) {
      return 'ontario-superior-simplified';
    }
    return 'ontario-small-claims';
  }

  private definitionForTrack(track: WorkflowTrack, run?: WorkflowRun): WorkflowDefinition {
    const definition = this.cloneDefinition(ONTARIO_CIVIL_WORKFLOW_DEFINITION);
    const phaseStatuses = new Map(run?.stepStates.map((state) => [state.stepId, state.status]) || []);

    definition.phases = definition.phases.map((workflowPhase) => {
      const filteredSteps = workflowPhase.steps.filter((workflowStep) => !workflowStep.tracks || workflowStep.tracks.includes(track));
      const stepStatuses = filteredSteps.map((workflowStep) => phaseStatuses.get(workflowStep.id) || 'not-started');
      const phaseStatus = stepStatuses.every((status) => status === 'completed')
        ? 'completed'
        : stepStatuses.some((status) => status === 'in-progress' || status === 'completed')
        ? 'in-progress'
        : 'not-started';

      return {
        ...workflowPhase,
        status: phaseStatus,
        steps: filteredSteps,
      };
    });

    return definition;
  }

  private refreshDerivedState(matter: WorkflowMatterContext, run: WorkflowRun): WorkflowRun {
    const definition = this.definitionForTrack(run.track, run);
    const currentPhase = definition.phases.find((phase) =>
      phase.steps.some((workflowStep) => {
        const state = run.stepStates.find((stepState) => stepState.stepId === workflowStep.id);
        return state?.status === 'in-progress' || state?.status === 'not-started';
      }),
    ) || definition.phases[definition.phases.length - 1];

    return {
      ...run,
      currentPhaseId: currentPhase?.id || run.currentPhaseId,
      riskNotice: this.buildRiskNotice(matter),
      escalationFlags: this.detectEscalationFlags(matter),
      deadlineSummary: this.buildDeadlineSummary(matter),
      costExposureSummary: this.buildCostSummary(matter),
      updatedAt: isoDate(),
    };
  }

  private findStep(phases: WorkflowPhase[], stepId: string): WorkflowStep | undefined {
    return phases.flatMap((phase) => phase.steps).find((workflowStep) => workflowStep.id === stepId);
  }

  private buildRiskNotice(matter: WorkflowMatterContext): string {
    const amount = matter.disputeAmount || matter.classification?.disputeAmount || 0;
    if (matter.domain === 'criminal' || amount > 50000) {
      return 'Self-representation is high risk for this matter. Procedural mistakes and costs exposure can materially worsen the outcome. Strongly consider a lawyer or limited-scope legal services.';
    }
    return 'This workflow provides legal information and document organization only. Courts expect self-represented litigants to follow the same rules and evidentiary standards as counsel.';
  }

  private detectEscalationFlags(matter: WorkflowMatterContext): string[] {
    const flags: string[] = [];
    const amount = matter.disputeAmount || matter.classification?.disputeAmount || 0;
    const description = matter.description.toLowerCase();

    if (amount > 50000) flags.push('Financial exposure exceeds $50,000.');
    if (description.includes('expert') || description.includes('medical') || description.includes('engineer')) {
      flags.push('Expert evidence may be central.');
    }
    if (description.includes('injunction') || description.includes('urgent relief')) {
      flags.push('Urgent relief or injunction language detected.');
    }
    if (description.includes('lawyer') && description.includes('opponent')) {
      flags.push('Opponent appears to have counsel.');
    }

    return flags;
  }

  private buildDeadlineSummary(matter: WorkflowMatterContext): string[] {
    const summary = ['Confirm limitation periods immediately and calendar every filing and service deadline.'];
    if (matter.domain === 'municipalPropertyDamage') {
      summary.push('Municipal notice requirements may apply on a compressed timeline.');
    }
    if ((matter.disputeAmount || 0) > 35000) {
      summary.push('Track Superior Court scheduling and service deadlines by procedural track.');
    }
    return summary;
  }

  private buildCostSummary(matter: WorkflowMatterContext): string[] {
    const amount = matter.disputeAmount || 0;
    const summary = ['Track filing fees, service costs, transcript costs, and possible adverse costs exposure.'];
    if (amount > 35000) {
      summary.push('Superior Court cost exposure may include partial indemnity or Rule 49 consequences.');
    } else {
      summary.push('Small Claims cost recovery is more limited, but disbursements still matter.');
    }
    return summary;
  }

  private buildAuthorityBundle(query: string): AuthorityCitationBundle {
    const retrievalDate = new Date().toISOString().split('T')[0];
    const entries: SourceEntry[] = [
      {
        service: 'e-Laws',
        url: 'https://www.ontario.ca/laws/regulation/900194',
        retrievalDate,
        version: 'Rules of Civil Procedure',
      },
      {
        service: 'e-Laws',
        url: 'https://www.ontario.ca/laws/statute/02l24',
        retrievalDate,
        version: 'Limitations Act, 2002',
      },
      {
        service: 'CanLII',
        url: `https://www.canlii.org/en/#search/text=${encodeURIComponent(query)}`,
        retrievalDate,
        version: 'Manual search link',
      },
    ];

    return {
      entries,
      notes: ['CanLII free-text search remains a manual-search link because the REST API does not support free-text search.'],
    };
  }

  private resolveVerifiedResources(workflowStep: WorkflowStep, matter: WorkflowMatterContext): WorkflowVerifiedResource[] {
    const resources: WorkflowVerifiedResource[] = [];
    const retrievalDate = new Date().toISOString().split('T')[0];
    const localFiles = this.findLocalFormFiles(workflowStep, matter);

    localFiles.forEach((entry, index) => {
      resources.push({
        id: `file-${workflowStep.id}-${index}`,
        title: entry.filename,
        kind: 'file',
        url: entry.absolutePath,
        localPath: entry.absolutePath,
        retrievalDate,
        sourceLabel: 'Local Ontario Court Forms Cache',
        note: 'Verified official form file cached locally for the user.',
      });
    });

    const linkResources = [
      ...(OFFICIAL_ONTARIO_LINKS[workflowStep.artifactType] || []),
      ...OFFICIAL_ONTARIO_LINKS.default,
    ];

    linkResources.forEach((resource) => {
      if (resources.some((item) => item.url === resource.url)) {
        return;
      }
      resources.push({
        id: resource.id,
        title: resource.title,
        kind: 'link',
        url: resource.url,
        retrievalDate,
        sourceLabel: resource.sourceLabel,
        note: resource.note,
      });
    });

    return resources;
  }

  private resolveResearchResources(query: string): WorkflowVerifiedResource[] {
    const retrievalDate = new Date().toISOString().split('T')[0];
    const resources = [
      ...OFFICIAL_ONTARIO_LINKS.default,
      {
        id: 'canlii-manual-search',
        title: 'CanLII Manual Search',
        url: `https://www.canlii.org/en/#search/text=${encodeURIComponent(query)}`,
        sourceLabel: 'CanLII',
        note: 'Use the official site for manual search because the REST API does not support free-text search.',
      },
    ];

    return resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      kind: 'link',
      url: resource.url,
      retrievalDate,
      sourceLabel: resource.sourceLabel,
      note: resource.note,
    }));
  }

  private findLocalFormFiles(workflowStep: WorkflowStep, matter: WorkflowMatterContext): Array<{ filename: string; absolutePath: string }> {
    const roots = [
      path.resolve(process.cwd(), 'court-forms'),
      path.resolve(process.cwd(), '..', 'court-forms'),
    ];
    const existingRoot = roots.find((candidate) => fs.existsSync(candidate));
    if (!existingRoot) return [];

    const files = fs.readdirSync(existingRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const absolutePath = path.resolve(existingRoot, entry.name);
        const withinRoot = absolutePath.startsWith(`${existingRoot}${path.sep}`) || absolutePath === existingRoot;
        if (!withinRoot) {
          return null;
        }

        return {
          filename: entry.name,
          absolutePath,
        };
      })
      .filter((entry): entry is { filename: string; absolutePath: string } => entry !== null);

    const patterns = this.localFilePatternsForStep(workflowStep, matter);
    return files.filter((entry) => patterns.some((pattern) => pattern.test(entry.filename))).slice(0, 6);
  }

  private localFilePatternsForStep(workflowStep: WorkflowStep, matter: WorkflowMatterContext): RegExp[] {
    if (workflowStep.artifactType === 'filing-service-checklist' || workflowStep.artifactType === 'pleadings-support') {
      if (this.selectTrack(matter) === 'ontario-small-claims') {
        return [/^14a-statement-claim/i, /^16b-affidavit-service/i, /^18a-summons-witness/i];
      }
      return [/^14a-statement-claim/i, /^37a-notice-motion/i, /^49a-offer-settle/i, /^61a-notice-appeal/i];
    }
    if (workflowStep.artifactType === 'rule-49-strategy') {
      return [/^49a-offer-settle/i, /^49c-acceptance-offer/i];
    }
    if (workflowStep.artifactType === 'pre-trial-brief') {
      return [/^76c-notice-readiness-for-pre-trial-conference/i];
    }
    if (workflowStep.artifactType === 'appeal-workflow') {
      return [/^61a-notice-appeal/i, /^61a\.1-notice-appeal/i, /^62a-notice-appeal/i];
    }
    if (workflowStep.artifactType === 'costs-submission') {
      return [/^57a/i, /^58/i];
    }
    return [];
  }

  private toCitation(entry: SourceEntry, index: number): Citation {
    return {
      label: `${entry.service} source ${index + 1}`,
      url: entry.url,
      retrievalDate: entry.retrievalDate,
      source: entry.service,
    };
  }

  private buildFallbackResearchNarrative(
    matter: WorkflowMatterContext,
    query: string,
    bundle: AuthorityCitationBundle,
  ): string {
    return [
      `Research focus: ${query}.`,
      `Matter domain: ${matter.domain}. Jurisdiction: ${matter.province || matter.classification?.jurisdiction || 'Ontario'}.`,
      'Use the official Ontario rules and statutes as the governing authority base, and use CanLII as a manual search surface for supporting cases.',
      bundle.notes?.join(' ') || '',
    ].filter(Boolean).join(' ');
  }

  private buildArtifactSummary(workflowStep: WorkflowStep, matter: WorkflowMatterContext): string {
    return `${workflowStep.title} generated for ${matter.domain} matter in ${matter.province || 'Ontario'} under the ${this.selectTrack(matter)} track.`;
  }

  private buildArtifactContent(workflowStep: WorkflowStep, matter: WorkflowMatterContext, researchNarrative: string): string {
    const metrics = this.deriveWorkflowMetrics(matter);
    const evidenceNames = (matter.evidence || []).map((item) => item.filename).slice(0, 5);
    const generatedSections = this.buildArtifactDetailSections(workflowStep, matter, metrics);
    const lines = [
      `# ${workflowStep.title}`,
      '',
      '## Matter Summary',
      matter.description,
      '',
      '## Workflow Purpose',
      workflowStep.description,
      '',
      '## Current Track',
      this.selectTrack(matter),
      '',
      '## Planning Snapshot',
      `- Dispute amount (reported): $${metrics.disputeAmount.toLocaleString('en-CA')}`,
      `- Evidence files logged: ${metrics.evidenceCount}`,
      `- Generated package/document records: ${metrics.documentCount}`,
      `- Settlement range model (information-only): $${metrics.settlementLow.toLocaleString('en-CA')} - $${metrics.settlementHigh.toLocaleString('en-CA')}`,
      `- Provisional adverse-cost reserve: $${metrics.costReserve.toLocaleString('en-CA')}`,
      '',
      '## Practical Notes',
      researchNarrative,
    ];

    if (evidenceNames.length > 0) {
      lines.push('', '## Available Evidence', ...evidenceNames.map((item) => `- ${item}`));
    }

    if (workflowStep.artifactType === 'limitation-memo') {
      lines.push('', '## Limitation Assessment', 'Confirm the incident date, discovery date, and any statutory override periods before filing.');
    }
    lines.push(...generatedSections);

    lines.push('', '## Disclaimer', 'This artifact provides legal information and workflow support only. It is not legal advice and must be reviewed against the current rules, statutes, and your specific facts before use.');
    return lines.join('\n');
  }

  private deriveWorkflowMetrics(matter: WorkflowMatterContext) {
    const disputeAmount = Math.max(0, matter.disputeAmount || matter.classification?.disputeAmount || 0);
    const evidenceCount = (matter.evidence || []).length;
    const documentCount = (matter.documents || []).length;
    const track = this.selectTrack(matter);
    const settlementLowFactor = track === 'ontario-small-claims' ? 0.55 : 0.5;
    const settlementHighFactor = track === 'ontario-small-claims' ? 0.85 : 0.8;
    const reserveFactor = track === 'ontario-small-claims' ? 0.1 : 0.2;

    return {
      disputeAmount,
      evidenceCount,
      documentCount,
      track,
      settlementLow: Math.round(disputeAmount * settlementLowFactor),
      settlementHigh: Math.round(disputeAmount * settlementHighFactor),
      costReserve: Math.round(disputeAmount * reserveFactor),
    };
  }

  private buildArtifactDetailSections(
    workflowStep: WorkflowStep,
    matter: WorkflowMatterContext,
    metrics: {
      disputeAmount: number;
      evidenceCount: number;
      documentCount: number;
      track: WorkflowTrack;
      settlementLow: number;
      settlementHigh: number;
      costReserve: number;
    },
  ): string[] {
    switch (workflowStep.artifactType) {
      case 'filing-service-checklist':
        return [
          '',
          '## Filing & Service Checklist',
          '- Confirm the correct form and court header.',
          '- Confirm service method and proof of service requirements.',
          '- Confirm filing fees and copies required.',
        ];
      case 'privilege-log':
        return [
          '',
          '## Privilege Review',
          '- Separate solicitor-client, litigation, and settlement privileged materials.',
          '- Do not produce privileged material without a deliberate waiver decision.',
        ];
      case 'litigation-hold-notice':
        return [
          '',
          '## Phase 8.5 Litigation Hold Scope',
          '- Identify custodians: claimant, respondent contacts, adjusters, property managers, and technical witnesses.',
          '- Preserve email, text, cloud storage, device photos, and accounting records relevant to pleaded issues.',
          '- Record hold issuance date, acknowledgement date, and follow-up reminder dates.',
          '- Suspend auto-delete rules for relevant repositories until dispute resolution is complete.',
        ];
      case 'affidavit-of-documents':
        return [
          '',
          '## Phase 8.5 Affidavit of Documents Structure',
          '- Schedule A (in your possession, control, or power and producible): build itemized entries with date/source.',
          '- Schedule B (claimed privilege): list category, date range, and privilege basis without revealing privileged content.',
          '- Schedule C (formerly relevant but unavailable): explain loss/destruction and preservation steps taken.',
          '- Validate that every pleaded issue has at least one linked document or a documented gap rationale.',
        ];
      case 'production-review':
        return [
          '',
          '## Phase 8.5 Production Review Matrix',
          '- Tag productions as supportive, neutral, adverse, or incomplete.',
          '- Flag redactions that may require challenge or clarification.',
          '- Track unanswered production requests with date sent and follow-up due date.',
          `- Current corpus for review: ${metrics.evidenceCount} evidence files and ${metrics.documentCount} package records.`,
        ];
      case 'discovery-prep':
        return [
          '',
          '## Discovery Preparation',
          '- Prepare concise truthful answers tied to documentary references.',
          '- Do not guess or volunteer beyond the question asked.',
          '- Track undertakings separately with due dates and owner.',
        ];
      case 'undertakings-tracker':
        return [
          '',
          '## Phase 8.5 Undertakings Control',
          '- Maintain an undertakings ledger: question reference, commitment text, owner, due date, completion proof.',
          '- Classify each undertaking as informational, documentary, or corrective.',
          '- Escalate any overdue undertaking before pre-trial conference.',
        ];
      case 'proportionality-memo':
        return [
          '',
          '## Phase 8.5 Proportionality Assessment',
          `- Claimed value baseline: $${metrics.disputeAmount.toLocaleString('en-CA')}.`,
          '- Compare expected incremental discovery value against time/cost burden.',
          '- Prioritize targeted requests that materially affect liability, causation, or damages.',
          '- Defer low-value exploratory requests that do not alter likely outcome.',
        ];
      case 'rule-49-strategy':
        return [
          '',
          '## Phase 9.5 Rule 49 Economics Snapshot',
          `- Working settlement range (information-only): $${metrics.settlementLow.toLocaleString('en-CA')} - $${metrics.settlementHigh.toLocaleString('en-CA')}.`,
          `- Provisional adverse-cost reserve: $${metrics.costReserve.toLocaleString('en-CA')}.`,
          '- Evaluate timing of offer delivery relative to evidence milestones and mediation.',
          '- Record expiry mechanics and acceptance workflow in writing.',
        ];
      case 'mediation-brief':
        return [
          '',
          '## Phase 9.5 Mediation Brief Framework',
          '- Liability narrative: strongest 3 facts, weakest 2 facts, and unresolved factual disputes.',
          '- Damages narrative: quantify known losses, mitigation attempts, and remaining uncertainty.',
          '- Negotiation posture: opening range, target range, and walk-away threshold (information-only planning).',
          '- Settlement logistics: who has authority, what terms are mandatory, and release conditions.',
        ];
      case 'pre-trial-brief':
        return [
          '',
          '## Phase 9.5 Pre-Trial Readiness Checks',
          '- Confirm witness order, expected examination length, and exhibit references.',
          '- Identify admissions that could narrow trial issues.',
          '- Document remaining settlement windows and Rule 49 implications.',
          `- Track focus: ${metrics.track}. Ensure procedure aligns with the selected track.`,
        ];
      case 'testimony-prep':
        return [
          '',
          '## Testimony & Cross Plan',
          '- Build witness-by-witness themes with exhibit anchors.',
          '- Prepare likely impeachment points and rehabilitation responses.',
          '- Draft concise objection/response scripts for hearsay, relevance, and foundation issues.',
        ];
      case 'trial-package':
        return [
          '',
          '## Trial Package Controls',
          '- Create a day-by-day hearing plan with witness availability checkpoints.',
          '- Prepare digital and paper exhibit index with consistent numbering.',
          '- Build a same-day update log for rulings, admissions, and document use.',
        ];
      case 'judgment-analysis':
        return [
          '',
          '## Phase 12 Judgment Analysis',
          '- Extract findings on liability, causation, damages, and credibility.',
          '- Separate ratio/holding from non-essential comments.',
          '- Identify unresolved relief items (interest, costs, enforcement direction).',
        ];
      case 'appeal-workflow':
        return [
          '',
          '## Phase 12.5 Appeal Viability Matrix',
          '- Identify potential errors of law, palpable and overriding errors of fact, and procedural fairness issues.',
          '- Confirm appeal/stay filing deadlines from the applicable rules and notices.',
          '- Record stay factors: irreparable harm, balance of convenience, and seriousness of issue.',
        ];
      case 'appellate-record-checklist':
        return [
          '',
          '## Phase 12.5 Appellate Record Scope',
          '- List required transcripts and expected turnaround times.',
          '- Confirm appeal book/compendium index and authorities list ownership.',
          '- Verify exhibit references match trial record numbering.',
        ];
      case 'costs-submission':
        return [
          '',
          '## Phase 12.5 Costs Submission Notes',
          '- Itemize disbursements and link each to a receipt or invoice.',
          '- Explain any Rule 49 consequences and proportionality factors.',
          '- Distinguish recoverable costs from non-recoverable internal overhead.',
        ];
      case 'risk-dashboard':
        return [
          '',
          '## Phase 13 Ongoing Controls',
          '- Update the communication log after every case event.',
          '- Reassess cost exposure and escalation triggers at each decision gate.',
          '- Track compliance with retention/legal hold decisions for litigation records.',
        ];
      default:
        return [];
    }
  }

  private buildGateRationale(gateId: string, outcome: 'proceed' | 'pause' | 'stop', matter: WorkflowMatterContext): string {
    const base = `Gate ${gateId} assessed for ${matter.domain} matter on the ${this.selectTrack(matter)} track.`;
    if (outcome === 'stop') {
      return `${base} The answers indicate a blocking risk that should be escalated before continuing.`;
    }
    if (outcome === 'pause') {
      return `${base} The answers indicate unresolved risk, evidence gaps, or settlement uncertainty that should be reviewed before continuing.`;
    }
    return `${base} The answers support moving to the next phase of the workflow.`;
  }

  private buildGateScorecard(
    gateId: string,
    completedSteps: Set<string>,
  ): GateScorecard | undefined {
    const s = (id: string): number => (completedSteps.has(id) ? 100 : 0);

    if (gateId === 'gate-3') {
      const items: GateScorecardItem[] = [
        { label: 'Affidavit of Documents',  score: s('affidavit-of-documents'),    weight: 25, detail: completedSteps.has('affidavit-of-documents')    ? 'Complete' : 'Incomplete' },
        { label: 'Document Production',      score: s('document-production'),        weight: 25, detail: completedSteps.has('document-production')        ? 'Complete' : 'Incomplete' },
        { label: 'Production Review Matrix', score: s('production-review-matrix'),   weight: 20, detail: completedSteps.has('production-review-matrix')   ? 'Complete' : 'Incomplete' },
        { label: 'Undertakings Tracker',     score: s('undertakings-tracker'),       weight: 15, detail: completedSteps.has('undertakings-tracker')       ? 'Complete' : 'Incomplete' },
        { label: 'Proportionality Memo',     score: s('proportionality-memo'),       weight: 15, detail: completedSteps.has('proportionality-memo')       ? 'Complete' : 'Incomplete' },
      ];
      const overall = Math.round(items.reduce((acc, i) => acc + (i.score * i.weight) / 100, 0));
      return { overall, items, summary: `Discovery readiness score: ${overall}/100` };
    }

    if (gateId === 'gate-4') {
      const items: GateScorecardItem[] = [
        { label: 'Rule 49 Offer Strategy',       score: s('rule-49-offer-strategy'),           weight: 30, detail: completedSteps.has('rule-49-offer-strategy')           ? 'Complete' : 'Incomplete' },
        { label: 'Mandatory Mediation Prep',      score: s('mandatory-mediation-preparation'),  weight: 25, detail: completedSteps.has('mandatory-mediation-preparation')  ? 'Complete' : 'Incomplete' },
        { label: 'Pre-Trial Conference Prep',     score: s('pre-trial-conference-preparation'), weight: 25, detail: completedSteps.has('pre-trial-conference-preparation') ? 'Complete' : 'Incomplete' },
        { label: 'Pre-Trial Brief',               score: s('pre-trial-brief'),                  weight: 20, detail: completedSteps.has('pre-trial-brief')                  ? 'Complete' : 'Incomplete' },
      ];
      const overall = Math.round(items.reduce((acc, i) => acc + (i.score * i.weight) / 100, 0));
      return { overall, items, summary: `Settlement posture score: ${overall}/100` };
    }

    if (gateId === 'gate-5') {
      const items: GateScorecardItem[] = [
        { label: 'Judgment Analysis',           score: s('judgment-analysis'),          weight: 30, detail: completedSteps.has('judgment-analysis')          ? 'Complete' : 'Incomplete' },
        { label: 'Appeal & Stay Workflow',       score: s('appeal-and-stay-workflow'),   weight: 25, detail: completedSteps.has('appeal-and-stay-workflow')   ? 'Complete' : 'Incomplete' },
        { label: 'Appellate Record Checklist',   score: s('appellate-record-checklist'), weight: 25, detail: completedSteps.has('appellate-record-checklist') ? 'Complete' : 'Incomplete' },
        { label: 'Costs Submissions',            score: s('costs-submissions'),          weight: 20, detail: completedSteps.has('costs-submissions')          ? 'Complete' : 'Incomplete' },
      ];
      const overall = Math.round(items.reduce((acc, i) => acc + (i.score * i.weight) / 100, 0));
      return { overall, items, summary: `Appeal viability score: ${overall}/100` };
    }

    return undefined;
  }
}
