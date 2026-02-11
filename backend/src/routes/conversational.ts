import { Router, Request, Response } from 'express';
import { IntakeAgent } from '../../../src/core/agents/IntakeAgent';
import { GuidanceAgent } from '../../../src/core/agents/GuidanceAgent';
import { MatterClassifier } from '../../../src/core/triage/MatterClassifier';
import { LimitationPeriodsEngine } from '../../../src/core/limitation/LimitationPeriodsEngine';
import { CostCalculator } from '../../../src/core/cost/CostCalculator';
import { ActionPlanGenerator } from '../../../src/core/actionPlan/ActionPlanGenerator';
import { AuditLogger } from '../../../src/core/audit/AuditLogger';

const router = Router();

// Initialize agents and services
const intakeAgent = new IntakeAgent();
const classifier = new MatterClassifier();
const limitationEngine = new LimitationPeriodsEngine();
const costCalculator = new CostCalculator();
const actionPlanGenerator = new ActionPlanGenerator();
const guidanceAgent = new GuidanceAgent(
  classifier,
  limitationEngine,
  costCalculator,
  actionPlanGenerator
);
const auditLogger = new AuditLogger();

/**
 * POST /api/intake/process
 * Process conversational intake input and return follow-up questions or classification
 */
router.post('/intake/process', async (req: Request, res: Response) => {
  try {
    const { userInput, conversationHistory, uploadedFileNames } = req.body;

    // Reconstruct conversation context
    const previousResponses = conversationHistory
      .filter((m: any) => m.type === 'user')
      .map((m: any) => m.content);

    // Classify matter based on accumulated input
    const fullText = [...previousResponses, userInput].join('\n\n');
    const classification = classifier.classifyWithConfidence({
      description: fullText,
      source: 'conversational-intake',
    });

    // Generate follow-up questions if confidence is low
    let followUpQuestions: string[] = [];
    if (classification.overallConfidence < 75) {
      followUpQuestions = intakeAgent.generateFollowUpQuestions(
        classification as any,
        previousResponses
      );
    }

    // Log intake progression
    await auditLogger.log('intake-event', 'system', {
      stage: classification.overallConfidence >= 75 ? 'complete' : 'in-progress',
      confidence: classification.overallConfidence,
      domain: classification.domain,
      inputLength: userInput.length,
    });

    res.json({
      classification: {
        domain: classification.domain,
        jurisdiction: classification.jurisdiction,
        urgency: classification.urgency,
        confidence: classification.overallConfidence,
        pillarMatches: (classification as any).pillarMatches,
      },
      followUpQuestions,
      isComplete: classification.overallConfidence >= 75,
    });
  } catch (error) {
    console.error('Error processing intake:', error);
    res.status(500).json({ error: 'Failed to process intake' });
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
          text: 'Here's how we move forward, step by step:',
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
