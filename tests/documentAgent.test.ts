import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentAgent, DocumentRecommendation } from '../src/core/agents/DocumentAgent';
import { MatterClassification, EvidenceIndex } from '../src/core/models';

describe('DocumentAgent', () => {
  let agent: DocumentAgent;
  let mockClassification: MatterClassification;
  let mockEvidenceIndex: EvidenceIndex;

  beforeEach(() => {
    agent = new DocumentAgent();

    mockClassification = {
      id: 'class-123',
      domain: 'landlordTenant',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'tenant',
        respondentType: 'landlord'
      },
      timeline: {
        keyDates: ['2025-01-01'],
        start: '2025-01-01'
      },
      urgency: 'high',
      status: 'classified'
    };

    mockEvidenceIndex = {
      attachmentIds: ['att1', 'att2'],
      evidence: [
        {
          id: 'ev1',
          type: 'lease',
          filename: 'lease_agreement.pdf',
          hash: 'hash1',
          date: '2024-01-01',
          credibilityScore: 0.99,
          tags: ['lease', 'essential']
        },
        {
          id: 'ev2',
          type: 'communication',
          filename: 'landlord_email.pdf',
          hash: 'hash2',
          date: '2025-01-10',
          credibilityScore: 0.85,
          tags: ['communication']
        }
      ],
      summary: 'Landlord-tenant evidence',
      timeline: 'Jan 2024-Jan 2025'
    };
  });

  describe('Document Generation - Core Functionality', () => {
    it('should initialize without errors', () => {
      expect(agent).toBeDefined();
    });

    it('should generate result for landlord-tenant domain', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return object with generationNarrative', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.generationNarrative).toBeDefined();
      expect(typeof result.generationNarrative).toBe('string');
    });

    it('should handle different domains', async () => {
      const domains = ['employment', 'civilNegligence', 'insurance'];

      for (const domain of domains) {
        mockClassification.domain = domain as any;
        const result = await agent.generateDocuments(
          mockClassification,
          mockEvidenceIndex,
          { entries: [], summary: 'Test' }
        );

        expect(result).toBeDefined();
      }
    });

    it('should handle empty evidence', async () => {
      const emptyEvidence: EvidenceIndex = {
        attachmentIds: [],
        evidence: [],
        summary: 'No evidence',
        timeline: ''
      };

      const result = await agent.generateDocuments(
        mockClassification,
        emptyEvidence,
        { entries: [], summary: 'Test' }
      );

      expect(result).toBeDefined();
    });
  });

  describe('Document Recommendations', () => {
    it('should successfully generate documents and return narrative', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result).toBeDefined();
      expect(result.generationNarrative).toBeDefined();
    });

    it('should recommend landlord-tenant specific documents', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      const ltDocuments = result.recommendations.filter(r =>
        r.templateId.includes('ltb') || r.templateId.includes('landlord')
      );

      expect(ltDocuments.length).toBeGreaterThan(0);
    });

    it('should include reading time estimates', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      result.recommendations.forEach(rec => {
        expect(rec.estimatedReadingTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should recommend intake summary for all domains', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      const intakeRecommended = result.recommendations.some(r =>
        r.templateId.includes('intake')
      );

      expect(intakeRecommended).toBe(true);
    });
  });

  describe('Readiness Assessment', () => {
    it('should assess overall readiness percentage', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.readinessAssessment.overallReadiness).toBeGreaterThanOrEqual(0);
      expect(result.readinessAssessment.overallReadiness).toBeLessThanOrEqual(100);
    });

    it('should identify missing information', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(Array.isArray(result.readinessAssessment.missingInformation)).toBe(true);
    });

    it('should provide next steps', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.readinessAssessment.nextSteps).toBeDefined();
      expect(result.readinessAssessment.nextSteps.length).toBeGreaterThan(0);
    });

    it('should recommend evidence gathering when insufficient', async () => {
      const sparseEvidence: EvidenceIndex = {
        attachmentIds: [],
        evidence: [],
        summary: 'No evidence',
        timeline: ''
      };

      const result = await agent.generateDocuments(
        mockClassification,
        sparseEvidence,
        { entries: [], summary: 'Test' }
      );

      expect(result.readinessAssessment.overallReadiness).toBeLessThan(50);
    });
  });

  describe('Domain-Specific Document Generation', () => {
    it('should generate employment-specific documents', async () => {
      const empClassification: MatterClassification = {
        ...mockClassification,
        domain: 'employment'
      };

      const result = await agent.generateDocuments(
        empClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      const empRecommendations = result.recommendations.filter(r =>
        r.templateId.includes('employment') || r.templateId.includes('mol')
      );

      expect(empRecommendations.length).toBeGreaterThan(0);
    });

    it('should generate civil negligence documents', async () => {
      const civilClassification: MatterClassification = {
        ...mockClassification,
        domain: 'civilNegligence'
      };

      const result = await agent.generateDocuments(
        civilClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      const civilRecommendations = result.recommendations.filter(r =>
        r.templateId.includes('civil') || r.templateId.includes('form_7a')
      );

      expect(civilRecommendations.length).toBeGreaterThan(0);
    });

    it('should generate insurance-specific documents', async () => {
      const insClassification: MatterClassification = {
        ...mockClassification,
        domain: 'insurance'
      };

      const result = await agent.generateDocuments(
        insClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      const insRecommendations = result.recommendations.filter(r =>
        r.templateId.includes('insurance')
      );

      expect(insRecommendations.length).toBeGreaterThan(0);
    });

    it('should generate criminal-specific documents', async () => {
      const crimClassification: MatterClassification = {
        ...mockClassification,
        domain: 'criminal'
      };

      const result = await agent.generateDocuments(
        crimClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      const crimRecommendations = result.recommendations.filter(r =>
        r.templateId.includes('criminal')
      );

      expect(crimRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Evidence Manifest', () => {
    it('should include evidence count in manifest', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.packageInput.evidenceManifest.attachmentIds.length).toBe(2);
    });

    it('should include evidence filenames in manifest', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.packageInput.evidenceManifest.filenames.length).toBeGreaterThan(0);
    });

    it('should generate summary for empty evidence', async () => {
      const emptyEvidence: EvidenceIndex = {
        attachmentIds: [],
        evidence: [],
        summary: 'No evidence',
        timeline: ''
      };

      const result = await agent.generateDocuments(
        mockClassification,
        emptyEvidence,
        { entries: [], summary: 'Test' }
      );

      expect(result.packageInput.evidenceManifest.summary).toBeDefined();
    });
  });

  describe('Narrative Generation', () => {
    it('should include matter classification in narrative', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.generationNarrative).toContain('landlordTenant');
    });

    it('should include jurisdiction in narrative', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.generationNarrative).toContain('Ontario');
    });

    it('should include document generation status in narrative', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.generationNarrative).toContain('Document') ||
        result.generationNarrative.toContain('document');
    });

    it('should include readiness assessment in narrative', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.generationNarrative).toContain('Readiness');
    });

    it('should include next steps in narrative', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.generationNarrative).toContain('Next Step') ||
        result.generationNarrative.toContain('next step');
    });
  });

  describe('Template Mapping', () => {
    it('should map variables to template fields', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.packageInput).toBeDefined();
      expect(result.packageInput.domain).toBe('landlordTenant');
    });

    it('should preserve jurisdiction for PDF/A detection', async () => {
      const result = await agent.generateDocuments(
        mockClassification,
        mockEvidenceIndex,
        { entries: [], summary: 'Test' }
      );

      expect(result.packageInput.jurisdiction).toBe('Ontario');
    });
  });
});
