import { MatterClassifier } from '../../../src/core/triage/MatterClassifier.js';
import { IntakeAgent, UserResponse } from '../../../src/core/agents/IntakeAgent.js';
import { GuidanceAgent } from '../../../src/core/agents/GuidanceAgent.js';
import {
  ConversationSessionState,
  ConversationSessionStatus,
  ConversationTurnResult,
  Domain,
  MatterClassification,
  TriageEnvelope,
} from '../../../src/core/models/index.js';
import { NuanceExtractor, NuanceFallbackContext } from './nuanceExtractor.js';
import { config } from '../config.js';
import { getModelRouter, TaskType } from '../core/router/ModelRouter.js';
import prisma from '../prisma.js';
import type { PrismaClient } from '@prisma/client';
import type { RouteDecision } from '../core/router/ModelRoute.js';

export interface IntakeHistoryMessage {
  type?: 'system' | 'assistant' | 'user';
  content?: string;
}

export interface NuanceHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface IntakeProcessResult extends ConversationTurnResult {}

interface SessionSeedInput {
  initialUserInput?: string;
  metadata?: Record<string, unknown>;
}

interface SessionLatestContext {
  confidence: number;
  confidenceHint?: string;
  confidenceProgressLabel?: string;
  followUpQuestions: string[];
  isComplete: boolean;
  reviewState: IntakeProcessResult['reviewState'];
  importReadiness: boolean;
  strategicBriefing: TriageEnvelope;
  unresolvedSignals: string[];
  classificationAlternatives?: IntakeProcessResult['classificationAlternatives'];
  latestAssistantMessage?: string;
  maxTurns: number;
}

interface NuanceRespondResult {
  source: 'llm' | 'fallback';
  model?: string;
  assistantMessage: string;
  message: string;
  context: NuanceFallbackContext & {
    source: 'llm' | 'fallback';
    model?: string;
    routeDecision?: RouteDecision;
    readyToImport: boolean;
    importPayload: {
      description: string;
      domain?: string;
      jurisdiction?: string;
      urgency?: 'low' | 'medium' | 'high';
    };
  };
}

type CriminalNuanceContext = 'charged-person' | 'reporting-party' | 'civil-overlap' | 'unclear';

const DEFAULT_SESSION_MAX_TURNS = 4;
const SESSION_NOT_FOUND_ERROR = 'CONVERSATION_SESSION_NOT_FOUND';
const CLARIFIER_ECHO_SIGNAL = 'User repeated clarification prompt without adding facts.';

export class ConversationalOrchestrator {
  private classifier: MatterClassifier;
  private intakeAgent: IntakeAgent;
  private guidanceAgent: GuidanceAgent;
  private nuanceExtractor: NuanceExtractor;
  private prisma: PrismaClient;

  constructor(
    classifier?: MatterClassifier,
    intakeAgent?: IntakeAgent,
    guidanceAgent?: GuidanceAgent,
    nuanceExtractor?: NuanceExtractor,
    prismaClient?: PrismaClient,
  ) {
    this.classifier = classifier ?? new MatterClassifier();
    this.intakeAgent = intakeAgent ?? new IntakeAgent(this.classifier);
    this.guidanceAgent = guidanceAgent ?? new GuidanceAgent();
    this.nuanceExtractor = nuanceExtractor ?? new NuanceExtractor();
    this.prisma = prismaClient ?? prisma;
  }

  async processIntake(userInput: string, conversationHistory: IntakeHistoryMessage[] = []): Promise<IntakeProcessResult> {
    const previousResponses = conversationHistory
      .filter((message) => message.type === 'user')
      .map((message) => message.content || '')
      .filter(Boolean);

    const userRepeatedClarifier = this.isLikelyClarifierEcho(userInput, conversationHistory);

    const fullText = userRepeatedClarifier
      ? previousResponses.join('\n\n')
      : [...previousResponses, userInput].join('\n\n');

    const classification = this.classifier.classifyWithConfidence({
      domainHint: fullText,
      jurisdictionHint: fullText,
      urgencyHint: this.normalizeUrgency(fullText),
    });

    const userTurnCount = previousResponses.length + (userRepeatedClarifier ? 0 : 1);
    const criticalClarifiers = this.getCriticalClarifiers(classification.domain, fullText);
    const generatedFollowUps = this.generateFollowUpQuestions(classification.domain);
    const confidence = this.calculateIntakeConfidence({
      baseConfidence: classification.confidence.overall,
      userTurnCount,
      fullText,
      criticalClarifierCount: criticalClarifiers.length,
      alternativeCount: classification.alternativeDomains?.length || 0,
      userRepeatedClarifier,
    });
    const hasEnoughConversationContext = previousResponses.length >= 2 && fullText.length >= 120;
    const isComplete = criticalClarifiers.length === 0 && (confidence >= 75 || hasEnoughConversationContext);
    const followUpQuestions = isComplete
      ? []
      : Array.from(new Set([...criticalClarifiers, ...generatedFollowUps])).slice(0, 3);
    const confidenceHint = this.buildConfidenceHint({
      confidence,
      nextQuestion: followUpQuestions[0],
      criticalClarifiers,
      userRepeatedClarifier,
    });
    const confidenceProgressLabel = this.buildConfidenceProgressLabel({
      userTurnCount,
      criticalClarifierCount: criticalClarifiers.length,
      isComplete,
    });
    const reviewState: IntakeProcessResult['reviewState'] = isComplete
      ? 'ready-for-import'
      : confidence <= 45
        ? 'needs-human-review'
        : 'needs-clarification';
    const strategicBriefing = await this.buildStrategicBriefing(fullText, classification.domain, classification.jurisdiction, confidence);
    const unresolvedSignals = [
      ...classification.uncertainties.map((uncertainty) => uncertainty.description),
      ...criticalClarifiers.map((question) => `Missing critical clarification: ${question}`),
    ];

    if (userRepeatedClarifier) {
      unresolvedSignals.push(CLARIFIER_ECHO_SIGNAL);
    }

    return {
      classification: {
        domain: classification.domain,
        jurisdiction: classification.jurisdiction,
        urgency: classification.urgency ?? 'medium',
        confidence,
        pillarMatches: (classification as any).pillarMatches,
      },
      followUpQuestions,
      confidence,
      confidenceHint,
      confidenceProgressLabel,
      isComplete,
      reviewState,
      importReadiness: isComplete,
      strategicBriefing,
      unresolvedSignals,
      classificationAlternatives: (classification.alternativeDomains || []).map((candidate) => ({
        domain: candidate.domain,
        confidence: candidate.confidence,
      })),
    };
  }

  buildIntakeAssistantMessage(intakeResult: IntakeProcessResult, lastUserInput = ''): string {
    if (intakeResult.isComplete) {
      return `That helps. I think I have enough to move forward with your options. I’m treating this as a ${intakeResult.classification.domain} matter in ${intakeResult.classification.jurisdiction}.`;
    }

    const nextQuestion = intakeResult.followUpQuestions?.[0];
    const repeatedClarifier = intakeResult.unresolvedSignals?.includes(CLARIFIER_ECHO_SIGNAL);
    const reflectedSnippet = this.reflectUserSnippet(lastUserInput);
    const interpretiveLead = nextQuestion
      ? this.buildInterpretiveLead(nextQuestion, intakeResult.classification.domain, lastUserInput)
      : '';
    const exampleAnswers = nextQuestion
      ? this.buildClarifierExamples(nextQuestion, intakeResult.classification.domain)
      : [];
    if (repeatedClarifier && nextQuestion) {
      return `${interpretiveLead || (reflectedSnippet ? `When you said "${reflectedSnippet}", I still need this in your own words so I do not guess.` : 'I still need this in your own words so I do not guess.')} Please answer: ${nextQuestion}${exampleAnswers.length > 0 ? ` Example answers: ${exampleAnswers.map((example) => `"${example}"`).join(', ')}.` : ''}`;
    }
    if (nextQuestion) {
      return `${interpretiveLead || (reflectedSnippet ? `When you said "${reflectedSnippet}", I was not sure about one detail yet.` : 'I was not sure about one detail yet.')} Please answer: ${nextQuestion}${exampleAnswers.length > 0 ? ` Example answers: ${exampleAnswers.map((example) => `"${example}"`).join(', ')}.` : ''}`;
    }

    return 'Thanks, that helps. I have enough to continue with a focused next step.';
  }

  private calculateIntakeConfidence(params: {
    baseConfidence: number;
    userTurnCount: number;
    fullText: string;
    criticalClarifierCount: number;
    alternativeCount: number;
    userRepeatedClarifier: boolean;
  }): number {
    const {
      baseConfidence,
      userTurnCount,
      fullText,
      criticalClarifierCount,
      alternativeCount,
      userRepeatedClarifier,
    } = params;

    const weightedBase = Math.round(baseConfidence * 0.55);
    const turnBonus = Math.min(18, userTurnCount * 6);
    const detailBonus = Math.min(14, Math.floor(fullText.length / 60) * 3 + (fullText.length >= 120 ? 2 : 0));
    const clarifierBonus = criticalClarifierCount === 0
      ? 18
      : criticalClarifierCount === 1
        ? 10
        : criticalClarifierCount === 2
          ? 4
          : 0;
    const ambiguityPenalty = Math.min(8, alternativeCount * 3);
    const repetitionPenalty = userRepeatedClarifier ? 10 : 0;

    return Math.max(
      20,
      Math.min(96, weightedBase + turnBonus + detailBonus + clarifierBonus - ambiguityPenalty - repetitionPenalty),
    );
  }

  private buildConfidenceHint(params: {
    confidence: number;
    nextQuestion?: string;
    criticalClarifiers: string[];
    userRepeatedClarifier: boolean;
  }): string | undefined {
    const { confidence, nextQuestion, criticalClarifiers, userRepeatedClarifier } = params;

    if (!nextQuestion) {
      return undefined;
    }

    if (userRepeatedClarifier) {
      return 'The score will not move from repeated wording alone. Add one concrete fact such as a date, count, person, or amount.';
    }

    const isCritical = criticalClarifiers.includes(nextQuestion);
    const targetConfidence = Math.min(92, Math.max(confidence + (isCritical ? 12 : 7), 75));

    return isCritical
      ? `This is a key missing fact. A direct answer should move confidence from ${confidence}% to around ${targetConfidence}%.`
      : `This answer should move confidence closer to ${targetConfidence}% if you answer it directly.`;
  }

  private buildConfidenceProgressLabel(params: {
    userTurnCount: number;
    criticalClarifierCount: number;
    isComplete: boolean;
  }): string {
    const { userTurnCount, criticalClarifierCount, isComplete } = params;

    if (isComplete) {
      return 'You have given enough detail to move forward.';
    }

    if (criticalClarifierCount > 0) {
      const confirmedCount = Math.max(0, userTurnCount - 1);
      return `${confirmedCount} key detail${confirmedCount === 1 ? '' : 's'} confirmed • ${criticalClarifierCount} still blocking import.`;
    }

    return 'The main issue is clearer, but one more direct answer would make the path steadier.';
  }

  private reflectUserSnippet(userInput: string): string {
    const normalized = userInput.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return '';
    }

    const words = normalized.split(' ');
    if (words.length <= 12) {
      return normalized;
    }

    return `${words.slice(0, 12).join(' ')}...`;
  }

  private buildInterpretiveLead(question: string, domain: string, userInput: string): string {
    const normalizedQuestion = question.toLowerCase();
    const normalizedInput = userInput.toLowerCase();
    const reflectedSnippet = this.reflectUserSnippet(userInput);

    if (!reflectedSnippet) {
      return '';
    }

    if (domain === 'employment' && normalizedQuestion.includes('what reason did the employer give')) {
      if (normalizedInput.includes('cause')) {
        return `When you said "${reflectedSnippet}", did you mean they accused you of misconduct, poor performance, or something else?`;
      }
      if (normalizedInput.includes('fired') || normalizedInput.includes('terminated')) {
        return `When you said "${reflectedSnippet}", I could not tell whether they said misconduct, restructuring, performance, or no clear reason.`;
      }
    }

    if (domain === 'employment' && normalizedQuestion.includes('how were you dismissed')) {
      return `When you said "${reflectedSnippet}", I still do not know how they told you or when it happened.`;
    }

    if (domain === 'landlordTenant' && (normalizedQuestion.includes('what is the main issue') || normalizedQuestion.includes('what is the specific issue'))) {
      if (normalizedInput.includes('n4') && (normalizedInput.includes('leak') || normalizedInput.includes('repair'))) {
        return `When you said "${reflectedSnippet}", did you mean the main problem is the N4 notice, the repairs, or both together?`;
      }
      return `When you said "${reflectedSnippet}", I could not tell whether the main problem is rent, repairs, eviction pressure, or a mix of those.`;
    }

    if (domain === 'landlordTenant' && normalizedQuestion.includes('tenant or the landlord')) {
      return `When you said "${reflectedSnippet}", I could not tell which side of the tenancy you are on yet.`;
    }

    if (domain === 'criminal' && normalizedQuestion.includes('responding to charges')) {
      return `When you said "${reflectedSnippet}", I could not tell if you are responding to charges, reporting what happened, or dealing with related civil fallout.`;
    }

    if (domain === 'insurance' && normalizedQuestion.includes('what type of insurance')) {
      return `When you said "${reflectedSnippet}", I could not tell whether this is auto, home, disability, or another insurance claim.`;
    }

    if (domain === 'civil-negligence' && normalizedQuestion.includes('who or what entity')) {
      return `When you said "${reflectedSnippet}", I could not tell who you think caused the damage or injury.`;
    }

    return `When you said "${reflectedSnippet}", I was not sure about one detail yet.`;
  }

  private buildClarifierExamples(question: string, domain: string): string[] {
    const normalized = question.toLowerCase();

    if (normalized.includes('how were you dismissed')) {
      return ['I got an email last Friday', 'My manager told me in a meeting on Monday', 'They called me yesterday'];
    }

    if (normalized.includes('when did') || normalized.includes('on what date') || normalized.includes('written notice')) {
      return ['two days ago', 'last Friday', 'March 3'];
    }

    if (normalized.includes('tenant or the landlord')) {
      return ['I am the tenant', 'I am the landlord'];
    }

    if (normalized.includes('what is the main issue') || normalized.includes('specific issue')) {
      return domain === 'landlordTenant'
        ? ['the N4 says rent is unpaid', 'the leak is unsafe', 'both the notice and the repairs']
        : ['the key problem is the notice', 'the key problem is the injury', 'both issues matter'];
    }

    if (normalized.includes('what reason did the employer give')) {
      return ['they said restructuring', 'they said performance', 'they said misconduct'];
    }

    if (normalized.includes('union or non-unionized')) {
      return ['I am in a union', 'I am not unionized'];
    }

    if (normalized.includes('responding to charges')) {
      return ['I was charged', 'I reported the incident', 'I am dealing with a civil case connected to the same events'];
    }

    if (normalized.includes('what type of insurance')) {
      return ['auto insurance', 'home insurance', 'disability insurance'];
    }

    if (normalized.includes('who or what entity')) {
      return ['the landlord', 'the city', 'the other driver'];
    }

    return [];
  }

  private normalizeForComparison(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractAssistantClarifier(content: string): string {
    const markers = ['Please answer:', 'One quick clarification so I can narrow the path:'];
    for (const marker of markers) {
      const idx = content.indexOf(marker);
      if (idx >= 0) {
        const afterMarker = content.slice(idx + marker.length).trim();
        const exampleIdx = afterMarker.indexOf('Example answers:');
        return (exampleIdx >= 0 ? afterMarker.slice(0, exampleIdx) : afterMarker).trim();
      }
    }
    return content.trim();
  }

  private isLikelyClarifierEcho(userInput: string, conversationHistory: IntakeHistoryMessage[]): boolean {
    const normalizedUserInput = this.normalizeForComparison(userInput);
    if (!normalizedUserInput) {
      return false;
    }

    const lastAssistant = [...conversationHistory]
      .reverse()
      .find((message) => message.type === 'assistant' && typeof message.content === 'string' && message.content.trim().length > 0);

    if (!lastAssistant?.content) {
      return false;
    }

    const extractedClarifier = this.extractAssistantClarifier(lastAssistant.content);
    const normalizedClarifier = this.normalizeForComparison(extractedClarifier);

    return normalizedClarifier.length > 0 && normalizedUserInput === normalizedClarifier;
  }

  async createSession(seed: SessionSeedInput = {}): Promise<ConversationSessionState> {
    const createdSession = await this.prisma.conversationSession.create({
      data: {
        status: 'active',
        seedDraftJson: this.stringifyOrNull(seed),
        latestContextJson: JSON.stringify(this.buildBlankSessionContext()),
      },
    });

    return this.hydrateSessionState(createdSession.id);
  }

  async getSessionState(sessionId: string): Promise<ConversationSessionState | null> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    return this.hydrateSessionState(session.id, session);
  }

  async submitIntakeTurn(sessionId: string, userInput: string): Promise<ConversationSessionState> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(SESSION_NOT_FOUND_ERROR);
    }

    const existingTurns = await this.prisma.conversationTurn.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const trimmedInput = userInput.trim();
    const conversationHistory = existingTurns.map((turn) => ({
      type: turn.role as IntakeHistoryMessage['type'],
      content: turn.content,
    }));

    await this.prisma.conversationTurn.create({
      data: {
        sessionId,
        role: 'user',
        content: trimmedInput,
      },
    });

    const intakeResult = await this.processIntake(trimmedInput, conversationHistory);
    const assistantMessage = this.buildIntakeAssistantMessage(intakeResult, trimmedInput);
    const nextTurnCount = existingTurns.length + 2;
    const latestContext: SessionLatestContext = {
      confidence: intakeResult.confidence,
      confidenceHint: intakeResult.confidenceHint,
      confidenceProgressLabel: intakeResult.confidenceProgressLabel,
      followUpQuestions: intakeResult.followUpQuestions,
      isComplete: intakeResult.isComplete,
      reviewState: intakeResult.reviewState,
      importReadiness: intakeResult.importReadiness,
      strategicBriefing: intakeResult.strategicBriefing,
      unresolvedSignals: intakeResult.unresolvedSignals || [],
      classificationAlternatives: intakeResult.classificationAlternatives,
      latestAssistantMessage: assistantMessage,
      maxTurns: DEFAULT_SESSION_MAX_TURNS,
    };

    await this.prisma.conversationTurn.create({
      data: {
        sessionId,
        role: 'assistant',
        content: assistantMessage,
        metadataJson: JSON.stringify({
          classification: intakeResult.classification,
          reviewState: intakeResult.reviewState,
          importReadiness: intakeResult.importReadiness,
        }),
      },
    });

    await this.prisma.conversationImportArtifact.create({
      data: {
        sessionId,
        source: 'fallback',
        importPayloadJson: JSON.stringify({
          description: trimmedInput,
          domain: intakeResult.classification.domain,
          jurisdiction: intakeResult.classification.jurisdiction,
          urgency: intakeResult.classification.urgency,
          confidence: intakeResult.confidence,
        }),
        evidenceChecklistJson: JSON.stringify(intakeResult.followUpQuestions),
        readyToImport: intakeResult.importReadiness,
      },
    });

    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: {
        status: this.mapReviewStateToSessionStatus(intakeResult.reviewState),
        latestClassificationJson: JSON.stringify(intakeResult.classification),
        latestContextJson: JSON.stringify({
          ...latestContext,
          turnCount: nextTurnCount,
          lastUserInput: trimmedInput,
        }),
        latestReviewDecisionJson: JSON.stringify({
          reviewState: intakeResult.reviewState,
          confidence: intakeResult.confidence,
          importReadiness: intakeResult.importReadiness,
        }),
      },
    });

    return this.hydrateSessionState(sessionId);
  }

  isSessionNotFoundError(error: unknown): boolean {
    return error instanceof Error && error.message === SESSION_NOT_FOUND_ERROR;
  }

  private generateFollowUpQuestions(domain: string): string[] {
    const domainPromptMap: Record<string, string> = {
      insurance: 'Insurance (claim denial, coverage dispute)',
      'civil-negligence': 'Civil (personal injury, property damage)',
      criminal: 'Criminal (charges, victim support)',
      employment: 'Employment (hiring, firing, wrongful dismissal)',
      landlordTenant: 'Landlord/Tenant (eviction, rent, repairs)',
      consumerProtection: 'Consumer (refunds, warranties, service issues)',
      legalMalpractice: 'Other (not listed above)',
      municipalPropertyDamage: 'Civil (personal injury, property damage)',
      estateSuccession: 'Other (not listed above)',
      other: 'Other (not listed above)',
    };

    const responses: UserResponse[] = [
      {
        questionId: 'q-domain-nature',
        answer: domainPromptMap[domain] || 'Other (not listed above)',
      },
    ];

    const questions = this.intakeAgent.generateFollowUpQuestions(responses);

    const uniqueQuestions = Array.from(new Set(questions.map((question) => question.question.trim())));
    return uniqueQuestions.slice(0, 3);
  }

  private getCriticalClarifiers(domain: string, fullText: string): string[] {
    const lower = fullText.toLowerCase();
    const clarifiers: string[] = [];

    const hasDate = (text: string) =>
      /\b\d{4}-\d{2}-\d{2}\b/.test(text) ||
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/.test(text) ||
      /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|couple|few)\s+(?:day|days|week|weeks|month|months|year|years)\s+ago\b/.test(text) ||
      /\b(today|yesterday|tomorrow|last\s+(?:day|week|month|year)|this\s+(?:week|month|year)|next\s+(?:week|month|year))\b/.test(text);

    switch (domain) {
      case 'employment': {
        const hasDismissalChannel = ['email', 'letter', 'meeting', 'phone', 'call', 'text', 'slack', 'teams', 'zoom']
          .some((t) => lower.includes(t));
        if (!hasDismissalChannel && !hasDate(lower)) {
          clarifiers.push('How were you dismissed (email, letter, in-person meeting, or phone), and on what date?');
        } else if (!hasDate(lower)) {
          clarifiers.push('On what date were you dismissed or sent the termination message?');
        } else if (!hasDismissalChannel) {
          clarifiers.push('How were you dismissed (email, letter, in-person meeting, or phone)?');
        }
        const hasCause = ['for cause', 'without cause', 'restructuring', 'position eliminated', 'performance', 'misconduct', 'layoff', 'laid off']
          .some((t) => lower.includes(t));
        if (!hasCause) {
          clarifiers.push('What reason did the employer give (for cause, restructuring, performance issue, misconduct, or layoff)?');
        }
        if (!['union', 'unionized', 'non-union', 'collective agreement'].some((t) => lower.includes(t))) {
          clarifiers.push('Are you in a union or non-unionized?');
        }
        if (!['severance', 'release', 'package', 'termination pay', 'signed'].some((t) => lower.includes(t))) {
          clarifiers.push('Did you receive a severance package or release to sign?');
        }
        break;
      }

      case 'criminal': {
        const isVictim = ['victim', 'complainant', 'reported', 'assaulted', 'threatened'].some((t) => lower.includes(t));
        const isAccused = ['charged', 'arrested', 'accused', 'court date', 'bail', 'remand', 'summons'].some((t) => lower.includes(t));
        if (!isVictim && !isAccused) {
          clarifiers.push('Are you responding to charges, reporting the incident, or dealing with related civil fallout from the same events?');
        }
        if (!['assault', 'theft', 'fraud', 'threat', 'mischief', 'dui', 'impaired', 'domestic', 'drug', 'weapons', 'robbery', 'harassment', 'breach'].some((t) => lower.includes(t))) {
          clarifiers.push('What is the nature of the offence or incident (e.g. assault, threat, theft, impaired driving)?');
        }
        if (!hasDate(lower)) {
          clarifiers.push('When did the incident or charge occur?');
        }
        if (isAccused && !['lawyer', 'counsel', 'duty counsel', 'legal aid', 'retained'].some((t) => lower.includes(t))) {
          clarifiers.push('Have you spoken to a lawyer or duty counsel yet, or obtained legal representation?');
        }
        break;
      }

      case 'landlordTenant': {
        const isTenant = ['tenant', 'renter', 'i rent', 'i am renting', 'my landlord'].some((t) => lower.includes(t));
        const isLandlord = ['landlord', 'i own', 'my tenant', 'property owner'].some((t) => lower.includes(t));
        if (!isTenant && !isLandlord) {
          clarifiers.push('Are you the tenant or the landlord in this situation?');
        }
        const hasIssueType = ['evict', 'eviction', 'rent increase', 'repair', 'maintenance', 'deposit', 'harassment', 'arrears', 'notice to vacate', 'lease']
          .some((t) => lower.includes(t));
        if (!hasIssueType) {
          clarifiers.push('What is the specific issue (eviction, rent increase, repairs needed, unpaid rent, or something else)?');
        }
        if (!hasDate(lower)) {
          clarifiers.push('When did this issue begin, or when did you receive any written notice?');
        }
        break;
      }

      case 'civil-negligence': {
        if (!hasDate(lower)) {
          clarifiers.push('When did the incident occur? (This is critical because there is a 2-year limitation period.)');
        }
        const hasParty = ['city', 'municipality', 'owner', 'driver', 'company', 'contractor', 'neighbour', 'store', 'business']
          .some((t) => lower.includes(t));
        if (!hasParty) {
          clarifiers.push('Who or what entity do you believe is responsible for the damage or injury?');
        }
        const hasHarmType = ['injured', 'injury', 'hurt', 'property damage', 'vehicle', 'medical', 'hospital', 'broken', 'lost income']
          .some((t) => lower.includes(t));
        if (!hasHarmType) {
          clarifiers.push('Was anyone physically injured, or is this purely property damage — and do you have an estimate of the amount?');
        }
        break;
      }

      case 'insurance': {
        const hasInsuranceType = ['auto', 'car', 'home', 'health', 'disability', 'life', 'travel', 'property', 'liability']
          .some((t) => lower.includes(t));
        if (!hasInsuranceType) {
          clarifiers.push('What type of insurance is involved (auto, home, health, disability, life, or other)?');
        }
        const hasClaimStatus = ['denied', 'denial', 'rejected', 'delayed', 'underpaid', 'short paid', 'claim submitted', 'filed a claim']
          .some((t) => lower.includes(t));
        if (!hasClaimStatus) {
          clarifiers.push('What happened with your claim — was it denied, delayed, underpaid, or not yet submitted?');
        }
        if (!hasDate(lower)) {
          clarifiers.push('When did you submit the claim or receive the denial letter?');
        }
        break;
      }

      case 'legalMalpractice': {
        const hasMatterType = ['real estate', 'family', 'divorce', 'criminal', 'civil', 'personal injury', 'immigration', 'corporate', 'estate', 'will', 'contract']
          .some((t) => lower.includes(t));
        if (!hasMatterType) {
          clarifiers.push('What type of legal matter was your lawyer handling when the problem occurred?');
        }
        const hasErrorType = ['missed deadline', 'limitation', 'conflict of interest', 'negligent', 'wrong advice', 'failed to appear', 'did not file', 'lost funds']
          .some((t) => lower.includes(t));
        if (!hasErrorType) {
          clarifiers.push('What specifically went wrong (e.g. missed deadline, negligent advice, conflict of interest, or lost funds)?');
        }
        if (!['law society', 'lsuc', 'lso', 'complaint', 'reported', 'lawpro'].some((t) => lower.includes(t))) {
          clarifiers.push('Have you already filed a complaint with the Law Society of Ontario (LSO), or is this the first step?');
        }
        break;
      }

      case 'consumerProtection': {
        const hasDisputeType = ['refund', 'warranty', 'defective', 'not delivered', 'false advertising', 'bait', 'switch', 'chargeback', 'overcharged', 'contract']
          .some((t) => lower.includes(t));
        if (!hasDisputeType) {
          clarifiers.push('What is the nature of the dispute (defective product, non-delivery, false advertising, or billing issue)?');
        }
        if (!['receipt', 'contract', 'invoice', 'email', 'confirmation', 'proof of purchase'].some((t) => lower.includes(t))) {
          clarifiers.push('Do you have documentation such as a receipt, contract, or written confirmation of the transaction?');
        }
        const hasAmountOrBusiness = lower.match(/\$\d+/) || ['business', 'company', 'store', 'vendor', 'retailer', 'contractor'].some((t) => lower.includes(t));
        if (!hasAmountOrBusiness) {
          clarifiers.push('What is the dollar amount in dispute, and who is the business or individual involved?');
        }
        break;
      }

      case 'municipalPropertyDamage': {
        if (!hasDate(lower)) {
          clarifiers.push('What date did the incident occur? (Municipal claims require written notice within 10 days — this is urgent.)');
        }
        const hasLocation = ['sidewalk', 'road', 'street', 'park', 'pothole', 'city property', 'municipal', 'tree', 'intersection', 'crosswalk']
          .some((t) => lower.includes(t));
        if (!hasLocation) {
          clarifiers.push('Where exactly did the incident occur — which street, sidewalk, park, or municipal property?');
        }
        if (!['city', 'municipality', 'town', 'township', 'region', 'county'].some((t) => lower.includes(t))) {
          clarifiers.push('Which city or municipality is responsible for the location where this happened?');
        }
        if (!['notif', 'notice', 'reported', 'contacted the city', 'called 311'].some((t) => lower.includes(t))) {
          clarifiers.push('Have you already notified the municipality in writing? If not, this must be done immediately.');
        }
        break;
      }

      case 'humanRights': {
        const hasGrounds = ['disability', 'race', 'colour', 'ancestry', 'place of origin', 'ethnic', 'religion', 'creed', 'sex', 'gender', 'sexual orientation', 'age', 'marital', 'family status']
          .some((t) => lower.includes(t));
        if (!hasGrounds) {
          clarifiers.push('Which protected ground applies to your situation (disability, race, gender, religion, sexual orientation, age, or other)?');
        }
        const hasContext = ['employment', 'workplace', 'housing', 'accommodation', 'service', 'landlord', 'employer', 'school', 'hospital']
          .some((t) => lower.includes(t));
        if (!hasContext) {
          clarifiers.push('Did this happen in an employment context, housing, or access to a service (like healthcare or education)?');
        }
        if (!hasDate(lower)) {
          clarifiers.push('When did the discriminatory act or last incident occur? (There is a 1-year limitation period to file with the HRTO.)');
        }
        break;
      }

      case 'estateSuccession': {
        const hasRole = ['executor', 'beneficiary', 'heir', 'family member', 'spouse', 'child', 'sibling', 'creditor']
          .some((t) => lower.includes(t));
        if (!hasRole) {
          clarifiers.push('What is your relationship to the deceased — are you a beneficiary, executor, or family member contesting the estate?');
        }
        const hasWillStatus = ['will', 'no will', 'intestate', 'probated', 'probate', 'estate trustee'].some((t) => lower.includes(t));
        if (!hasWillStatus) {
          clarifiers.push('Is there a will, and if so, has it been probated (submitted to the court)?');
        }
        const hasIssueType = ['contesting', 'challenge', 'undue influence', 'capacity', 'executor conduct', 'not distributing', 'missing assets', 'dependent relief']
          .some((t) => lower.includes(t));
        if (!hasIssueType) {
          clarifiers.push('What is the specific concern — contesting the will, executor misconduct, beneficiary dispute, or dependent support?');
        }
        break;
      }
    }

    return clarifiers;
  }

  private normalizeUrgency(urgencyText?: string): 'low' | 'medium' | 'high' | undefined {
    if (!urgencyText) return undefined;

    const value = urgencyText.toLowerCase();
    if (
      value.includes('critical') ||
      value.includes('urgent') ||
      value.includes('high') ||
      value.includes('immediate')
    ) {
      return 'high';
    }

    if (value.includes('low')) {
      return 'low';
    }

    return 'medium';
  }

  private async buildStrategicBriefing(fullText: string, domain: string, jurisdiction: string, confidence?: number): Promise<TriageEnvelope> {
    const templateBriefing = this.buildTemplateBriefing(fullText, domain, jurisdiction);

    if (!config.nuanceLlmEnabled) {
      return templateBriefing;
    }

    try {
      const router = getModelRouter();
      const routePromise = router.route({
        taskType: TaskType.PLAIN_LANGUAGE,
        temperature: 0.3,
        maxTokens: 1024,
        responseFormat: { type: 'json_object' },
        routeContext: {
          confidence,
          urgency: this.normalizeUrgency(fullText),
        },
        messages: [
          {
            role: 'system',
            content: [
              'You are a Canadian legal information assistant. You must not provide legal advice.',
              'You produce a structured strategic triage briefing for a person facing a legal situation.',
              'Base the briefing on the specific facts the user provided — do NOT return generic templates.',
              'Every claim must be grounded in what the user actually said.',
              'Return JSON matching this exact schema:',
              '{',
              '  "assumption": "string — state jurisdiction and key assumption",',
              '  "whatMattersLegally": ["string[] — 2-4 legal realities relevant to THIS situation"],',
              '  "issueBuckets": ["string[] — 2-5 specific legal issues raised by these facts"],',
              '  "pivotalQuestion": "string — the single most important unresolved question",',
              '  "practicalOptions": [{"title": "string", "whenItFits": "string", "tradeoff": "string"}],',
              '  "nextSteps24to72h": ["string[] — 3-5 concrete actions for the next 72 hours"],',
              '  "uncertainty": ["string[] — 2-4 facts that, if different, would change the analysis"]',
              '}',
            ].join('\n'),
          },
          {
            role: 'user',
            content: [
              `Domain: ${domain}`,
              `Jurisdiction: ${jurisdiction}`,
              `User's situation:`,
              fullText,
            ].join('\n'),
          },
        ],
      });

      // Race against a timeout so intake never hangs waiting for a slow model
      const timeoutMs = 30000;
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Briefing LLM timeout')), timeoutMs),
      );
      const llmResponse = await Promise.race([routePromise, timeout]);

      console.log('[briefing-llm] LLM responded via', llmResponse.provider, llmResponse.model);
      const parsed = JSON.parse(llmResponse.content) as Record<string, unknown>;
      return this.validateTriageEnvelope(parsed, templateBriefing);
    } catch (err) {
      console.warn('[briefing-llm] LLM briefing failed, using template fallback:', err instanceof Error ? err.message : String(err));
      return templateBriefing;
    }
  }

  private validateTriageEnvelope(parsed: Record<string, unknown>, fallback: TriageEnvelope): TriageEnvelope {
    const getString = (key: string, fb: string): string => {
      const val = parsed[key];
      return typeof val === 'string' && val.trim() ? val.trim() : fb;
    };

    const getStringArray = (key: string, fb: string[]): string[] => {
      const val = parsed[key];
      if (!Array.isArray(val)) return fb;
      const items = val.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
      return items.length > 0 ? items : fb;
    };

    const getOptions = (fb: TriageEnvelope['practicalOptions']): TriageEnvelope['practicalOptions'] => {
      const val = parsed.practicalOptions;
      if (!Array.isArray(val)) return fb;
      const items = val
        .filter((v): v is Record<string, unknown> => v !== null && typeof v === 'object')
        .map((v) => ({
          title: typeof v.title === 'string' ? v.title : '',
          whenItFits: typeof v.whenItFits === 'string' ? v.whenItFits : '',
          tradeoff: typeof v.tradeoff === 'string' ? v.tradeoff : '',
        }))
        .filter((v) => v.title);
      return items.length > 0 ? items : fb;
    };

    return {
      assumption: getString('assumption', fallback.assumption),
      whatMattersLegally: getStringArray('whatMattersLegally', fallback.whatMattersLegally),
      issueBuckets: getStringArray('issueBuckets', fallback.issueBuckets),
      pivotalQuestion: getString('pivotalQuestion', fallback.pivotalQuestion),
      practicalOptions: getOptions(fallback.practicalOptions),
      nextSteps24to72h: getStringArray('nextSteps24to72h', fallback.nextSteps24to72h),
      uncertainty: getStringArray('uncertainty', fallback.uncertainty),
    };
  }

  private buildTemplateBriefing(fullText: string, domain: string, jurisdiction: string): TriageEnvelope {
    const normalized = fullText.toLowerCase();
    const inOntario = jurisdiction.toLowerCase().includes('ontario');
    const assumption = inOntario
      ? 'Assuming Ontario, Canada and a non-union workplace unless you tell me otherwise.'
      : `Assuming ${jurisdiction} unless you tell me otherwise.`;

    if (domain === 'employment') {
      const mentionsCause =
        normalized.includes('for cause') ||
        normalized.includes('with cause') ||
        normalized.includes('terminated') ||
        normalized.includes('fired');

      return {
        assumption,
        whatMattersLegally: [
          'Employment termination labels from the employer and legal thresholds are not the same thing.',
          'Route selection matters: union grievance, employment standards complaint, or civil wrongful-dismissal path can affect remedies.',
          'Deadlines and evidence quality are usually outcome-defining in early stages.',
        ],
        issueBuckets: [
          'Whether the dismissal characterization is supportable under the governing legal test.',
          'Potential statutory minimum entitlement exposure versus broader common-law exposure.',
          'Benefits eligibility and timeline-sensitive filings.',
          'Human-rights or reprisal dimensions if medical, disability, or protected-rights facts are involved.',
        ],
        pivotalQuestion: mentionsCause
          ? 'Can the employer prove the dismissal met the legal threshold, or is "for cause" only an internal label?'
          : 'Which dismissal route and facts best match what happened, and which forum gives the right remedy?',
        practicalOptions: [
          {
            title: 'Challenge the dismissal characterization',
            whenItFits: 'Use when employer reasons are thin, inconsistent, or unsupported by records.',
            tradeoff: 'Can improve compensation leverage, but requires strong evidence and documentation.',
          },
          {
            title: 'Use standards or administrative complaint pathways',
            whenItFits: 'Use when statutory minimum pay or reprisal issues are central.',
            tradeoff: 'Lower cost and structured process, but remedies may be narrower than civil routes.',
          },
          {
            title: 'Apply for benefits immediately',
            whenItFits: 'Use to protect income continuity while legal route decisions are made.',
            tradeoff: 'Independent adjudication may still require follow-up evidence submissions.',
          },
          {
            title: 'Negotiate early with documented facts',
            whenItFits: 'Use when employer risk is visible and a faster resolution is possible.',
            tradeoff: 'Faster closure, but final numbers depend on leverage and proof quality.',
          },
        ],
        nextSteps24to72h: [
          'Collect and preserve your contract, termination letter, performance history, and message or email trail.',
          'Write a timestamped chronology while memory is fresh and attach supporting records.',
          'Do not sign releases or acknowledgments before legal review.',
          'Document job-search activity and immediate financial impact.',
        ],
        uncertainty: [
          'Unionized versus non-unionized status changes the primary process.',
          'Federally regulated versus provincial employer changes forum options.',
          'Exact employer allegations, prior warnings, and medical evidence can materially change strategy.',
        ],
      };
    }

    return {
      assumption,
      whatMattersLegally: [
        'Correct jurisdiction and forum are required before selecting a legal pathway.',
        'Early evidence quality usually drives leverage, timelines, and available remedies.',
        'Route selection can affect cost, speed, and potential outcomes.',
      ],
      issueBuckets: [
        'Fact pattern and legal category alignment.',
        'Forum selection and process requirements.',
        'Deadline and evidence preservation risk.',
      ],
      pivotalQuestion: 'Which legal forum and pathway best matches your facts and timeline constraints?',
      practicalOptions: [
        {
          title: 'Clarify facts and complete intake',
          whenItFits: 'Use when key details are still missing or ambiguous.',
          tradeoff: 'Improves accuracy, but requires one more intake pass.',
        },
        {
          title: 'Generate a structured action plan',
          whenItFits: 'Use when you need immediate priority steps and evidence checklist.',
          tradeoff: 'Fast orientation, but still needs fact confirmation before filing.',
        },
        {
          title: 'Escalate to legal consultation',
          whenItFits: 'Use when stakes, deadlines, or complexity are high.',
          tradeoff: 'Higher cost, but stronger strategy certainty.',
        },
      ],
      nextSteps24to72h: [
        'Collect core documents and communications connected to the issue.',
        'Capture timeline, parties, and immediate deadlines in writing.',
        'Avoid signing or admitting facts until route review is complete.',
      ],
      uncertainty: [
        'Missing facts can change route and outcome projections.',
        'Forum-specific limitations and deadlines may alter urgency.',
      ],
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Nuance respond
  // ────────────────────────────────────────────────────────────────────

  async processNuanceRespond(
    message: string,
    history: NuanceHistoryEntry[] = [],
  ): Promise<NuanceRespondResult> {
    const priorUserTurns = history
      .filter((e) => e.role === 'user')
      .map((e) => e.content);
    const previousAssistant = [...history]
      .reverse()
      .find((entry) => entry.role === 'assistant')
      ?.content;

    const fullText = [...priorUserTurns, message].join('\n\n').trim();

    const inferred = this.classifier.classifyWithConfidence({
      domainHint: fullText,
      jurisdictionHint: fullText,
      urgencyHint: this.normalizeUrgency(fullText),
    });

    const classification: MatterClassification = {
      id: inferred.id,
      domain: inferred.domain,
      jurisdiction: inferred.jurisdiction,
      parties: inferred.parties,
      timeline: inferred.timeline,
      urgency: inferred.urgency,
      disputeAmount: inferred.disputeAmount,
      status: 'classified',
    };

    const confidence = inferred.confidence.overall;
    const questions = this.buildNuanceQuestions(fullText, classification.domain);
    const incidentSummary = this.buildIncidentSummary(fullText, classification);
    const evidenceChecklist = this.buildEvidenceChecklist(fullText, classification.domain);
    const likelyTrack = this.buildLikelyTrack(fullText, classification);
    const remediationPattern = this.buildRemediationPattern(fullText, classification.domain);
    const directAnswer = this.buildNuanceDirectAnswer(fullText, message, classification, previousAssistant);
    const immediateActions = this.buildNuanceImmediateActions(fullText, classification);
    const escalationCriteria = this.buildNuanceEscalationCriteria(fullText, classification);
    const singleNextQuestion = questions[0];
    const conciseDisclaimer = this.buildNuanceConciseDisclaimer(classification);

    const fallbackContext: NuanceFallbackContext = {
      confidence,
      domain: classification.domain as NuanceFallbackContext['domain'],
      jurisdiction: classification.jurisdiction,
      urgency: classification.urgency,
      scenarioType: this.detectMotorVehicle(fullText) ? 'motor-vehicle-collision' : 'general-incident',
      incidentSummary,
      likelyTrack,
      remediationPattern,
      missingFacts: questions,
      evidenceChecklist,
      directAnswer,
      immediateActions,
      escalationCriteria,
      singleNextQuestion,
      conciseDisclaimer,
      alternativeDomains: (inferred.alternativeDomains || []).slice(0, 3),
    };

    const extracted = await this.nuanceExtractor.extract(fullText, fallbackContext);
    const source = extracted?.source ?? 'fallback';
    const model = extracted?.model;
    const extractedContext = extracted?.context;
    const resolvedDirectAnswer = this.applyNuanceRepetitionGuard(
      extractedContext?.directAnswer ?? directAnswer,
      message,
      previousAssistant,
    );
    const resolvedImmediateActions = (extractedContext?.immediateActions?.length
      ? extractedContext.immediateActions
      : immediateActions).slice(0, 3);
    const resolvedEscalationCriteria = (extractedContext?.escalationCriteria?.length
      ? extractedContext.escalationCriteria
      : escalationCriteria).slice(0, 3);
    const resolvedSingleNextQuestion = extractedContext?.singleNextQuestion || singleNextQuestion;
    const resolvedDisclaimer = extractedContext?.conciseDisclaimer || conciseDisclaimer;
    const readyToImport = extractedContext?.readyToImport ?? (confidence >= 75 || priorUserTurns.length >= 1);
    const assistantMessage = this.buildNuanceAssistantMessage({
      directAnswer: resolvedDirectAnswer,
      immediateActions: resolvedImmediateActions,
      singleNextQuestion: resolvedSingleNextQuestion,
      conciseDisclaimer: resolvedDisclaimer,
    });

    return {
      source,
      model,
      assistantMessage,
      message: assistantMessage,
      context: {
        confidence: extractedContext?.confidence ?? fallbackContext.confidence,
        domain: extractedContext?.domain ?? fallbackContext.domain,
        jurisdiction: extractedContext?.jurisdiction ?? fallbackContext.jurisdiction,
        urgency: extractedContext?.urgency ?? fallbackContext.urgency,
        scenarioType: extractedContext?.scenarioType ?? fallbackContext.scenarioType,
        incidentSummary: extractedContext?.incidentSummary ?? fallbackContext.incidentSummary,
        likelyTrack: extractedContext?.likelyTrack ?? fallbackContext.likelyTrack,
        remediationPattern: extractedContext?.remediationPattern ?? fallbackContext.remediationPattern,
        missingFacts: extractedContext?.missingFacts ?? fallbackContext.missingFacts,
        evidenceChecklist: extractedContext?.evidenceChecklist ?? fallbackContext.evidenceChecklist,
        directAnswer: resolvedDirectAnswer,
        immediateActions: resolvedImmediateActions,
        escalationCriteria: resolvedEscalationCriteria,
        singleNextQuestion: resolvedSingleNextQuestion,
        conciseDisclaimer: resolvedDisclaimer,
        alternativeDomains: extractedContext?.alternativeDomains ?? fallbackContext.alternativeDomains,
        source,
        model,
        routeDecision: extractedContext?.routeDecision,
        readyToImport,
        importPayload: {
          description: extractedContext?.incidentSummary ?? fallbackContext.incidentSummary,
          domain: extractedContext?.domain ?? fallbackContext.domain,
          jurisdiction: extractedContext?.jurisdiction ?? fallbackContext.jurisdiction,
          urgency: extractedContext?.urgency ?? fallbackContext.urgency,
        },
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Guidance generate
  // ────────────────────────────────────────────────────────────────────

  generateGuidance(
    description: string,
    domain?: string,
    jurisdiction?: string,
    urgency?: string,
  ): object {
    const classifierInput = `${description}\n${domain ?? ''}`.trim();

    const inferred = this.classifier.classifyWithConfidence({
      domainHint: classifierInput,
      jurisdictionHint: jurisdiction ?? description,
      urgencyHint: this.normalizeUrgency(urgency),
    });

    const classification: MatterClassification = {
      id: inferred.id,
      domain: this.coerceDomain(domain, inferred.domain),
      jurisdiction: jurisdiction ?? inferred.jurisdiction,
      parties: inferred.parties,
      timeline: inferred.timeline,
      urgency: this.normalizeUrgency(urgency) ?? inferred.urgency,
      disputeAmount: inferred.disputeAmount,
      status: 'classified',
    };

    const guidanceResult = this.guidanceAgent.generateGuidance(classification);
    const actionPlan = guidanceResult.actionPlan;
    const scenarioContext = this.buildScenarioContext(description, classification);

    const recommendedPathway =
      scenarioContext?.primaryPath.title ?? guidanceResult.pathwayOptimization.recommendedPathway;
    const selectionRationale =
      scenarioContext?.legalTrackText ?? guidanceResult.pathwayOptimization.selectionRationale;

    const primarySteps = scenarioContext
      ? [{ title: scenarioContext.primaryPath.title, description: scenarioContext.primaryPath.description }]
      : actionPlan.settlementPathways.slice(0, 3).map((p) => ({ title: p.title, description: p.description }));

    const alternatives = scenarioContext
      ? scenarioContext.alternativePaths.map((p) => ({ title: p.title, description: p.description, pros: [], cons: [] }))
      : guidanceResult.pathwayOptimization.alternativePathways.slice(0, 3).map((p) => ({
          title: p.pathway,
          description: `${p.estimatedTimeframe} · approx. $${p.estimatedCost}`,
          pros: p.pros,
          cons: p.cons,
        }));

    return {
      classification: {
        domain: classification.domain,
        jurisdiction: classification.jurisdiction,
        urgency: classification.urgency,
        confidence: inferred.confidence.overall,
      },
      guidance: {
        acknowledgment: { title: 'Your situation', text: actionPlan.acknowledgment },
        orientation: { title: 'What this means', text: actionPlan.roleExplanation.summary },
        prioritization: {
          title: 'What needs to happen first',
          text: 'Start with these practical steps to protect your position:',
          actions: actionPlan.immediateActions.slice(0, 3).map((s) => ({ title: s.title, description: s.description })),
        },
        guidance: {
          title: 'Your path forward',
          text: 'These are the common pathways in situations like yours:',
          recommendedPathway,
          selectionRationale,
          steps: primarySteps,
          alternatives,
        },
        preparation: {
          title: 'What to expect',
          text: actionPlan.roleExplanation.title,
          timeline: actionPlan.immediateActions[0]?.timeframe ?? 'Varies by forum',
          outcomes: guidanceResult.recommendations.slice(0, 2).map((r) => ({
            title: r.title,
            description: r.description,
          })),
        },
        offer: {
          text: 'I can help you prepare documents, evidence checklists, and next-step plans based on your facts.',
          services: actionPlan.nextStepOffers.map((o) => ({ title: o.title, description: o.description })),
        },
        scenario: scenarioContext,
      },
    };
  }

  private coerceDomain(input: string | undefined, fallback: Domain): Domain {
    if (!input) return fallback;

    const allowed: Domain[] = [
      'insurance',
      'landlordTenant',
      'employment',
      'humanRights',
      'civil-negligence',
      'municipalPropertyDamage',
      'criminal',
      'ocppFiling',
      'tree-damage',
      'estateSuccession',
      'consumerProtection',
      'legalMalpractice',
      'other',
    ];

    return (allowed as string[]).includes(input) ? (input as Domain) : fallback;
  }

  // ────────────────────────────────────────────────────────────────────
  // Private helpers (nuance extraction)
  // ────────────────────────────────────────────────────────────────────

  private detectMotorVehicle(text: string): boolean {
    const lower = text.toLowerCase();
    return [
      'rear-end', 'rear ended', 'rear-ended', 'collision', 'accident',
      'car', 'vehicle', 'truck', 'driver', 'bumper', 'crash', 'crashed', 'auto',
    ].some((kw) => lower.includes(kw));
  }

  private buildNuanceQuestions(description: string, domain: string): string[] {
    if (this.detectMotorVehicle(description)) {
      return [
        'Was anyone injured, or is this only vehicle/property damage?',
        'Did you report it to your insurer or get a claim number yet?',
        'Do you have photos, a collision report number, or repair estimates?',
      ];
    }

    const criticalClarifiers = this.getCriticalClarifiers(domain, description);
    const generatedFollowUps = this.buildDomainFollowUps(domain);

    return Array.from(new Set([...criticalClarifiers, ...generatedFollowUps])).slice(0, 3);
  }

  private buildNuanceDirectAnswer(
    fullText: string,
    latestMessage: string,
    classification: MatterClassification,
    previousAssistant?: string,
  ): string {
    const isUpdate = Boolean(previousAssistant);
    const routeSentence = this.buildNuanceRouteSentence(fullText, classification, isUpdate);

    if (!isUpdate) {
      return routeSentence;
    }

    return `${this.buildNuanceDeltaLead(latestMessage)} ${routeSentence}`;
  }

  private buildNuanceRouteSentence(
    fullText: string,
    classification: MatterClassification,
    isUpdate: boolean,
  ): string {
    const opener = isUpdate ? 'It still looks' : 'This looks';

    if (this.detectMotorVehicle(fullText)) {
      return `${opener} primarily like an insurance-first vehicle damage problem, not a criminal case, unless the facts involve dangerous driving, impairment, leaving the scene, or actual charges.`;
    }

    if (classification.domain === 'employment') {
      return `${opener} primarily like an employment problem, so the main task is to pin down the termination date, the reason given, and the records you already have before choosing a complaint or court path.`;
    }

    if (classification.domain === 'landlordTenant') {
      return `${opener} primarily like a landlord and tenant dispute, so the strongest next move is usually to confirm the notice, the dates, and the written repair or payment record before choosing a filing step.`;
    }

    if (classification.domain === 'criminal') {
      const criminalContext = this.detectCriminalNuanceContext(fullText);

      if (criminalContext === 'charged-person') {
        return `${opener} like a criminal matter where you may be responding to charges. The immediate focus is your court dates, any conditions already in place, and the messages or records tied to the allegation.`;
      }

      if (criminalContext === 'reporting-party') {
        return `${opener} like a reported criminal incident. The immediate focus is preserving evidence, keeping the timeline exact, and tracking any police follow-up.`;
      }

      if (criminalContext === 'civil-overlap') {
        return `${opener} like an overlap between a police-related issue and an active civil dispute. The first job is to avoid missing any live civil deadline while you organize the material tied to the report or allegation.`;
      }

      return `${opener} like a police-related matter, but your role is still not fully clear. The next useful step is to confirm whether you are responding to charges, reporting an incident, or managing related civil fallout.`;
    }

    if (classification.domain === 'civil-negligence' || classification.domain === 'municipalPropertyDamage') {
      return `${opener} primarily like a civil damage or injury matter, so the key questions are who caused the loss, what evidence you have, and whether any notice or filing deadline is already running.`;
    }

    return `${opener} primarily like a ${classification.domain} issue in ${classification.jurisdiction}, and the next useful move is to confirm the missing facts before you commit to one formal path.`;
  }

  private buildNuanceImmediateActions(fullText: string, classification: MatterClassification): string[] {
    if (this.detectMotorVehicle(fullText)) {
      return [
        'Report the collision to your insurer and keep the claim number in one place.',
        'Save scene photos, repair estimates, towing or rental receipts, and adjuster messages together.',
        'Write down the date, location, plate numbers, and any witness names while memory is still fresh.',
      ];
    }

    if (classification.domain === 'employment') {
      return [
        'Save the termination message, contract, pay records, and benefits information together.',
        'Write down the termination date, the reason given, and who delivered it.',
        'Do not sign a release until you understand what rights it would waive.',
      ];
    }

    if (classification.domain === 'landlordTenant') {
      return [
        'Keep the notice, lease, rent record, and repair messages in one dated file.',
        'Photograph the problem and keep a dated log of requests and responses.',
        'Write down the exact notice date or hearing date before choosing a filing step.',
      ];
    }

    if (classification.domain === 'criminal') {
      const criminalContext = this.detectCriminalNuanceContext(fullText);

      if (criminalContext === 'charged-person') {
        return [
          'Write down every court date and every release or no-contact condition already in place.',
          'Keep the messages, call logs, witness details, and sequence of events tied to the allegation.',
          'Track whether you have spoken with a lawyer or duty counsel and what material you still need.',
        ];
      }

      if (criminalContext === 'reporting-party') {
        return [
          'Keep a clean timeline, screenshots, photos, and names of witnesses in one place.',
          'Write down the police file number or officer name if you have one.',
          'Record any safety concern, injury, or ongoing contact so it is not lost later.',
        ];
      }

      if (criminalContext === 'civil-overlap') {
        return [
          'Protect any active civil filing deadline first.',
          'Preserve the messages, pleadings, and alleged false statements in one dated file.',
          'Keep the police report details separate from the civil record so the sequence stays clear.',
        ];
      }

      return [
        'Write down whether you are responding to charges, reporting an incident, or both.',
        'Save any message, screenshot, letter, or notice tied to the event.',
        'Note the incident date and whether police are already involved.',
      ];
    }

    if (classification.domain === 'civil-negligence' || classification.domain === 'municipalPropertyDamage') {
      return [
        'Preserve photos, videos, receipts, repair estimates, and witness names now.',
        'Write down when the incident happened and who you believe caused the loss.',
        'Keep damaged items or detailed photographs before repairs if that is practical.',
      ];
    }

    return [
      'Write down the timeline in plain language while memory is fresh.',
      'Collect the key documents, messages, photos, and receipts in one place.',
      'Flag any date that could become a notice or filing deadline.',
    ];
  }

  private buildNuanceEscalationCriteria(fullText: string, classification: MatterClassification): string[] {
    if (this.detectMotorVehicle(fullText)) {
      return [
        'Escalate quickly if anyone was injured or symptoms are getting worse.',
        'Escalate if the insurer denies coverage, delays the file, or disputes the repair scope.',
        'Escalate if police charges, dangerous driving, or leaving the scene become part of the facts.',
      ];
    }

    if (classification.domain === 'employment') {
      return [
        'Escalate quickly if you were asked to sign a release or severance package right away.',
        'Escalate if discrimination, reprisal, or disability issues are part of the termination.',
        'Escalate if a complaint or limitation deadline is close.',
      ];
    }

    if (classification.domain === 'landlordTenant') {
      return [
        'Escalate quickly if there is a hearing date, lockout risk, or essential service problem.',
        'Escalate if the notice date is close to a filing deadline.',
        'Escalate if the condition of the unit is affecting health or safety.',
      ];
    }

    if (classification.domain === 'criminal') {
      const criminalContext = this.detectCriminalNuanceContext(fullText);

      if (criminalContext === 'charged-person') {
        return [
          'Escalate immediately if you are detained or a court date is imminent.',
          'Escalate if a condition limits contact, housing, or work in a way you do not understand.',
          'Escalate if the allegation overlaps with family, employment, or civil proceedings.',
        ];
      }

      if (criminalContext === 'reporting-party') {
        return [
          'Escalate immediately if there is ongoing danger, stalking, or direct threats.',
          'Escalate if police ask for more evidence or if witness pressure begins.',
          'Escalate if the same facts also affect housing, employment, or a civil deadline.',
        ];
      }

      return [
        'Escalate quickly if a court deadline is already running in another case.',
        'Escalate immediately if there is current danger or an active threat.',
        'Escalate if the issue shifts from an allegation or report to actual charges.',
      ];
    }

    if (classification.domain === 'civil-negligence' || classification.domain === 'municipalPropertyDamage') {
      return [
        'Escalate quickly if the incident date is close to a notice or limitation deadline.',
        'Escalate if the damage is getting repaired before you can document it properly.',
        'Escalate if the loss includes injury, income loss, or a municipality that requires fast written notice.',
      ];
    }

    return [
      'Escalate quickly if a filing deadline is close.',
      'Escalate if the facts are disputed or still changing quickly.',
      'Escalate if the stakes are high enough that a wrong step would be hard to undo.',
    ];
  }

  private buildNuanceConciseDisclaimer(classification: MatterClassification): string {
    return `This is legal information, not legal advice. If the facts are disputed or the next deadline is close in ${classification.jurisdiction}, confirm the next formal step with a lawyer or licensed paralegal.`;
  }

  private buildNuanceAssistantMessage(params: {
    directAnswer: string;
    immediateActions: string[];
    singleNextQuestion?: string;
    conciseDisclaimer: string;
  }): string {
    const parts = [params.directAnswer];

    if (params.immediateActions[0]) {
      parts.push(`Right now, start with: ${params.immediateActions[0]}`);
    }

    if (params.singleNextQuestion) {
      parts.push(`The next detail I need is: ${params.singleNextQuestion}`);
    }

    parts.push(params.conciseDisclaimer);

    return parts.join(' ');
  }

  private buildNuanceDeltaLead(latestMessage: string): string {
    const lower = latestMessage.toLowerCase();

    if (/\b(photo|photos|screenshot|screenshots|video|videos|recording)\b/.test(lower)) {
      return 'That evidence detail helps.';
    }

    if (/\b(today|yesterday|last|date|march|april|may|june|july|august|september|october|november|december|january|february)\b/.test(lower)) {
      return 'That timing detail helps.';
    }

    if (/\b(insurer|insurance|claim|officer|police|court|notice|hearing)\b/.test(lower)) {
      return 'That process detail helps.';
    }

    if (/\$|estimate|invoice|rent|pay|wage|salary|severance/.test(lower)) {
      return 'That amount and record detail helps.';
    }

    return 'That new detail helps narrow the route.';
  }

  private applyNuanceRepetitionGuard(
    candidate: string,
    latestMessage: string,
    previousAssistant?: string,
  ): string {
    if (!previousAssistant) {
      return candidate;
    }

    const overlap = this.calculateTextOverlap(candidate, previousAssistant);
    if (overlap < 0.72) {
      return candidate;
    }

    return `${this.buildNuanceDeltaLead(latestMessage)} I still need one more concrete fact before the route changes in a meaningful way.`;
  }

  private calculateTextOverlap(a: string, b: string): number {
    const first = new Set(this.normalizeForComparison(a).split(' ').filter(Boolean));
    const second = new Set(this.normalizeForComparison(b).split(' ').filter(Boolean));

    if (first.size === 0 || second.size === 0) {
      return 0;
    }

    let intersection = 0;
    for (const token of first) {
      if (second.has(token)) {
        intersection += 1;
      }
    }

    const union = new Set([...first, ...second]).size;
    return union === 0 ? 0 : intersection / union;
  }

  private detectCriminalNuanceContext(text: string): CriminalNuanceContext {
    if (!text.trim()) {
      return 'unclear';
    }

    const lower = text.toLowerCase();
    const accusedSignals = [
      'charged',
      'arrested',
      'accused',
      'bail',
      'release condition',
      'release conditions',
      'summons',
      'remand',
      'duty counsel',
      'disclosure',
      'plea',
      'court date',
    ].filter((term) => lower.includes(term)).length;
    const reportingSignals = [
      'reported',
      'reporting',
      'police report',
      'witness',
      'victim',
      'complainant',
      'threatened me',
      'assaulted me',
      'unsafe',
      'safety',
    ].filter((term) => lower.includes(term)).length;
    const civilSignals = [
      'civil',
      'lawsuit',
      'statement of defence',
      'statement of claim',
      'affidavit',
      'motion',
      'opposing counsel',
      'respond',
      'deadline',
      'false allegation',
      'false report',
      'defamation',
      'malicious',
      'fabricated',
    ].filter((term) => lower.includes(term)).length;

    if (civilSignals > 0 && (accusedSignals > 0 || reportingSignals > 0 || this.hasCivilCriminalSequencingSignal(lower))) {
      return 'civil-overlap';
    }

    if (accusedSignals > reportingSignals && accusedSignals > 0) {
      return 'charged-person';
    }

    if (reportingSignals > 0) {
      return 'reporting-party';
    }

    return 'unclear';
  }

  private hasCivilCriminalSequencingSignal(text: string): boolean {
    const hasCriminalSignal = /(police|criminal|complain|report)/i.test(text);
    const hasCivilProcessSignal = /(civil|opposing counsel|respond|response|deadline|affidavit|motion|lawsuit|statement of defence)/i.test(text);
    const hasOrderingQuestionSignal = /(which|first|before|between)/i.test(text);

    return hasCriminalSignal && hasCivilProcessSignal && hasOrderingQuestionSignal;
  }

  private buildEvidenceChecklist(description: string, domain: string): string[] {
    if (this.detectMotorVehicle(description)) {
      return [
        'Photos of the scene, both vehicles, and plate numbers',
        'Collision report or police occurrence number if one exists',
        'Insurer claim number and adjuster messages',
        'Repair estimates, towing, storage, and rental receipts',
        'Medical notes or missed-work records if anyone was injured',
      ];
    }
    if (domain === 'civil-negligence') {
      return ['Photos of the damage or scene', 'Repair estimates or invoices', 'Witness names or messages', 'A timeline of what happened'];
    }
    if (domain === 'employment') {
      return ['Employment contract or offer letter', 'Termination or discipline documents', 'Recent pay records', 'Relevant emails or texts'];
    }
    if (domain === 'landlordTenant') {
      return ['Lease or tenancy agreement', 'Notices from landlord or tenant', 'Photos and repair records', 'Rent payment records'];
    }
    return ['Timeline of events', 'Relevant documents or messages', 'Photos or receipts if they exist'];
  }

  private buildRemediationPattern(description: string, domain: string): string {
    if (this.detectMotorVehicle(description)) {
      return 'Clarify injuries, insurance status, and available evidence first. Then route into insurance or direct compensation property damage as the primary lane, with civil action only for unresolved or uninsured losses.';
    }
    if (domain === 'employment') return 'Confirm termination/pay details, gather contract and records, then decide between Ministry of Labour, negotiation, or civil claim.';
    if (domain === 'landlordTenant') return 'Clarify the tenancy issue, gather written notices and payment records, then route into the Landlord and Tenant Board process.';
    return 'Clarify the missing facts, gather key records, and then choose the forum or settlement path that fits the confirmed facts.';
  }

  private buildLikelyTrack(description: string, classification: MatterClassification): string {
    if (this.detectMotorVehicle(description)) {
      return classification.domain === 'insurance'
        ? 'Insurance or direct compensation property damage first, with civil action only if losses remain unresolved.'
        : 'Civil evidence review first, with insurance likely still central.';
    }
    if (classification.domain === 'employment') return 'Employment records first, then Ministry of Labour or civil pathway depending on the claim.';
    if (classification.domain === 'landlordTenant') return 'Landlord and Tenant Board process first, supported by written notice and tenancy evidence.';
    return 'Clarify facts, gather evidence, then route into the right forum.';
  }

  private buildIncidentSummary(fullText: string, classification: MatterClassification): string {
    const cleaned = fullText.replace(/\s+/g, ' ').trim();
    if (!cleaned) return 'The user described a legal issue but more facts are still needed.';
    const prefix = this.detectMotorVehicle(fullText) ? 'Motor vehicle collision summary:' : `${classification.domain} matter summary:`;
    return `${prefix} ${cleaned}`;
  }

  private buildAssistantNuanceReply(params: {
    fullText: string;
    classification: MatterClassification;
    confidence: number;
    questions: string[];
  }): string {
    const { fullText, classification, confidence, questions } = params;
    const tail = questions.length > 0 ? `Next, help me with: ${questions.join(' ')}` : '';
    if (this.detectMotorVehicle(fullText)) {
      return [
        "I'm reading this as a motor vehicle collision, and the likely first lane is insurance rather than criminal court.",
        confidence < 85
          ? 'I still need a few specifics to tighten the route and document checklist.'
          : 'I have enough to sketch the likely track and the files you should gather.',
        tail,
      ].filter(Boolean).join(' ');
    }
    return [
      `I'm reading this primarily as a ${classification.domain} issue in ${classification.jurisdiction}.`,
      confidence < 85
        ? 'A few clarification points will make the routing more precise.'
        : 'I have enough to draft a structured intake summary for the app.',
      tail,
    ].filter(Boolean).join(' ');
  }

  private buildScenarioContext(description: string, classification: MatterClassification) {
    if (!this.detectMotorVehicle(description)) return undefined;

    const isCriminalFlagged = /(impaired|dangerous driving|hit and run|hit-and-run|charged|charge|police laid|criminal)/i.test(description);

    return {
      type: 'motor-vehicle',
      title: 'Motor vehicle collision',
      legalTrackTitle: 'Likely legal track',
      legalTrackText: isCriminalFlagged
        ? 'This may involve both an insurance claim and a criminal or police-driven process. Preserve evidence and check whether charges, impairment, dangerous driving, or a hit-and-run are involved.'
        : 'This usually starts as an insurance or DC-PD matter in Ontario, not a criminal case. It becomes criminal only if there was impaired driving, dangerous driving, a hit-and-run, or police charges. A civil claim matters if there are injuries, uninsured losses, or your insurer will not resolve the dispute.',
      firstSteps: [
        'Report the collision to your insurer promptly and keep the claim number.',
        'Preserve photos of the damage, the scene, plate information, and any witness details.',
        'Collect repair estimates, towing receipts, rental car costs, and any medical notes if there are injuries.',
      ],
      fileChecklist: [
        'Photos of both vehicles, the scene, and plate numbers',
        'Collision report or police occurrence number, if one exists',
        'Insurance policy details, claim number, and adjuster communications',
        'Repair estimates, invoices, rental car receipts, towing, and storage receipts',
        'Medical notes, prescriptions, or missed-work records if anyone was injured',
      ],
      primaryPath: {
        title: classification.domain === 'insurance' ? 'Insurance / DC-PD first' : 'Civil claim supported by insurance evidence',
        description: classification.domain === 'insurance'
          ? 'Start with your own insurer, organize the claim file, and document any uninsured out-of-pocket losses separately.'
          : 'Organize the evidence first, then assess whether the issue stays with insurance or needs a civil filing because losses remain unresolved.',
      },
      alternativePaths: [
        { title: 'Civil claim for uncovered losses', description: 'Use this if you have injuries, deductible or rental losses, or other damage that insurance does not resolve.' },
        { title: 'Police or criminal process', description: 'This matters only if the facts involve a hit-and-run, dangerous driving, impairment, or actual charges.' },
      ],
    };
  }

  private buildDomainFollowUps(domain: string): string[] {
    const map: Record<string, string[]> = {
      insurance: ['When did the collision happen, and was anyone injured?', 'Do you have photos, a collision report number, or repair estimates?', 'Have you reported it to your insurer yet?'],
      'civil-negligence': ['When did the accident or damage happen?', 'Were there any witnesses, photos, or repair estimates?', 'Roughly how much money is involved?'],
      criminal: ['Are you responding to charges, reporting the incident, or managing related civil fallout?', 'Is there any immediate safety concern or active court deadline?', 'Do you have incident notes, messages, photos, or police file details?'],
      landlordTenant: ['What is the main rental issue (eviction, rent, repairs)?', 'Do you have a lease and any notices in writing?', 'When did this issue start?'],
      employment: ['Were you terminated, laid off, or did you resign?', 'When did this happen?', 'Do you have your employment contract or termination documents?'],
    };
    return map[domain] ?? ['What happened first, and what happened next?', 'Do you have documents or messages related to this?', 'Is there a deadline coming up soon?'];
  }

  private buildBlankSessionContext(): SessionLatestContext {
    return {
      confidence: 0,
      followUpQuestions: this.intakeAgent.generateInitialQuestions().map((question) => question.question),
      isComplete: false,
      reviewState: 'needs-clarification',
      importReadiness: false,
      strategicBriefing: this.buildTemplateBriefing('', 'other', 'Ontario'),
      unresolvedSignals: ['Main legal issue not yet described.'],
      maxTurns: DEFAULT_SESSION_MAX_TURNS,
    };
  }

  private async hydrateSessionState(sessionId: string, sessionRecord?: Awaited<ReturnType<PrismaClient['conversationSession']['findUnique']>>): Promise<ConversationSessionState> {
    const session = sessionRecord ?? await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(SESSION_NOT_FOUND_ERROR);
    }

    const [turns, latestArtifact] = await Promise.all([
      this.prisma.conversationTurn.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.conversationImportArtifact.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const classification = this.safeParseJson<ConversationSessionState['classification']>(session.latestClassificationJson) ?? {
      domain: 'other',
      jurisdiction: 'Ontario',
      urgency: 'medium',
      confidence: 0,
    };
    const latestContext = this.safeParseJson<SessionLatestContext>(session.latestContextJson) ?? this.buildBlankSessionContext();

    return {
      sessionId: session.id,
      status: this.normalizeSessionStatus(session.status),
      turnCount: turns.length,
      maxTurns: latestContext.maxTurns ?? DEFAULT_SESSION_MAX_TURNS,
      classification,
      followUpQuestions: latestContext.followUpQuestions,
      confidence: latestContext.confidence,
      confidenceHint: latestContext.confidenceHint,
      confidenceProgressLabel: latestContext.confidenceProgressLabel,
      isComplete: latestContext.isComplete,
      reviewState: latestContext.reviewState,
      importReadiness: latestContext.importReadiness,
      strategicBriefing: latestContext.strategicBriefing,
      unresolvedSignals: latestContext.unresolvedSignals,
      classificationAlternatives: latestContext.classificationAlternatives,
      latestAssistantMessage: latestContext.latestAssistantMessage,
      transcript: turns.map((turn) => ({
        id: turn.id,
        role: turn.role as 'system' | 'user' | 'assistant',
        content: turn.content,
        createdAt: turn.createdAt.toISOString(),
        metadata: this.safeParseJson<Record<string, unknown>>(turn.metadataJson),
      })),
      importArtifact: latestArtifact
        ? {
            id: latestArtifact.id,
            source: latestArtifact.source as 'llm' | 'fallback' | 'manual',
            readyToImport: latestArtifact.readyToImport,
            createdAt: latestArtifact.createdAt.toISOString(),
          }
        : undefined,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private mapReviewStateToSessionStatus(reviewState: IntakeProcessResult['reviewState']): ConversationSessionStatus {
    if (reviewState === 'ready-for-import') {
      return 'readyToImport';
    }

    if (reviewState === 'needs-human-review') {
      return 'needsReview';
    }

    return 'active';
  }

  private normalizeSessionStatus(status: string): ConversationSessionStatus {
    if (status === 'readyToImport' || status === 'imported' || status === 'needsReview' || status === 'closed') {
      return status;
    }

    return 'active';
  }

  private safeParseJson<T>(value?: string | null): T | undefined {
    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  private stringifyOrNull(value?: unknown): string | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    if (Object.keys(value as Record<string, unknown>).length === 0) {
      return null;
    }

    return JSON.stringify(value);
  }
}
