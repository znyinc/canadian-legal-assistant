// Example: How ConversationalIntake flows to GuidanceNarrative

import { IntakeAgent } from '../agents/IntakeAgent';
import { GuidanceAgent } from '../agents/GuidanceAgent';
import { MatterClassifier } from '../triage/MatterClassifier';

/**
 * USER EXPERIENCE FLOW
 * 
 * 1. CONVERSATIONAL INTAKE PHASE
 *    ├─ User enters: "I'm being evicted by my landlord"
 *    ├─ IntakeAgent.generateInitialQuestions() shows opening questions
 *    ├─ User provides description with evidence (optional)
 *    ├─ MatterClassifier classifyWithConfidence() analyzes input
 *    ├─ If confidence < 75%: IntakeAgent.generateFollowUpQuestions() asks clarifications
 *    └─ If confidence >= 75%: Ready to proceed to guidance
 *
 * 2. PROCESSING PHASE
 *    ├─ Full conversation history sent to backend
 *    ├─ Classifier produces: { domain: 'landlordTenant', jurisdiction: 'Ontario', urgency: 'critical', confidence: 92 }
 *    ├─ Evidence files processed (optional)
 *    └─ Ready to generate guidance
 *
 * 3. GUIDANCE GENERATION PHASE
 *    ├─ GuidanceAgent.generateGuidance() receives classification
 *    ├─ Uses ActionPlanGenerator for 6-step plan
 *    ├─ Uses LimitationPeriodsEngine for deadlines
 *    ├─ Uses CostCalculator for financial info
 *    └─ Returns structured guidance object
 *
 * 4. GUIDANCE NARRATIVE DISPLAY
 *    ├─ GuidanceNarrative component transforms guidance into flowing narrative
 *    ├─ Renders 6-step flow: Acknowledge → Orient → Prioritize → Guide → Prepare → Offer
 *    ├─ Step 1: Empathetic acknowledgment of their situation
 *    ├─ Step 2: Explanation of what "landlord-tenant matter" means
 *    ├─ Step 3: Urgent actions (24-48 hours) with time estimates
 *    ├─ Step 4: Step-by-step path forward with options
 *    ├─ Step 5: Timeline and what to expect
 *    ├─ Step 6: Specific help available (document generation, checklists, etc.)
 *    └─ Natural next steps (not buttons, flowing conversation)
 */

/**
 * EXAMPLE GUIDANCE OUTPUT STRUCTURE
 * 
 * For landlord-tenant eviction:
 */
const exampleOutput = {
  classification: {
    domain: 'landlordTenant',
    jurisdiction: 'Ontario',
    urgency: 'critical',
    pillar: 'Landlord-tenant',
    confidence: 92,
  },

  guidance: {
    // STEP 1: Acknowledge
    acknowledgment: {
      title: 'Your situation',
      text: `Your landlord has served you with an eviction notice. That's stressful, and it's understandable that you're concerned. But there's a clear legal process here, and you have real rights and options.`,
    },

    // STEP 2: Orient
    orientation: {
      title: 'What this means',
      text: `This is a landlord-tenant matter handled by the Landlord and Tenant Board (LTB). The LTB is different from regular court—it's faster, you can represent yourself, and the landlord has to follow specific rules about notice and process. The good news: most eviction cases end in settlement, not forced eviction.`,
    },

    // STEP 3: Prioritize
    prioritization: {
      title: 'What needs to happen first',
      text: 'Right now, the urgent things are to gather your evidence and understand your deadline:',
      urgencyLevel: 'critical',
      estimatedTime: '24-48 hours',
      actions: [
        {
          title: 'Gather the notice',
          description: 'Get a copy of the eviction notice your landlord served. The type of notice matters legally.',
        },
        {
          title: 'Calculate days remaining',
          description: 'Landlord-tenant rules have specific timelines. You typically have 14-30 days from the notice date to respond.',
        },
        {
          title: 'Document payments and communication',
          description: 'Collect proof of rent payments, texts/emails with your landlord, and any applicable lease terms.',
        },
      ],
    },

    // STEP 4: Guide
    guidance: {
      title: 'Your path forward',
      text: 'Here's how this typically unfolds:',
      steps: [
        {
          title: 'File with the LTB',
          description: 'If you disagree with the eviction or want to negotiate, you apply to the LTB. This pauses the eviction process.',
        },
        {
          title: 'Prepare your evidence',
          description: 'Submit documents, communications, and your explanation in writing before the hearing.',
        },
        {
          title: 'Attend the hearing',
          description: 'Usually by phone or video. You explain your situation, the landlord presents theirs, and the LTB decides.',
        },
        {
          title: 'Implement the order',
          description: 'The LTB issues an Order. Most often it's a settlement: payment plan, lease modification, or agreement.',
        },
      ],
    },

    // STEP 5: Prepare
    preparation: {
      title: 'What to expect',
      text: 'LTB hearings usually happen 4-8 weeks after filing. Here's the timeline and what outcomes look like:',
      timeline: '4-8 weeks',
      outcomes: [
        {
          title: 'Most likely: Settlement',
          description: 'About 80% of eviction cases end in negotiation—a payment plan, lease change, or mutual agreement.',
        },
        {
          title: 'Possible: Hearing decision',
          description: 'If no settlement, the LTB decides based on the evidence. You can appeal some decisions.',
        },
        {
          title: 'Cost: Usually none',
          description: 'LTB applications are free. You don\'t need a lawyer, though you can have one.',
        },
      ],
    },

    // STEP 6: Offer
    offer: {
      title: 'How I can help',
      text: 'You have specific resources available right now:',
      services: [
        {
          title: 'Draft your response',
          description: 'I can help you structure your written response to the eviction notice.',
        },
        {
          title: 'Build your evidence package',
          description: 'Organize your lease, payment records, and communications in LTB format.',
        },
        {
          title: 'Prepare for the hearing',
          description: 'Practice explanations, anticipate questions, prepare your side of the story.',
        },
        {
          title: 'Understand settlement options',
          description: 'Explore what payment plans or lease changes might work for you.',
        },
      ],
    },
  },

  // Related information
  relatedResources: {
    forum: {
      name: 'Landlord and Tenant Board',
      jurisdiction: 'Ontario',
      url: 'https://www.ltb.gov.on.ca',
    },
    deadlines: [
      {
        period: 'Respond to eviction notice',
        daysRemaining: 12,
        urgency: 'critical',
        description: '14 days from service of notice. You have 12 days left.',
      },
    ],
    costs: {
      filing: 0,
      legal: 'Optional; many succeed without a lawyer',
      timeline: '4-8 weeks',
    },
  },
};

export default exampleOutput;
