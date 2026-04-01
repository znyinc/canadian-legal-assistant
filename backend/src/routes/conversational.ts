import { Router, Request, Response } from 'express';
import { GuidanceAgent } from '../../../src/core/agents/GuidanceAgent';
import { MatterClassifier } from '../../../src/core/triage/MatterClassifier';
import { LimitationPeriodsEngine } from '../../../src/core/limitation/LimitationPeriodsEngine';
import { CostCalculator } from '../../../src/core/cost/CostCalculator';
import { ActionPlanGenerator } from '../../../src/core/actionPlan/ActionPlanGenerator';
import { AuditLogger } from '../../../src/core/audit/AuditLogger';

const router = Router();

// Initialize agents and services
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

type IntakeResult = {
  classification: {
    domain: string;
    jurisdiction: string;
    urgency: string;
    confidence: number;
    pillarMatches?: unknown;
  };
  confidence: number;
  followUpQuestions: string[];
  isComplete: boolean;
  reviewState: 'needs-clarification' | 'ready-for-import';
  importReadiness: boolean;
};

function buildFollowUpQuestionsFromClassification(domain: string): string[] {
  const generic = [
    'When did this start?',
    'Who are the other parties involved?',
    'Do you have any documents or messages related to this?',
  ];

  if (domain === 'employment') {
    return [
      'Were you terminated, laid off, or did you resign?',
      'How long did you work there?',
      ...generic,
    ];
  }

  if (domain === 'landlordTenant') {
    return [
      'Is this about rent, repairs, or an eviction notice?',
      'Do you have your lease and any written notices?',
      ...generic,
    ];
  }

  if (domain === 'criminal') {
    return [
      'Are you a witness, victim, or accused person?',
      'Do you have an occurrence number or police contact details?',
      ...generic,
    ];
  }

  return generic;
}

function buildIntakeResult(userInput: string, conversationHistory: Array<{ type?: string; content?: string }>): IntakeResult {
  const previousResponses = (conversationHistory ?? [])
    .filter((m: { type?: string }) => m.type === 'user')
    .map((m: { content?: string }) => m.content ?? '');

  const fullText = [...previousResponses, userInput].filter(Boolean).join('\n\n');
  const classification = classifier.classifyWithConfidence({
    description: fullText,
    source: 'conversational-intake',
  });

  const confidence = classification.confidence?.overall ?? 0;
  const isComplete = confidence >= 75;
  const reviewState = isComplete ? 'ready-for-import' : 'needs-clarification';
  const followUpQuestions = isComplete
    ? []
    : buildFollowUpQuestionsFromClassification(classification.domain);

  return {
    classification: {
      domain: classification.domain,
      jurisdiction: classification.jurisdiction,
      urgency: classification.urgency,
      confidence,
      pillarMatches: (classification as unknown as { pillarMatches?: unknown }).pillarMatches,
    },
    confidence,
    followUpQuestions,
    isComplete,
    reviewState,
    importReadiness: isComplete,
  };
}

/**
 * POST /api/intake/process
 * Process conversational intake input and return follow-up questions or classification
 */
router.post('/intake/process', async (req: Request, res: Response) => {
  try {
    const { userInput, conversationHistory } = req.body;
    const intakeResult = buildIntakeResult(userInput ?? '', conversationHistory ?? []);

    // Log intake progression
    await auditLogger.log('intake-event', 'system', {
      stage: intakeResult.isComplete ? 'complete' : 'in-progress',
      confidence: intakeResult.confidence,
      domain: intakeResult.classification.domain,
      inputLength: (userInput ?? '').length,
      reviewState: intakeResult.reviewState,
      importReadiness: intakeResult.importReadiness,
    });

    res.json(intakeResult);
  } catch (error) {
    console.error('Error processing intake:', error);
    res.status(500).json({ error: 'Failed to process intake' });
  }
});

/**
 * POST /api/conversational/intake/stream
 * Streams assistant response chunks while preserving import and review state.
 */
router.post('/intake/stream', async (req: Request, res: Response) => {
  try {
    const { userInput, conversationHistory } = req.body;
    const intakeResult = buildIntakeResult(userInput ?? '', conversationHistory ?? []);

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
      reviewState: intakeResult.reviewState,
      importReadiness: intakeResult.importReadiness,
    });

    const assistantText = intakeResult.isComplete
      ? `Great. I understand your situation: you're dealing with a ${intakeResult.classification.domain} matter in ${intakeResult.classification.jurisdiction}. I'll gather what you've shared and show you the options available.`
      : 'Got it. Just a few quick clarifications to make sure I understand correctly.';

    const chunks = assistantText.match(/.{1,30}/g) ?? [assistantText];
    for (const chunk of chunks) {
      sendEvent('delta', { chunk });
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    sendEvent('final', {
      message: assistantText,
      ...intakeResult,
    });
    sendEvent('done', { ok: true });

    await auditLogger.log('intake-event', 'system', {
      stage: intakeResult.isComplete ? 'complete' : 'in-progress',
      confidence: intakeResult.confidence,
      domain: intakeResult.classification.domain,
      inputLength: (userInput ?? '').length,
      reviewState: intakeResult.reviewState,
      importReadiness: intakeResult.importReadiness,
      streamed: true,
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

/**
 * POST /api/guidance/generate
 * Generate 6-step guidance narrative using GuidanceAgent
 */
router.post('/guidance/generate', async (req: Request, res: Response) => {
  try {
    const { description, domain, jurisdiction, urgency } = req.body;

    // Classify if not already provided
    let classification = { domain, jurisdiction, urgency };
    if (!domain) {
      const inferred = classifier.classifyWithConfidence({
        description,
        source: 'conversational-intake',
      });
      classification = {
        domain: inferred.domain,
        jurisdiction: inferred.jurisdiction,
        urgency: inferred.urgency,
      };
    }

    // Generate guidance using GuidanceAgent
    const guidance = guidanceAgent.generateGuidance(classification as any, {
      description,
      evidence: [],
      deadlines: [],
      financialContext: {},
    });

    // Log guidance generation
    await auditLogger.log('guidance-event', 'system', {
      domain: classification.domain,
      jurisdiction: classification.jurisdiction,
      guidanceType: 'conversational',
    });

    res.json({
      classification,
      guidance: {
        // Acknowledge step - empathetic opening
        acknowledgment: {
          title: 'Your situation',
          text: guidance.acknowledgment || `You're dealing with a ${classification.domain} matter. Let me help you understand what this means and what comes next.`,
        },

        // Orient step - explain legal pillar
        orientation: {
          title: 'What this means',
          text: guidance.settlementPathways?.[0]?.description || `This is a ${classification.domain} matter in ${classification.jurisdiction}. Here's what that means for you...`,
        },

        // Prioritize step - urgent actions
        prioritization: {
          title: 'What needs to happen first',
          text: 'Right now, the urgent thing is to take these steps within the next 24-48 hours:',
          actions: (guidance.immediateActions || []).slice(0, 3).map((action: any) => ({
            title: action.action || 'Action item',
            description: action.reasoning || 'Important next step',
          })),
        },

        // Guide step - step-by-step path
        guidance: {
          title: 'Your path forward',
          text: "Here's how we move forward, step by step:",
          steps: (guidance.settlementPathways || [])
            .map((pathway: any) => ({
              title: pathway.name,
              description: pathway.description,
            }))
            .slice(0, 3),
        },

        // Prepare step - timeline and outcomes
        preparation: {
          title: 'What to expect',
          text: `This process typically takes ${guidance.nextSteps?.[0]?.timeline || 'several weeks to months'} depending on the specifics of your situation. Here's what that looks like:`,
          timeline: guidance.nextSteps?.[0]?.timeline,
          outcomes: [
            {
              title: 'Typical outcome',
              description: guidance.settlementPathways?.[0]?.pros?.[0] || 'Most cases in your situation resolve...',
            },
            {
              title: 'Timeline',
              description: guidance.nextSteps?.[0]?.timeline || 'Variable depending on circumstances',
            },
          ],
        },

        // Offer step - specific help
        offer: {
          text: 'I can help you with specific documents, build an evidence checklist, analyze costs, or explore different options in more detail.',
          services: [
            {
              title: 'Generate documents',
              description: 'Create templates specific to your situation',
            },
            {
              title: 'Build evidence checklist',
              description: 'Know exactly what evidence you need to gather',
            },
            {
              title: 'Analyze costs',
              description: 'Understand filing fees, potential costs, and financial risks',
            },
          ],
        },
      },
    });
  } catch (error) {
    console.error('Error generating guidance:', error);
    res.status(500).json({ error: 'Failed to generate guidance' });
  }
});

export default router;
