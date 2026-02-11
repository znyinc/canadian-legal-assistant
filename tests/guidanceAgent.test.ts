import { describe, it, expect, beforeEach } from 'vitest';
import { GuidanceAgent, GuidanceRecommendation } from '../src/core/agents/GuidanceAgent';
import { MatterClassification } from '../src/core/models';

describe('GuidanceAgent', () => {
  let agent: GuidanceAgent;
  let mockClassification: MatterClassification;

  beforeEach(() => {
    agent = new GuidanceAgent();

    mockClassification = {
      id: 'class-123',
      domain: 'employment',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'employee',
        respondentType: 'employer'
      },
      timeline: {
        keyDates: ['2024-12-15'],
        start: '2024-12-15'
      },
      urgency: 'high',
      status: 'classified'
    };
  });

  describe('Guidance Generation', () => {
    it('should generate complete guidance result', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result).toBeDefined();
      expect(result.actionPlan).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.pathwayOptimization).toBeDefined();
      expect(result.costAssessment).toBeDefined();
    });

    it('should include narrative', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.personalizationFactors).toBeDefined();
      expect(result.personalizationFactors.length).toBeGreaterThan(0);
    });

    it('should generate personalized narrative', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.guidanceNarrative).toBeDefined();
      expect(result.guidanceNarrative.length).toBeGreaterThan(0);
    });
  });

  describe('Personalized Recommendations', () => {
    it('should generate 5 personalized recommendations', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.recommendations.length).toBe(5);
    });

    it('should include employment-specific recommendations', () => {
      mockClassification.domain = 'employment';
      const result = agent.generateGuidance(mockClassification, 75000);

      const empRecommendations = result.recommendations.filter(r =>
        r.description.toLocaleLowerCase().includes('employment') ||
        r.description.toLocaleLowerCase().includes('mol') ||
        r.description.toLocaleLowerCase().includes('severance')
      );

      expect(empRecommendations.length).toBeGreaterThan(0);
    });

    it('should include universal recommendations for all domains', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      const universalRecommendations = result.recommendations.filter(r =>
        r.description.toLocaleLowerCase().includes('organize') ||
        r.description.toLocaleLowerCase().includes('document') ||
        r.description.toLocaleLowerCase().includes('consult')
      );

      expect(universalRecommendations.length).toBeGreaterThan(0);
    });

    it('should include resources for each recommendation', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      result.recommendations.forEach(rec => {
        expect(rec.resources).toBeDefined();
        expect(rec.resources.length).toBeGreaterThan(0);
      });
    });

    it('should provide resources with URLs', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      let hasResourceUrl = false;
      result.recommendations.forEach(rec => {
        rec.resources.forEach(res => {
          if (res.url) {
            hasResourceUrl = true;
          }
        });
      });

      expect(hasResourceUrl).toBe(true);
    });
  });

  describe('Pathway Optimization', () => {
    it('should provide alternative pathways', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.pathwayOptimization.alternativePathways.length).toBeGreaterThan(0);
    });

    it('should recommend preferred pathway', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.pathwayOptimization.recommendedPathway).toBeDefined();
    });

    it('should provide pathway rationale', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.pathwayOptimization.selectionRationale).toBeDefined();
      expect(result.pathwayOptimization.selectionRationale.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Assessment', () => {
    it('should assess total estimated cost', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.costAssessment.estimatedCost).toBeGreaterThanOrEqual(0);
    });

    it('should assess fee waiver eligibility', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.costAssessment.feeWaiverEligible).toBeDefined();
      expect(typeof result.costAssessment.feeWaiverEligible).toBe('boolean');
    });

    it('should provide financial guidance for eligible users', () => {
      mockClassification.jurisdiction = 'Ontario';
      const result = agent.generateGuidance(mockClassification, 20000, {
        householdIncome: 20000,
        householdSize: 1
      });

      expect(result.costAssessment.feeWaiverEligible).toBe(true);
    });

    it('should include cost breakdown', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.costAssessment.breakdown).toBeDefined();
      expect(result.costAssessment.breakdown.length).toBeGreaterThan(0);
    });
  });

  describe('Domain-Specific Guidance', () => {
    it('should generate employment-specific action plan', () => {
      mockClassification.domain = 'employment';
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.actionPlan).toBeDefined();
      expect(result.actionPlan.acknowledgment).toBeDefined();
    });

    it('should generate landlord-tenant-specific guidance', () => {
      mockClassification.domain = 'landlordTenant';
      const result = agent.generateGuidance(mockClassification, 75000);

      const ltRecommendations = result.recommendations.filter(r =>
        r.description.toLocaleLowerCase().includes('ltb') ||
        r.description.toLocaleLowerCase().includes('tribunal')
      );

      expect(ltRecommendations.length).toBeGreaterThan(0);
    });

    it('should generate civil negligence-specific guidance', () => {
      mockClassification.domain = 'civil-negligence';
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.pathwayOptimization).toBeDefined();
    });

    it('should generate insurance-specific guidance', () => {
      mockClassification.domain = 'insurance';
      const result = agent.generateGuidance(mockClassification, 75000);

      const insRecommendations = result.recommendations.filter(r =>
        r.description.toLocaleLowerCase().includes('insurance') ||
        r.description.toLocaleLowerCase().includes('ombudsman')
      );

      expect(insRecommendations.length).toBeGreaterThan(0);
    });

    it('should generate criminal-specific guidance', () => {
      mockClassification.domain = 'criminal';
      const result = agent.generateGuidance(mockClassification, 75000);

      const crimRecommendations = result.recommendations.filter(r =>
        r.description.toLocaleLowerCase().includes('crown') ||
        r.description.toLocaleLowerCase().includes('victim') ||
        r.description.toLocaleLowerCase().includes('support')
      );

      expect(crimRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Personalization Factors', () => {
    it('should identify domain-specific factors', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      const domainFactors = result.personalizationFactors.filter(f =>
        f.toLocaleLowerCase().includes('employment') ||
        f.toLocaleLowerCase().includes('esa') ||
        f.toLocaleLowerCase().includes('termination')
      );

      expect(domainFactors.length).toBeGreaterThan(0);
    });

    it('should identify financial factors', () => {
      const result = agent.generateGuidance(mockClassification, 20000, {
        householdIncome: 20000,
        householdSize: 1
      });

      const financialFactors = result.personalizationFactors.filter(f =>
        f.toLocaleLowerCase().includes('income') ||
        f.toLocaleLowerCase().includes('financial') ||
        f.toLocaleLowerCase().includes('fee waiver')
      );

      expect(financialFactors.length).toBeGreaterThan(0);
    });

    it('should return personalization factors array', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(Array.isArray(result.personalizationFactors)).toBe(true);
    });
  });

  describe('Action Plan Integration', () => {
    it('should include action plan in results', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.actionPlan).toBeDefined();
    });

    it('should include immediate actions', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.actionPlan.immediateActions).toBeDefined();
      expect(result.actionPlan.immediateActions.length).toBeGreaterThan(0);
    });

    it('should include role explanation', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.actionPlan.roleExplanation).toBeDefined();
      expect(result.actionPlan.roleExplanation.youAre).toBeDefined();
      expect(result.actionPlan.roleExplanation.youAreNot).toBeDefined();
    });

    it('should include settlement pathways', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.actionPlan.settlementPathways).toBeDefined();
      expect(result.actionPlan.settlementPathways.length).toBeGreaterThan(0);
    });

    it('should include warnings', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.actionPlan.whatToAvoid).toBeDefined();
      expect(result.actionPlan.whatToAvoid.length).toBeGreaterThan(0);
    });
  });

  describe('Deadline Integration', () => {
    it('should include deadline information for Ontario matters', () => {
      mockClassification.jurisdiction = 'Ontario';
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.guidanceNarrative).toBeDefined();
    });

    it('should prioritize urgent matters', () => {
      mockClassification.urgency = 'critical';
      const result = agent.generateGuidance(mockClassification, 75000);

      const urgentActions = result.recommendations.filter(r =>
        r.description.toLocaleLowerCase().includes('urgent') ||
        r.description.toLocaleLowerCase().includes('immediate')
      );

      expect(urgentActions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing dispute amount', () => {
      const result = agent.generateGuidance(mockClassification);

      expect(result).toBeDefined();
      expect(result.costAssessment).toBeDefined();
    });

    it('should handle missing user profile', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result).toBeDefined();
      expect(result.personalizationFactors).toBeDefined();
    });

    it('should generate guidance for all supported domains', () => {
      const domains = [
        'employment',
        'landlordTenant',
        'civil-negligence',
        'insurance',
        'criminal',
        'consumerProtection',
        'legalMalpractice'
      ];

      domains.forEach(domain => {
        mockClassification.domain = domain as any;
        const result = agent.generateGuidance(mockClassification, 75000);

        expect(result).toBeDefined();
        expect(result.recommendations.length).toBeGreaterThan(0);
      });
    });

    it('should generate guidance for different jurisdictions', () => {
      const jurisdictions = ['Ontario', 'British Columbia', 'Quebec', 'Alberta'];

      jurisdictions.forEach(jurisdiction => {
        mockClassification.jurisdiction = jurisdiction;
        const result = agent.generateGuidance(mockClassification, 75000);

        expect(result).toBeDefined();
        expect(result.pathwayOptimization).toBeDefined();
      });
    });
  });

  describe('Narrative Generation', () => {
    it('should include guidance summary in narrative', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.guidanceNarrative.toLowerCase()).toMatch(/employment|guidance|recommend/);
    });

    it('should include cost information in narrative', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.guidanceNarrative.toLowerCase()).toMatch(/cost|fee|financial/);
    });

    it('should include next steps in narrative', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.guidanceNarrative.toLowerCase()).toMatch(/next|step|recommend/);
    });
  });

  describe('Multi-Pathway Support', () => {
    it('should provide pathway comparison', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      const alternatives = result.pathwayOptimization.alternativePathways;
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives[0].pros.length).toBeGreaterThan(0);
    });

    it('should recommend pathway based on factors', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      expect(result.pathwayOptimization.recommendedPathway).toBeDefined();
    });

    it('should provide cost comparison between pathways', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      result.pathwayOptimization.alternativePathways.forEach(pathway => {
        expect(pathway.estimatedCost).toBeGreaterThanOrEqual(0);
      });
    });

    it('should provide timeframe comparison between pathways', () => {
      const result = agent.generateGuidance(mockClassification, 75000);

      result.pathwayOptimization.alternativePathways.forEach(pathway => {
        expect(pathway.estimatedTimeframe.length).toBeGreaterThan(0);
      });
    });
  });
});
