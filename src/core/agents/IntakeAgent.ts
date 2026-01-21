import {
  MatterClassification,
  ClassificationInput,
  EvidenceIndex,
  PartyType,
  Domain,
  Jurisdiction
} from '../models';
import { MatterClassifier } from '../triage/MatterClassifier';
import { BaseKit } from '../kits/BaseKit';

/**
 * Conversational question for gathering information
 */
export interface ConversationalQuestion {
  id: string;
  category: 'domain' | 'jurisdiction' | 'parties' | 'timeline' | 'amount' | 'urgency';
  question: string;
  type: 'text' | 'select' | 'date' | 'number' | 'multiselect';
  options?: string[];
  required: boolean;
  hint?: string;
  followUpFor?: string; // Question ID this question follows from
}

/**
 * User response to a conversational question
 */
export interface UserResponse {
  questionId: string;
  answer: string | string[] | number | Date;
  confidence?: number; // 0-100, user's confidence in answer
}

/**
 * Evidence requirement identified by intake process
 */
export interface EvidenceRequirement {
  type: string; // "identity", "timeline", "communication", "financial", etc.
  priority: 'essential' | 'important' | 'helpful';
  description: string;
  expectedCount?: number;
  examples?: string[];
}

/**
 * Result of intake analysis
 */
export interface IntakeAnalysisResult {
  classification: MatterClassification;
  confidenceScore: number; // 0-100
  evidenceRequirements: EvidenceRequirement[];
  missingInformation: string[];
  recommendedNextQuestions: ConversationalQuestion[];
  classificationRationale: string;
  classificationAlternatives?: {
    domain: Domain;
    jurisdiction: Jurisdiction;
    confidence: number;
  }[];
}

/**
 * IntakeAgent: Manages conversational intake flow and dynamic question generation
 * 
 * Responsibilities:
 * - Generate contextual questions based on prior answers
 * - Collect user information and responses
 * - Synthesize responses into classification input
 * - Calculate confidence scores for classifications
 * - Identify evidence requirements
 * - Suggest follow-up questions for ambiguous cases
 */
export class IntakeAgent {
  private classifier: MatterClassifier;
  private conversationHistory: UserResponse[] = [];
  private classificationInputBuffer: Partial<ClassificationInput> = {};

  constructor(classifier?: MatterClassifier) {
    this.classifier = classifier ?? new MatterClassifier();
  }

  /**
   * Generate initial questions to begin intake conversation
   */
  generateInitialQuestions(): ConversationalQuestion[] {
    return [
      {
        id: 'q-domain-nature',
        category: 'domain',
        question: 'What is the main legal issue you\'re dealing with?',
        type: 'select',
        options: [
          'Employment (hiring, firing, wrongful dismissal)',
          'Landlord/Tenant (eviction, rent, repairs)',
          'Insurance (claim denial, coverage dispute)',
          'Civil (personal injury, property damage)',
          'Consumer (refunds, warranties, service issues)',
          'Criminal (charges, victim support)',
          'Family (divorce, custody, support)',
          'Other (not listed above)'
        ],
        required: true,
        hint: 'Select the category that best matches your situation'
      },
      {
        id: 'q-jurisdiction-province',
        category: 'jurisdiction',
        question: 'What province are you in?',
        type: 'select',
        options: [
          'Ontario',
          'British Columbia',
          'Alberta',
          'Manitoba',
          'Saskatchewan',
          'Quebec',
          'Maritimes (NS, NB, PE)',
          'Other'
        ],
        required: true,
        hint: 'Your location determines which courts and laws apply'
      },
      {
        id: 'q-urgency-timeline',
        category: 'urgency',
        question: 'Is there a deadline or court date coming up soon?',
        type: 'select',
        options: [
          'Within 7 days (critical)',
          'Within 30 days (urgent)',
          'Within 90 days (soon)',
          'More than 90 days away',
          "Not sure / Don't know"
        ],
        required: true,
        hint: 'This helps us prioritize your next steps'
      }
    ];
  }

  /**
   * Generate follow-up questions based on prior responses
   */
  generateFollowUpQuestions(currentResponses: UserResponse[]): ConversationalQuestion[] {
    const responses = new Map(currentResponses.map(r => [r.questionId, r.answer]));
    const domainAnswer = responses.get('q-domain-nature');
    const followUps: ConversationalQuestion[] = [];

    // Domain-specific follow-ups
    if (typeof domainAnswer === 'string') {
      if (domainAnswer.includes('Employment')) {
        followUps.push({
          id: 'q-employment-type',
          category: 'domain',
          question: 'Were you fired, laid off, or did you resign?',
          type: 'select',
          options: [
            'I was fired/terminated',
            'I was laid off',
            'I resigned',
            'Other termination'
          ],
          required: true,
          followUpFor: 'q-domain-nature'
        });
        followUps.push({
          id: 'q-employment-length',
          category: 'timeline',
          question: 'How long did you work there?',
          type: 'text',
          required: true,
          hint: 'e.g., "3 months", "2 years", etc.',
          followUpFor: 'q-domain-nature'
        });
      }

      if (domainAnswer.includes('Landlord')) {
        followUps.push({
          id: 'q-lt-issue',
          category: 'domain',
          question: 'What is the main issue?',
          type: 'select',
          options: [
            'Eviction notice received',
            'Rent dispute',
            'Repair/maintenance issue',
            'Lease termination',
            'Deposit dispute'
          ],
          required: true,
          followUpFor: 'q-domain-nature'
        });
      }

      if (domainAnswer.includes('Insurance')) {
        followUps.push({
          id: 'q-insurance-type',
          category: 'domain',
          question: 'What type of insurance?',
          type: 'select',
          options: [
            'Auto/Motor vehicle',
            'Home/Property',
            'Business/Commercial',
            'Health/Medical',
            'Other'
          ],
          required: true,
          followUpFor: 'q-domain-nature'
        });
      }

      if (domainAnswer.includes('Civil')) {
        followUps.push({
          id: 'q-civil-amount',
          category: 'amount',
          question: 'Approximately how much money are you claiming or owed?',
          type: 'number',
          required: false,
          hint: 'Rough estimate in dollars (e.g., 10000 for $10,000)'
        });
      }

      if (domainAnswer.includes('Criminal')) {
        followUps.push({
          id: 'q-criminal-role',
          category: 'parties',
          question: 'Are you a witness, victim, accused, or other?',
          type: 'select',
          options: [
            'Witness to a crime',
            'Victim of a crime',
            'Accused of a crime',
            'Other involved party'
          ],
          required: true,
          followUpFor: 'q-domain-nature'
        });
      }
    }

    // Party information questions
    if (!responses.has('q-parties-count')) {
      followUps.push({
        id: 'q-parties-count',
        category: 'parties',
        question: 'How many other parties are involved (not counting you)?',
        type: 'number',
        required: true,
        hint: 'e.g., 1 for one-on-one, 2 for a third party involved'
      });
    }

    return followUps;
  }

  /**
   * Process user response and update classification buffer
   */
  processResponse(response: UserResponse): void {
    this.conversationHistory.push(response);
    this.synthesizeClassificationInput();
  }

  /**
   * Synthesize accumulated responses into classification input
   */
  private synthesizeClassificationInput(): void {
    const responses = new Map(
      this.conversationHistory.map(r => [r.questionId, r.answer])
    );

    // Extract domain hint
    const domainHint = responses.get('q-domain-nature');
    if (domainHint) {
      this.classificationInputBuffer.domainHint = String(domainHint);
    }

    // Extract jurisdiction hint
    const jurisdictionHint = responses.get('q-jurisdiction-province');
    if (jurisdictionHint) {
      this.classificationInputBuffer.jurisdictionHint = String(jurisdictionHint);
    }

    // Extract urgency
    const urgencyAnswer = responses.get('q-urgency-timeline');
    if (urgencyAnswer) {
      const urgencyStr = String(urgencyAnswer).toLowerCase();
      if (urgencyStr.includes('7 days') || urgencyStr.includes('critical')) {
        this.classificationInputBuffer.urgencyHint = 'high';
      } else if (urgencyStr.includes('30 days') || urgencyStr.includes('urgent')) {
        this.classificationInputBuffer.urgencyHint = 'high';
      } else if (urgencyStr.includes('90 days') || urgencyStr.includes('soon')) {
        this.classificationInputBuffer.urgencyHint = 'medium';
      } else {
        this.classificationInputBuffer.urgencyHint = 'low';
      }
    }

    // Extract amount
    const amountAnswer = responses.get('q-civil-amount');
    if (amountAnswer && typeof amountAnswer === 'number') {
      this.classificationInputBuffer.disputeAmount = amountAnswer;
    }

    // Extract party types
    const partiesAnswer = responses.get('q-criminal-role');
    if (partiesAnswer) {
      const roleStr = String(partiesAnswer).toLowerCase();
      if (roleStr.includes('accused')) {
        this.classificationInputBuffer.claimantType = 'accused';
      } else if (roleStr.includes('victim')) {
        this.classificationInputBuffer.claimantType = 'victim';
      }
    }
  }

  /**
   * Analyze accumulated responses and generate classification
   */
  analyzeResponses(): IntakeAnalysisResult {
    const classificationInput: ClassificationInput = {
      ...this.classificationInputBuffer
    };

    const classification = this.classifier.classify(classificationInput);
    const confidenceScore = this.calculateConfidence();
    const evidenceRequirements = this.identifyEvidenceRequirements(classification);
    const missingInformation = this.identifyMissingInformation();
    const classificationRationale = this.generateRationale(classification);
    const classificationAlternatives = this.generateAlternatives(classification);
    const recommendedNextQuestions = this.generateFollowUpQuestions(
      this.conversationHistory
    );

    return {
      classification,
      confidenceScore,
      evidenceRequirements,
      missingInformation,
      recommendedNextQuestions,
      classificationRationale,
      classificationAlternatives
    };
  }

  /**
   * Calculate confidence score (0-100) for classification
   */
  private calculateConfidence(): number {
    // Base confidence on number of direct questions answered
    const directAnswersCount = this.conversationHistory.filter(
      r => r.questionId.startsWith('q-')
    ).length;

    // Calculate based on:
    // - Domain hint provided: +20
    // - Jurisdiction provided: +15
    // - Urgency estimated: +15
    // - Amount provided: +15
    // - Party info provided: +15
    // - User confidence on responses: +20 (if averaged)

    let score = 20; // Base score

    const responses = new Map(
      this.conversationHistory.map(r => [r.questionId, r.answer])
    );

    if (responses.has('q-domain-nature')) score += 20;
    if (responses.has('q-jurisdiction-province')) score += 15;
    if (responses.has('q-urgency-timeline')) score += 15;
    if (responses.has('q-civil-amount')) score += 15;
    if (responses.has('q-parties-count')) score += 10;

    // Average user confidence values
    const userConfidences = this.conversationHistory
      .filter(r => r.confidence !== undefined)
      .map(r => r.confidence!);
    if (userConfidences.length > 0) {
      const avgConfidence = userConfidences.reduce((a, b) => a + b, 0) / userConfidences.length;
      score += Math.round(avgConfidence * 0.05); // Scale to max +5
    }

    return Math.min(100, score);
  }

  /**
   * Identify evidence requirements based on classification
   */
  private identifyEvidenceRequirements(classification: MatterClassification): EvidenceRequirement[] {
    const requirements: EvidenceRequirement[] = [];

    // Universal requirements
    requirements.push({
      type: 'identity',
      priority: 'essential',
      description: 'Identification documents (government ID)',
      examples: ['Passport', 'Driver\'s license', 'Provincial ID']
    });

    // Domain-specific requirements
    if (classification.domain === 'employment') {
      requirements.push({
        type: 'employment-records',
        priority: 'essential',
        description: 'Employment records and documentation',
        examples: ['Employment contract', 'Offer letter', 'Pay stubs', 'Termination letter'],
        expectedCount: 3
      });
      requirements.push({
        type: 'communication',
        priority: 'important',
        description: 'Emails, texts, or written communications',
        examples: ['Manager emails', 'Text messages', 'Performance reviews'],
        expectedCount: 5
      });
    }

    if (classification.domain === 'landlordTenant') {
      requirements.push({
        type: 'lease',
        priority: 'essential',
        description: 'Lease agreement',
        expectedCount: 1
      });
      requirements.push({
        type: 'notices',
        priority: 'important',
        description: 'Any notices from landlord/tenant',
        examples: ['Eviction notice', 'Repair requests', 'Rent increase notice']
      });
      requirements.push({
        type: 'financial',
        priority: 'important',
        description: 'Rent payment records',
        examples: ['Rent receipts', 'Bank transfer records', 'Cancelled cheques']
      });
    }

    if (classification.domain === 'civilNegligence') {
      requirements.push({
        type: 'incident-photos',
        priority: 'essential',
        description: 'Photos of the incident scene or damage',
        expectedCount: 3
      });
      requirements.push({
        type: 'medical',
        priority: 'important',
        description: 'Medical records if injury involved',
        examples: ['Doctor reports', 'Hospital records', 'Prescription records']
      });
      requirements.push({
        type: 'communication',
        priority: 'important',
        description: 'Communication about the incident',
        examples: ['Messages to responsible party', 'Demand letters', 'Repair quotes']
      });
    }

    if (classification.domain === 'insurance') {
      requirements.push({
        type: 'policy',
        priority: 'essential',
        description: 'Insurance policy document',
        expectedCount: 1
      });
      requirements.push({
        type: 'claim-communication',
        priority: 'essential',
        description: 'Correspondence with insurance company',
        examples: ['Claim submission', 'Denial letter', 'Email exchanges']
      });
      requirements.push({
        type: 'incident-evidence',
        priority: 'important',
        description: 'Evidence supporting the claim',
        examples: ['Photos', 'Police report', 'Medical records']
      });
    }

    if (classification.domain === 'criminal') {
      requirements.push({
        type: 'police-report',
        priority: 'important',
        description: 'Police report number or occurrence details',
        examples: ['Occurrence number', 'Report from police service']
      });
      requirements.push({
        type: 'incident-timeline',
        priority: 'important',
        description: 'Timeline of the incident',
        examples: ['Date/time', 'Location', 'Witness names']
      });
      requirements.push({
        type: 'communication',
        priority: 'important',
        description: 'Communications related to the incident',
        examples: ['Messages', '911 recordings', 'Correspondence']
      });
    }

    return requirements;
  }

  /**
   * Identify what information is still missing
   */
  private identifyMissingInformation(): string[] {
    const missing: string[] = [];
    const responses = new Map(
      this.conversationHistory.map(r => [r.questionId, r.answer])
    );

    if (!responses.has('q-domain-nature')) {
      missing.push('Main legal issue or domain');
    }
    if (!responses.has('q-jurisdiction-province')) {
      missing.push('Jurisdiction (province/territory)');
    }
    if (!responses.has('q-urgency-timeline')) {
      missing.push('Deadline or urgency information');
    }
    if (!responses.has('q-parties-count')) {
      missing.push('Information about other parties involved');
    }

    return missing;
  }

  /**
   * Generate human-readable rationale for classification
   */
  private generateRationale(classification: MatterClassification): string {
    const responses = new Map(
      this.conversationHistory.map(r => [r.questionId, r.answer])
    );

    const domain = String(responses.get('q-domain-nature') || 'Unknown');
    const jurisdiction = String(responses.get('q-jurisdiction-province') || 'Unknown');
    const urgency = String(responses.get('q-urgency-timeline') || 'Not specified');

    return `
Based on your responses:
- Legal Issue: ${domain}
- Location: ${jurisdiction}
- Timeline: ${urgency}

This matter has been classified as: **${classification.domain}** in **${classification.jurisdiction}**
Urgency Level: **${classification.urgency.toUpperCase()}**

The system will use this classification to provide you with relevant information about:
- Which court or tribunal handles this type of case
- What deadlines you need to be aware of
- What documents you'll need to prepare
- Your next steps in the legal process
    `.trim();
  }

  /**
   * Generate alternative classifications for ambiguous cases
   */
  private generateAlternatives(primary: MatterClassification) {
    // For now, return empty array - could generate alternatives in more complex implementation
    return [];
  }

  /**
   * Get the current conversation history
   */
  getConversationHistory(): UserResponse[] {
    return [...this.conversationHistory];
  }

  /**
   * Reset the agent for a new conversation
   */
  reset(): void {
    this.conversationHistory = [];
    this.classificationInputBuffer = {};
  }

  /**
   * Get current classification input buffer state
   */
  getClassificationInputBuffer(): Partial<ClassificationInput> {
    return { ...this.classificationInputBuffer };
  }
}
