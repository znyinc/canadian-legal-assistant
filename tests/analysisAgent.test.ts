import { describe, it, expect, beforeEach } from 'vitest';
import { AnalysisAgent, AnalysisResult } from '../src/core/agents/AnalysisAgent';
import { MatterClassification, EvidenceIndex } from '../src/core/models';

describe('AnalysisAgent', () => {
  let agent: AnalysisAgent;
  let mockClassification: MatterClassification;
  let mockEvidenceIndex: EvidenceIndex;

  beforeEach(() => {
    agent = new AnalysisAgent();

    mockClassification = {
      id: 'class-123',
      domain: 'employment',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business'
      },
      timeline: {
        keyDates: ['2025-01-01', '2025-01-15'],
        start: '2025-01-01',
        end: '2025-01-15'
      },
      urgency: 'high',
      disputeAmount: 50000,
      status: 'classified'
    };

    mockEvidenceIndex = {
      attachmentIds: ['att1', 'att2', 'att3'],
      evidence: [
        {
          id: 'ev1',
          type: 'employment_records',
          filename: 'employment_contract.pdf',
          hash: 'hash1',
          date: '2024-12-01',
          credibilityScore: 0.95,
          tags: ['contract', 'essential']
        },
        {
          id: 'ev2',
          type: 'communication',
          filename: 'emails.pdf',
          hash: 'hash2',
          date: '2025-01-10',
          credibilityScore: 0.85,
          tags: ['emails', 'evidence']
        },
        {
          id: 'ev3',
          type: 'pay_records',
          filename: 'pay_stubs.pdf',
          hash: 'hash3',
          date: '2024-11-30',
          credibilityScore: 0.90,
          tags: ['financial', 'essential']
        }
      ],
      summary: 'Employment termination evidence',
      timeline: 'Jan 1-15, 2025'
    };
  });

  describe('Analysis', () => {
    it('should analyze classification', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.classificationAnalysis).toBeDefined();
      expect(result.classificationAnalysis.primaryClassification).toBe(mockClassification);
      expect(result.classificationAnalysis.confidence).toBeGreaterThan(0);
    });

    it('should synthesize evidence', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.evidenceSynthesis).toBeDefined();
      expect(result.evidenceSynthesis.totalCount).toBe(3);
      expect(result.evidenceSynthesis.byType['employment_records']).toBe(1);
      expect(result.evidenceSynthesis.byType['communication']).toBe(1);
    });

    it('should analyze deadlines', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.deadlineAnalysis).toBeDefined();
      expect(result.deadlineAnalysis.criticalDeadlines).toBeDefined();
      expect(Array.isArray(result.deadlineAnalysis.criticalDeadlines)).toBe(true);
    });

    it('should assess case strength', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(['strong', 'moderate', 'weak', 'insufficient']).toContain(
        result.overallStrength
      );
    });

    it('should identify risk factors', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(Array.isArray(result.riskFactors)).toBe(true);
    });

    it('should identify opportunities', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(Array.isArray(result.opportunities)).toBe(true);
    });

    it('should generate analysis narrative', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.analysisNarrative).toBeDefined();
      expect(result.analysisNarrative.length).toBeGreaterThan(0);
    });
  });

  describe('Evidence Synthesis', () => {
    it('should count evidence by type', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.evidenceSynthesis.byType).toHaveProperty('employment_records', 1);
      expect(result.evidenceSynthesis.byType).toHaveProperty('communication', 1);
      expect(result.evidenceSynthesis.byType).toHaveProperty('pay_records', 1);
    });

    it('should identify timeline from evidence', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.evidenceSynthesis.timeline.earliest).toBeDefined();
      expect(result.evidenceSynthesis.timeline.latest).toBeDefined();
    });

    it('should assess evidence credibility', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(
        result.evidenceSynthesis.credibilityAssessment.strongEvidence.length
      ).toBeGreaterThan(0);
    });

    it('should handle empty evidence index', () => {
      const emptyEvidence: EvidenceIndex = {
        attachmentIds: [],
        evidence: [],
        summary: 'No evidence',
        timeline: ''
      };

      const result = agent.analyze(mockClassification, emptyEvidence);

      expect(result.evidenceSynthesis.totalCount).toBe(0);
      expect(result.overallStrength).toBe('insufficient');
    });
  });

  describe('Deadline Analysis', () => {
    it('should identify limitation periods for employment', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.deadlineAnalysis.limitationPeriods.length).toBeGreaterThan(0);
    });

    it('should classify urgency based on days remaining', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      result.deadlineAnalysis.criticalDeadlines.forEach(deadline => {
        expect(['critical', 'warning', 'caution', 'info']).toContain(
          deadline.urgencyLevel
        );
      });
    });

    it('should sort deadlines by urgency', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      if (result.deadlineAnalysis.criticalDeadlines.length > 1) {
        const deadlines = result.deadlineAnalysis.criticalDeadlines;
        for (let i = 0; i < deadlines.length - 1; i++) {
          expect(deadlines[i].daysRemaining).toBeLessThanOrEqual(
            deadlines[i + 1].daysRemaining
          );
        }
      }
    });

    it('should generate action timeline', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.deadlineAnalysis.recommendedActionTimeline).toBeDefined();
      expect(result.deadlineAnalysis.recommendedActionTimeline.length).toBeGreaterThan(0);
    });
  });

  describe('Case Strength Assessment', () => {
    it('should rate strong case with good evidence', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      // With 3 pieces of high-credibility evidence, should be at least moderate
      expect(['strong', 'moderate']).toContain(result.overallStrength);
    });

    it('should rate weak case with insufficient evidence', () => {
      const weakEvidence: EvidenceIndex = {
        attachmentIds: [],
        evidence: [],
        summary: 'No evidence',
        timeline: ''
      };

      const result = agent.analyze(mockClassification, weakEvidence);

      expect(result.overallStrength).toBe('insufficient');
    });

    it('should identify timeline gaps', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      // Check if timeline coverage gaps are identified
      expect(Array.isArray(result.evidenceSynthesis.timeline.coverageGaps)).toBe(true);
    });
  });

  describe('Risk and Opportunity Identification', () => {
    it('should identify insufficient evidence as risk', () => {
      const sparseEvidence: EvidenceIndex = {
        attachmentIds: ['att1'],
        evidence: [
          {
            id: 'ev1',
            type: 'communication',
            filename: 'one_email.pdf',
            hash: 'hash1',
            date: '2025-01-10',
            credibilityScore: 0.7,
            tags: ['email']
          }
        ],
        summary: 'Limited evidence',
        timeline: 'Jan 10, 2025'
      };

      const result = agent.analyze(mockClassification, sparseEvidence);

      expect(
        result.riskFactors.some(r => r.includes('Limited evidence'))
      ).toBe(true);
    });

    it('should identify strong evidence as opportunity', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.opportunities.length).toBeGreaterThan(0);
    });

    it('should identify employment-specific risks', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      // Employment cases have specific risks
      expect(result.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskFactors)).toBe(true);
    });
  });

  describe('Alternative Classifications', () => {
    it('should include primary classification in analysis', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.classificationAnalysis.primaryClassification).toBe(
        mockClassification
      );
    });

    it('should have empty alternatives array initially', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(Array.isArray(result.classificationAnalysis.alternativeClassifications)).toBe(true);
    });
  });

  describe('Classification Confidence', () => {
    it('should report confidence score', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.classificationAnalysis.confidence).toBeGreaterThanOrEqual(0);
      expect(result.classificationAnalysis.confidence).toBeLessThanOrEqual(100);
    });

    it('should reflect domain in confidence', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.classificationAnalysis.confidence).toBeGreaterThan(70);
    });
  });

  describe('Narrative Generation', () => {
    it('should include classification in narrative', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.analysisNarrative).toContain('employment');
      expect(result.analysisNarrative).toContain('Ontario');
    });

    it('should include evidence summary in narrative', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.analysisNarrative).toContain('evidence');
    });

    it('should include timeline in narrative', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.analysisNarrative).toContain('Timeline');
    });

    it('should include deadlines in narrative', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.analysisNarrative).toContain('Deadlines') ||
        result.analysisNarrative.toContain('deadline');
    });

    it('should include risks and opportunities in narrative', () => {
      const result = agent.analyze(mockClassification, mockEvidenceIndex);

      expect(result.analysisNarrative).toContain('Risks') ||
        result.analysisNarrative.toContain('risk');
    });
  });

  describe('Different Matter Types', () => {
    it('should handle landlord-tenant classification', () => {
      const ltClassification: MatterClassification = {
        ...mockClassification,
        domain: 'landlordTenant'
      };

      const result = agent.analyze(ltClassification, mockEvidenceIndex);

      expect(result.classificationAnalysis.primaryClassification.domain).toBe(
        'landlordTenant'
      );
    });

    it('should handle criminal classification', () => {
      const criminalClassification: MatterClassification = {
        ...mockClassification,
        domain: 'criminal',
        jurisdiction: 'Ontario'
      };

      const result = agent.analyze(criminalClassification, mockEvidenceIndex);

      expect(result.classificationAnalysis.primaryClassification.domain).toBe(
        'criminal'
      );
    });

    it('should handle civil negligence classification', () => {
      const civilClassification: MatterClassification = {
        ...mockClassification,
        domain: 'civilNegligence'
      };

      const result = agent.analyze(civilClassification, mockEvidenceIndex);

      expect(result.classificationAnalysis.primaryClassification.domain).toBe(
        'civilNegligence'
      );
    });
  });
});
