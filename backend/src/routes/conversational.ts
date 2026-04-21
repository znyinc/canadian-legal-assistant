import { Router, Request, Response } from 'express';
import { GuidanceAgent } from '../../../src/core/agents/GuidanceAgent';
import { MatterClassifier } from '../../../src/core/triage/MatterClassifier';
import { LimitationPeriodsEngine } from '../../../src/core/limitation/LimitationPeriodsEngine';
import { CostCalculator } from '../../../src/core/cost/CostCalculator';
import { ActionPlanGenerator } from '../../../src/core/actionPlan/ActionPlanGenerator';
import { AuditLogger } from '../../../src/core/audit/AuditLogger';
import { CitationEnforcer } from '../../../src/core/upl/CitationEnforcer';
import { DisclaimerService } from '../../../src/core/upl/DisclaimerService';
import { Domain, TriageEnvelope } from '../../../src/core/models';
import { config } from '../config.js';
import {
  ConversationalOrchestrator,
  IntakeHistoryMessage,
} from '../services/conversationalOrchestrator.js';

const router = Router();

const classifier = new MatterClassifier();
const limitationEngine = new LimitationPeriodsEngine();
const costCalculator = new CostCalculator();
const actionPlanGenerator = new ActionPlanGenerator();
const guidanceAgent = new GuidanceAgent(
  actionPlanGenerator,
  limitationEngine,
  costCalculator
);
const auditLogger = new AuditLogger();
const citationEnforcer = new CitationEnforcer();
const disclaimerService = new DisclaimerService();
const orchestrator = new ConversationalOrchestrator(classifier, undefined, guidanceAgent);

interface CitationRecord {
  label: string;
  url: string;
  retrievalDate: string;
}

interface LegalClaimsValidation {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildDomainCitations(domain: string, jurisdiction: string): CitationRecord[] {
  const retrievalDate = nowIso();
  const common: CitationRecord[] = [
    {
      label: 'Ontario Court Services - Court and tribunal information',
      url: 'https://www.ontario.ca/page/courts-and-civil-proceedings',
      retrievalDate,
    },
  ];

  if (!jurisdiction.toLowerCase().includes('ontario')) {
    return [
      {
        label: 'Justice Canada - Laws website',
        url: 'https://laws-lois.justice.gc.ca/eng/',
        retrievalDate,
      },
      ...common,
    ];
  }

  const domainSpecific: Record<string, CitationRecord[]> = {
    employment: [
      {
        label: 'Employment Standards Act, 2000 (Ontario)',
        url: 'https://www.ontario.ca/laws/statute/00e41',
        retrievalDate,
      },
      {
        label: 'Ontario Ministry of Labour - Employment standards',
        url: 'https://www.ontario.ca/document/your-guide-employment-standards-act-0',
        retrievalDate,
      },
      {
        label: 'Service Canada - Employment Insurance',
        url: 'https://www.canada.ca/en/services/benefits/ei.html',
        retrievalDate,
      },
    ],
    landlordTenant: [
      {
        label: 'Residential Tenancies Act, 2006 (Ontario)',
        url: 'https://www.ontario.ca/laws/statute/06r17',
        retrievalDate,
      },
      {
        label: 'Landlord and Tenant Board (Ontario)',
        url: 'https://tribunalsontario.ca/ltb/',
        retrievalDate,
      },
    ],
    criminal: [
      {
        label: 'Criminal Code (Canada)',
        url: 'https://laws-lois.justice.gc.ca/eng/acts/C-46/',
        retrievalDate,
      },
      {
        label: 'Ontario Court of Justice',
        url: 'https://www.ontariocourts.ca/ocj/',
        retrievalDate,
      },
    ],
    'civil-negligence': [
      {
        label: 'Limitations Act, 2002 (Ontario)',
        url: 'https://www.ontario.ca/laws/statute/02l24',
        retrievalDate,
      },
      {
        label: 'Ontario Small Claims Court',
        url: 'https://www.ontario.ca/page/suing-someone-small-claims-court',
        retrievalDate,
      },
    ],
    insurance: [
      {
        label: 'Financial Services Regulatory Authority of Ontario',
        url: 'https://www.fsrao.ca/',
        retrievalDate,
      },
      {
        label: 'Government of Ontario - Auto insurance claims',
        url: 'https://www.ontario.ca/page/auto-insurance',
        retrievalDate,
      },
    ],
  };

  return [...(domainSpecific[domain] || []), ...common];
}

function validateLegalClaims(legalTexts: string[], citations: CitationRecord[]): LegalClaimsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const text of legalTexts) {
    const check = citationEnforcer.ensureCitations(text, citations.length > 0);
    errors.push(...check.errors);
    warnings.push(...check.warnings);
  }

  for (const citation of citations) {
    const retrievalCheck = citationEnforcer.verifyRetrieval(citation.retrievalDate);
    errors.push(...retrievalCheck.errors);
    warnings.push(...retrievalCheck.warnings);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function summarizeForum(domain: string, jurisdiction: string): string {
  if (!jurisdiction.toLowerCase().includes('ontario')) {
    return `Primary forum varies by jurisdiction in ${jurisdiction}; verify local court or tribunal.`;
  }

  const forumByDomain: Record<string, string> = {
    employment: 'Ministry of Labour / Small Claims Court / Superior Court (route depends on facts and remedy).',
    landlordTenant: 'Landlord and Tenant Board is usually primary for tenancy disputes.',
    criminal: 'Ontario Court of Justice is usually the primary criminal forum.',
    insurance: 'Insurer process first; FSRA complaints and civil court may apply based on losses.',
    'civil-negligence': 'Small Claims Court or Superior Court depending on claim type and value.',
  };

  return forumByDomain[domain] || 'Forum depends on facts; Ontario court or tribunal routing may apply.';
}

function summarizeDeadlines(domain: string): string[] {
  const byDomain: Record<string, string[]> = {
    employment: [
      'Employment Standards and civil limitation timelines can differ; confirm exact trigger dates.',
      'Apply for EI promptly if income has stopped.',
    ],
    landlordTenant: [
      'LTB forms and notice periods are timeline-sensitive.',
      'Do not ignore tribunal notices or hearing dates.',
    ],
    'civil-negligence': [
      'General Ontario limitation periods may apply; confirm incident and discovery dates.',
      'Preserve evidence immediately while facts are fresh.',
    ],
    insurance: [
      'Insurance reporting and proof-of-loss timelines can apply quickly.',
      'Keep written records of claim communications and response deadlines.',
    ],
  };

  return byDomain[domain] || ['Timeline rules vary by forum; verify any notice or filing deadlines as early as possible.'];
}

function emitNuanceDiagnostics(
  res: Response,
  details: {
    source?: string;
    model?: string;
    domain?: string;
    confidence?: number;
    historyLength: number;
    readyToImport?: boolean;
  },
): void {
  const source = details.source || 'unknown';
  const model = details.model || 'none';

  res.setHeader('X-Conversational-Nuance-Source', source);
  res.setHeader('X-Conversational-Nuance-Model', model);

  if (config.nodeEnv !== 'production') {
    console.info('[conversational:nuance]', JSON.stringify({
      source,
      model,
      domain: details.domain || 'unknown',
      confidence: details.confidence ?? null,
      historyLength: details.historyLength,
      readyToImport: details.readyToImport ?? false,
    }));
  }
}

function buildPromptAlignedOutput(strategicBriefing: TriageEnvelope, domain: string, jurisdiction: string) {
  return {
    Assumption: strategicBriefing.assumption,
    WhatMattersLegally: strategicBriefing.whatMattersLegally,
    LikelyIssueBuckets: strategicBriefing.issueBuckets,
    MyPracticalOptions: strategicBriefing.practicalOptions,
    WhatToDoNow: strategicBriefing.nextSteps24to72h,
    WhereUncertaintyRemains: strategicBriefing.uncertainty,
    KeyDeadlineForum: {
      primaryForum: summarizeForum(domain, jurisdiction),
      deadlineNotes: summarizeDeadlines(domain),
    },
  };
}

function normalizeHistory(conversationHistory: unknown): IntakeHistoryMessage[] {
  if (!Array.isArray(conversationHistory)) {
    return [];
  }

  return conversationHistory
    .map((item) => {
      const typed = item as { type?: string; content?: string };
      const role: IntakeHistoryMessage['type'] =
        typed.type === 'assistant' || typed.type === 'system' ? typed.type : 'user';
      return {
        type: role,
        content: typed.content || '',
      };
    })
    .filter((item) => item.content.length > 0);
}

router.post('/intake/process', async (req: Request, res: Response) => {
  try {
    const userInput = String(req.body?.userInput || '').trim();
    const conversationHistory = normalizeHistory(req.body?.conversationHistory);

    const intakeResult = await orchestrator.processIntake(userInput, conversationHistory);
    const assistantText = orchestrator.buildIntakeAssistantMessage(intakeResult, userInput);
    const citations = buildDomainCitations(
      intakeResult.classification.domain,
      intakeResult.classification.jurisdiction
    );
    const legalClaims = [
      ...intakeResult.strategicBriefing.whatMattersLegally,
      ...intakeResult.strategicBriefing.issueBuckets,
      ...intakeResult.strategicBriefing.nextSteps24to72h,
    ];
    const citationStatus = validateLegalClaims(legalClaims, citations);

    await auditLogger.log('other', 'system', 'Conversational intake processed', {
      stage: intakeResult.isComplete ? 'complete' : 'in-progress',
      confidence: intakeResult.confidence,
      domain: intakeResult.classification.domain,
      reviewState: intakeResult.reviewState,
      importReadiness: intakeResult.importReadiness,
      citationGatePassed: citationStatus.ok,
    });

    res.json({
      message: assistantText,
      ...intakeResult,
      promptAlignedOutput: buildPromptAlignedOutput(
        intakeResult.strategicBriefing,
        intakeResult.classification.domain,
        intakeResult.classification.jurisdiction
      ),
      sourceCitations: citations,
      citationStatus,
      disclaimer: disclaimerService.legalInformationDisclaimer({
        jurisdiction: intakeResult.classification.jurisdiction,
        domain: intakeResult.classification.domain,
      }),
    });
  } catch (error) {
    console.error('Error processing intake:', error);
    res.status(500).json({ error: 'Failed to process intake' });
  }
});

router.post('/intake/stream', async (req: Request, res: Response) => {
  try {
    const userInput = String(req.body?.userInput || '').trim();
    const conversationHistory = normalizeHistory(req.body?.conversationHistory);

    const intakeResult = await orchestrator.processIntake(userInput, conversationHistory);
    const assistantText = orchestrator.buildIntakeAssistantMessage(intakeResult, userInput);
    const citations = buildDomainCitations(
      intakeResult.classification.domain,
      intakeResult.classification.jurisdiction
    );
    const citationStatus = validateLegalClaims(
      intakeResult.strategicBriefing.whatMattersLegally,
      citations
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('meta', {
      classification: intakeResult.classification,
      confidence: intakeResult.confidence,
      confidenceHint: intakeResult.confidenceHint,
      confidenceProgressLabel: intakeResult.confidenceProgressLabel,
      reviewState: intakeResult.reviewState,
      importReadiness: intakeResult.importReadiness,
      strategicBriefing: intakeResult.strategicBriefing,
      promptAlignedOutput: buildPromptAlignedOutput(
        intakeResult.strategicBriefing,
        intakeResult.classification.domain,
        intakeResult.classification.jurisdiction
      ),
      sourceCitations: citations,
      citationStatus,
    });

    const chunks = assistantText.match(/.{1,32}/g) ?? [assistantText];
    for (const chunk of chunks) {
      sendEvent('delta', { chunk });
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    sendEvent('final', {
      message: assistantText,
      ...intakeResult,
      promptAlignedOutput: buildPromptAlignedOutput(
        intakeResult.strategicBriefing,
        intakeResult.classification.domain,
        intakeResult.classification.jurisdiction
      ),
      sourceCitations: citations,
      citationStatus,
      disclaimer: disclaimerService.legalInformationDisclaimer({
        jurisdiction: intakeResult.classification.jurisdiction,
        domain: intakeResult.classification.domain,
      }),
    });

    sendEvent('done', { ok: true });

    await auditLogger.log('other', 'system', 'Conversational intake streamed', {
      stage: intakeResult.isComplete ? 'complete' : 'in-progress',
      confidence: intakeResult.confidence,
      domain: intakeResult.classification.domain,
      reviewState: intakeResult.reviewState,
      importReadiness: intakeResult.importReadiness,
      streamed: true,
      citationGatePassed: citationStatus.ok,
    });

    res.end();
  } catch (error) {
    console.error('Error streaming intake:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream intake' });
      return;
    }

    res.write('event: error\n');
    res.write(`data: ${JSON.stringify({ error: 'Failed to stream intake' })}\n\n`);
    res.end();
  }
});

router.post('/nuance/respond', async (req: Request, res: Response) => {
  try {
    const message = String(req.body?.message || '').trim();
    const history = Array.isArray(req.body?.history)
      ? req.body.history
          .map((item: unknown) => {
            const typed = item as { role?: string; content?: string };
            const role = typed.role === 'assistant' ? 'assistant' : 'user';
            return {
              role,
              content: String(typed.content || '').trim(),
            };
          })
          .filter((item: { role: 'user' | 'assistant'; content: string }) => item.content.length > 0)
      : [];

    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const rawPayload = await orchestrator.processNuanceRespond(message, history);

    const payload = {
      ...rawPayload,
      message: rawPayload.message || rawPayload.assistantMessage || '',
      context: rawPayload.context
        ? {
            ...rawPayload.context,
            readyToImport:
              rawPayload.context.readyToImport || (rawPayload.context.confidence || 0) >= 75,
          }
        : undefined,
      disclaimer: rawPayload.context?.conciseDisclaimer,
    };

    emitNuanceDiagnostics(res, {
      source: payload.context?.source,
      model: payload.context?.model,
      domain: payload.context?.domain,
      confidence: payload.context?.confidence,
      historyLength: history.length,
      readyToImport: payload.context?.readyToImport,
    });

    await auditLogger.log('other', 'system', 'Conversational nuance responded', {
      historyLength: history.length,
      source: payload.context?.source || 'unknown',
      model: payload.context?.model || 'none',
      domain: payload.context?.domain || 'unknown',
      confidence: payload.context?.confidence || 0,
      readyToImport: payload.context?.readyToImport || false,
    });

    res.json(payload);
  } catch (error) {
    console.error('Error generating nuance response:', error);
    res.status(500).json({ error: 'Failed to generate nuance response' });
  }
});

router.post('/guidance/generate', async (req: Request, res: Response) => {
  try {
    const description = String(req.body?.description || '').trim();
    const domain = typeof req.body?.domain === 'string' ? req.body.domain : undefined;
    const jurisdiction = typeof req.body?.jurisdiction === 'string' ? req.body.jurisdiction : undefined;
    const urgency = typeof req.body?.urgency === 'string' ? req.body.urgency : undefined;

    const payload = orchestrator.generateGuidance(description, domain, jurisdiction, urgency) as {
      classification: { domain: Domain | string; jurisdiction: string; urgency: string; confidence: number };
      guidance: {
        acknowledgment: { title: string; text: string };
        orientation: { title: string; text: string };
        prioritization: { title: string; text: string; actions: Array<{ title: string; description: string }> };
        guidance: {
          title: string;
          text: string;
          recommendedPathway: string;
          selectionRationale: string;
          steps: Array<{ title: string; description: string }>;
          alternatives: Array<{ title: string; description: string; pros?: string[]; cons?: string[] }>;
        };
        preparation: { title: string; text: string; timeline: string; outcomes: Array<{ title: string; description: string }> };
        offer: { text: string; services: Array<{ title: string; description: string }> };
        scenario?: unknown;
      };
    };

    const citations = buildDomainCitations(payload.classification.domain, payload.classification.jurisdiction);
    const legalClaims = [
      payload.guidance.orientation.text,
      payload.guidance.guidance.selectionRationale,
      payload.guidance.preparation.text,
      ...payload.guidance.guidance.steps.map((step) => step.description),
    ];
    const citationStatus = validateLegalClaims(legalClaims, citations);

    await auditLogger.log('other', 'system', 'Conversational guidance generated', {
      domain: payload.classification.domain,
      jurisdiction: payload.classification.jurisdiction,
      guidanceType: 'conversational',
      citationGatePassed: citationStatus.ok,
    });

    res.json({
      ...payload,
      sourceCitations: citations,
      citationStatus,
      disclaimer: disclaimerService.legalInformationDisclaimer({
        jurisdiction: payload.classification.jurisdiction,
        domain: String(payload.classification.domain),
      }),
    });
  } catch (error) {
    console.error('Error generating guidance:', error);
    res.status(500).json({ error: 'Failed to generate guidance' });
  }
});

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const initialUserInput = typeof req.body?.initialUserInput === 'string'
      ? req.body.initialUserInput.trim()
      : '';
    const metadata = typeof req.body?.metadata === 'object' && req.body.metadata !== null
      ? (req.body.metadata as Record<string, unknown>)
      : undefined;

    const session = await orchestrator.createSession({
      initialUserInput,
      metadata,
    });

    const result = initialUserInput
      ? await orchestrator.submitIntakeTurn(session.sessionId, initialUserInput)
      : session;

    await auditLogger.log('other', 'system', 'Conversational session created', {
      sessionId: result.sessionId,
      hasInitialInput: initialUserInput.length > 0,
      status: result.status,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating conversational session:', error);
    res.status(500).json({ error: 'Failed to create conversational session' });
  }
});

router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await orchestrator.getSessionState(req.params.sessionId);
    if (!session) {
      res.status(404).json({ error: 'Conversation session not found' });
      return;
    }

    res.json(session);
  } catch (error) {
    console.error('Error retrieving conversational session:', error);
    res.status(500).json({ error: 'Failed to retrieve conversational session' });
  }
});

router.post('/sessions/:sessionId/turn', async (req: Request, res: Response) => {
  try {
    const userInput = String(req.body?.userInput || '').trim();
    if (!userInput) {
      res.status(400).json({ error: 'userInput is required' });
      return;
    }

    const state = await orchestrator.submitIntakeTurn(req.params.sessionId, userInput);
    res.json(state);
  } catch (error) {
    if (orchestrator.isSessionNotFoundError(error)) {
      res.status(404).json({ error: 'Conversation session not found' });
      return;
    }

    console.error('Error submitting conversational turn:', error);
    res.status(500).json({ error: 'Failed to submit conversational turn' });
  }
});

router.get('/sessions/:sessionId/review', async (req: Request, res: Response) => {
  try {
    const session = await orchestrator.getSessionState(req.params.sessionId);
    if (!session) {
      res.status(404).json({ error: 'Conversation session not found' });
      return;
    }

    res.json({
      sessionId: session.sessionId,
      status: session.status,
      reviewState: session.reviewState,
      importReadiness: session.importReadiness,
      confidence: session.confidence,
      unresolvedSignals: session.unresolvedSignals || [],
      maxTurns: session.maxTurns,
      turnCount: session.turnCount,
    });
  } catch (error) {
    console.error('Error retrieving review state:', error);
    res.status(500).json({ error: 'Failed to retrieve review state' });
  }
});

router.get('/sessions/:sessionId/stream', async (req: Request, res: Response) => {
  try {
    const session = await orchestrator.getSessionState(req.params.sessionId);
    if (!session) {
      res.status(404).json({ error: 'Conversation session not found' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write('event: snapshot\n');
    res.write(`data: ${JSON.stringify(session)}\n\n`);
    res.write('event: done\n');
    res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error streaming conversational session:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream conversational session' });
      return;
    }

    res.write('event: error\n');
    res.write(`data: ${JSON.stringify({ error: 'Failed to stream conversational session' })}\n\n`);
    res.end();
  }
});

router.post('/sessions/:sessionId/import', async (req: Request, res: Response) => {
  try {
    const session = await orchestrator.getSessionState(req.params.sessionId);
    if (!session) {
      res.status(404).json({ error: 'Conversation session not found' });
      return;
    }

    if (!session.importReadiness) {
      res.status(409).json({
        error: 'Session is not ready for import',
        reviewState: session.reviewState,
        unresolvedSignals: session.unresolvedSignals || [],
      });
      return;
    }

    await auditLogger.log('other', 'system', 'Conversational import readiness confirmed', {
      sessionId: session.sessionId,
      reviewState: session.reviewState,
      turnCount: session.turnCount,
    });

    res.json({
      sessionId: session.sessionId,
      importReady: true,
      reviewState: session.reviewState,
      summary: {
        classification: session.classification,
        strategicBriefing: session.strategicBriefing,
        promptAlignedOutput: buildPromptAlignedOutput(
          session.strategicBriefing,
          String(session.classification.domain),
          session.classification.jurisdiction
        ),
      },
    });
  } catch (error) {
    console.error('Error preparing conversational import:', error);
    res.status(500).json({ error: 'Failed to prepare conversational import' });
  }
});

export default router;
