import { describe, it, expect, beforeEach } from 'vitest';
import { IntakeAgent, ConversationalQuestion, UserResponse } from '../src/core/agents/IntakeAgent';
import { MatterClassifier } from '../src/core/triage/MatterClassifier';

describe('IntakeAgent', () => {
  let agent: IntakeAgent;

  beforeEach(() => {
    agent = new IntakeAgent();
  });

  describe('Initial Questions Generation', () => {
    it('should generate initial questions for intake', () => {
      const questions = agent.generateInitialQuestions();

      expect(questions).toHaveLength(3);
      expect(questions[0].category).toBe('domain');
      expect(questions[1].category).toBe('jurisdiction');
      expect(questions[2].category).toBe('urgency');
    });

    it('should mark initial questions as required', () => {
      const questions = agent.generateInitialQuestions();

      expect(questions.every(q => q.required)).toBe(true);
    });

    it('should provide domain options', () => {
      const questions = agent.generateInitialQuestions();
      const domainQuestion = questions.find(q => q.category === 'domain');

      expect(domainQuestion?.options).toBeDefined();
      expect(domainQuestion!.options!.length).toBeGreaterThan(0);
    });
  });

  describe('Follow-up Questions Generation', () => {
    it('should generate employment-specific follow-ups', () => {
      const responses: UserResponse[] = [
        {
          questionId: 'q-domain-nature',
          answer: 'Employment (hiring, firing, wrongful dismissal)',
          confidence: 90
        }
      ];

      const followUps = agent.generateFollowUpQuestions(responses);

      expect(followUps.length).toBeGreaterThan(0);
      expect(followUps.some(q => q.category === 'domain')).toBe(true);
    });

    it('should generate landlord-tenant-specific follow-ups', () => {
      const responses: UserResponse[] = [
        {
          questionId: 'q-domain-nature',
          answer: 'Landlord/Tenant (eviction, rent, repairs)',
          confidence: 85
        }
      ];

      const followUps = agent.generateFollowUpQuestions(responses);

      expect(followUps.length).toBeGreaterThan(0);
      expect(followUps.some(q => q.id.includes('lt'))).toBe(true);
    });

    it('should generate criminal-specific follow-ups', () => {
      const responses: UserResponse[] = [
        {
          questionId: 'q-domain-nature',
          answer: 'Criminal (charges, victim support)',
          confidence: 80
        }
      ];

      const followUps = agent.generateFollowUpQuestions(responses);

      expect(followUps.some(q => q.id === 'q-criminal-role')).toBe(true);
    });

    it('should generate civil amount follow-up', () => {
      const responses: UserResponse[] = [
        {
          questionId: 'q-domain-nature',
          answer: 'Civil (personal injury, property damage)',
          confidence: 75
        }
      ];

      const followUps = agent.generateFollowUpQuestions(responses);

      expect(followUps.some(q => q.id === 'q-civil-amount')).toBe(true);
    });
  });

  describe('Response Processing', () => {
    it('should process user responses', () => {
      const response: UserResponse = {
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      };

      agent.processResponse(response);

      const history = agent.getConversationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].questionId).toBe('q-domain-nature');
    });

    it('should accumulate multiple responses', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      });

      agent.processResponse({
        questionId: 'q-jurisdiction-province',
        answer: 'Ontario',
        confidence: 95
      });

      expect(agent.getConversationHistory()).toHaveLength(2);
    });

    it('should update classification buffer on response', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      });

      const buffer = agent.getClassificationInputBuffer();
      expect(buffer.domainHint).toBeDefined();
    });

    it('should extract jurisdiction hint', () => {
      agent.processResponse({
        questionId: 'q-jurisdiction-province',
        answer: 'Ontario',
        confidence: 95
      });

      const buffer = agent.getClassificationInputBuffer();
      expect(buffer.jurisdictionHint).toBe('Ontario');
    });

    it('should extract urgency hint from timeline response', () => {
      agent.processResponse({
        questionId: 'q-urgency-timeline',
        answer: 'Within 7 days (critical)',
        confidence: 98
      });

      const buffer = agent.getClassificationInputBuffer();
      expect(buffer.urgencyHint).toBe('high');
    });

    it('should convert amount response to number', () => {
      agent.processResponse({
        questionId: 'q-civil-amount',
        answer: 25000,
        confidence: 80
      });

      const buffer = agent.getClassificationInputBuffer();
      expect(buffer.disputeAmount).toBe(25000);
    });
  });

  describe('Response Analysis', () => {
    beforeEach(() => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      });

      agent.processResponse({
        questionId: 'q-jurisdiction-province',
        answer: 'Ontario',
        confidence: 95
      });

      agent.processResponse({
        questionId: 'q-urgency-timeline',
        answer: 'Within 30 days (urgent)',
        confidence: 90
      });
    });

    it('should generate classification from responses', () => {
      const analysis = agent.analyzeResponses();

      expect(analysis.classification).toBeDefined();
      expect(analysis.classification.domain).toBeDefined();
      expect(analysis.classification.jurisdiction).toBeDefined();
    });

    it('should calculate confidence score', () => {
      const analysis = agent.analyzeResponses();

      expect(analysis.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(analysis.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('should identify evidence requirements', () => {
      const analysis = agent.analyzeResponses();

      expect(analysis.evidenceRequirements).toBeDefined();
      expect(analysis.evidenceRequirements.length).toBeGreaterThan(0);
    });

    it('should identify missing information', () => {
      const analysis = agent.analyzeResponses();

      expect(analysis.missingInformation).toBeDefined();
      expect(Array.isArray(analysis.missingInformation)).toBe(true);
    });

    it('should generate classification rationale', () => {
      const analysis = agent.analyzeResponses();

      expect(analysis.classificationRationale).toBeDefined();
      expect(analysis.classificationRationale.length).toBeGreaterThan(0);
    });

    it('should recommend follow-up questions for incomplete intake', () => {
      const analysis = agent.analyzeResponses();

      expect(analysis.recommendedNextQuestions).toBeDefined();
      expect(Array.isArray(analysis.recommendedNextQuestions)).toBe(true);
    });
  });

  describe('Evidence Requirements', () => {
    it('should identify employment-specific evidence requirements', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      });
      agent.processResponse({
        questionId: 'q-jurisdiction-province',
        answer: 'Ontario',
        confidence: 95
      });
      agent.processResponse({
        questionId: 'q-urgency-timeline',
        answer: 'Within 30 days (urgent)',
        confidence: 90
      });

      const analysis = agent.analyzeResponses();
      const employmentReqs = analysis.evidenceRequirements.filter(
        r => r.type === 'employment-records'
      );

      expect(employmentReqs.length).toBeGreaterThan(0);
      expect(employmentReqs[0].priority).toBe('essential');
    });

    it('should identify civil negligence evidence requirements', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Civil (personal injury, property damage)',
        confidence: 80
      });
      agent.processResponse({
        questionId: 'q-jurisdiction-province',
        answer: 'Ontario',
        confidence: 95
      });
      agent.processResponse({
        questionId: 'q-urgency-timeline',
        answer: 'Within 90 days (soon)',
        confidence: 85
      });

      const analysis = agent.analyzeResponses();
      const photoReqs = analysis.evidenceRequirements.filter(
        r => r.type === 'incident-photos'
      );

      expect(photoReqs.length).toBeGreaterThan(0);
      expect(photoReqs[0].priority).toBe('essential');
    });

    it('should have universal identity requirement', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      });
      agent.processResponse({
        questionId: 'q-jurisdiction-province',
        answer: 'Ontario',
        confidence: 95
      });
      agent.processResponse({
        questionId: 'q-urgency-timeline',
        answer: 'Within 30 days (urgent)',
        confidence: 90
      });

      const analysis = agent.analyzeResponses();
      const identityReq = analysis.evidenceRequirements.find(r => r.type === 'identity');

      expect(identityReq).toBeDefined();
      expect(identityReq?.priority).toBe('essential');
    });
  });

  describe('Confidence Scoring', () => {
    it('should give high confidence with complete responses', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 95
      });
      agent.processResponse({
        questionId: 'q-jurisdiction-province',
        answer: 'Ontario',
        confidence: 98
      });
      agent.processResponse({
        questionId: 'q-urgency-timeline',
        answer: 'Within 30 days (urgent)',
        confidence: 90
      });

      const analysis = agent.analyzeResponses();
      expect(analysis.confidenceScore).toBeGreaterThan(70);
    });

    it('should give lower confidence with few responses', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 50
      });

      const analysis = agent.analyzeResponses();
      expect(analysis.confidenceScore).toBeLessThan(60);
    });

    it('should cap confidence at 100', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 100
      });
      agent.processResponse({
        questionId: 'q-jurisdiction-province',
        answer: 'Ontario',
        confidence: 100
      });
      agent.processResponse({
        questionId: 'q-urgency-timeline',
        answer: 'Within 30 days (urgent)',
        confidence: 100
      });

      const analysis = agent.analyzeResponses();
      expect(analysis.confidenceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset conversation history', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      });

      agent.reset();

      expect(agent.getConversationHistory()).toHaveLength(0);
    });

    it('should reset classification buffer', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      });

      agent.reset();

      const buffer = agent.getClassificationInputBuffer();
      expect(Object.keys(buffer)).toHaveLength(0);
    });

    it('should allow new analysis after reset', () => {
      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      });

      agent.reset();

      agent.processResponse({
        questionId: 'q-domain-nature',
        answer: 'Landlord/Tenant (eviction, rent, repairs)',
        confidence: 95
      });

      const analysis = agent.analyzeResponses();
      expect(analysis.classification.domain).not.toBe('employment');
    });
  });

  describe('Conversation Flow', () => {
    it('should support multi-turn conversation', () => {
      // Turn 1
      const q1 = agent.generateInitialQuestions();
      expect(q1).toHaveLength(3);

      // Turn 2
      agent.processResponse({
        questionId: q1[0].id,
        answer: 'Employment (hiring, firing, wrongful dismissal)',
        confidence: 85
      });

      const q2 = agent.generateFollowUpQuestions(agent.getConversationHistory());
      expect(q2.length).toBeGreaterThan(0);

      // Turn 3
      agent.processResponse({
        questionId: q1[1].id,
        answer: 'Ontario',
        confidence: 95
      });

      const analysis = agent.analyzeResponses();
      expect(analysis.classification).toBeDefined();
    });
  });
});
