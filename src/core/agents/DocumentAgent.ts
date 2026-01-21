import {
  MatterClassification,
  DocumentDraft,
  EvidenceIndex,
  SourceManifest
} from '../models';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { DocumentPackager, PackageInput } from '../documents/DocumentPackager';
import { DomainModuleRegistry } from '../domains/DomainModuleRegistry';

/**
 * Document recommendation based on classification and evidence
 */
export interface DocumentRecommendation {
  templateId: string;
  title: string;
  category: 'intake' | 'evidence' | 'demand' | 'application' | 'response' | 'support';
  priority: 'essential' | 'important' | 'helpful';
  description: string;
  estimatedReadingTime: number; // minutes
  requiredEvidence: string[];
  relatedDocuments: string[];
}

/**
 * Template mapping for evidence grounding
 */
export interface TemplateMappingResult {
  templateId: string;
  title: string;
  variables: Record<string, string | number | boolean>;
  missingVariables: string[];
  evidenceGaps: string[];
  readinessScore: number; // 0-100
}

/**
 * Document generation result
 */
export interface DocumentGenerationResult {
  documents: DocumentDraft[];
  recommendations: DocumentRecommendation[];
  packageInput: PackageInput;
  readinessAssessment: {
    overallReadiness: number; // 0-100
    missingInformation: string[];
    nextSteps: string[];
  };
  generationNarrative: string;
}

/**
 * DocumentAgent: Manages context-aware template selection and evidence grounding
 * 
 * Responsibilities:
 * - Recommend relevant documents based on classification and evidence
 * - Select and map domain-specific templates
 * - Ground templates with user evidence
 * - Identify missing information
 * - Assess document generation readiness
 * - Package documents for user consumption
 */
export class DocumentAgent {
  private templates: TemplateLibrary;
  private packager: DocumentPackager;
  private domainRegistry: DomainModuleRegistry;

  constructor(
    templates?: TemplateLibrary,
    packager?: DocumentPackager,
    domainRegistry?: DomainModuleRegistry
  ) {
    this.templates = templates ?? new TemplateLibrary();
    this.packager = packager ?? new DocumentPackager(this.templates);
    this.domainRegistry = domainRegistry ?? new DomainModuleRegistry();
  }

  /**
   * Generate documents based on classification and evidence
   */
  async generateDocuments(
    classification: MatterClassification,
    evidenceIndex: EvidenceIndex,
    sourceManifest: SourceManifest,
    forumMap: string = '',
    timeline: string = '',
    missingEvidenceChecklist: string = ''
  ): Promise<DocumentGenerationResult> {
    // Get domain-specific documents
    const domainModule = this.domainRegistry.get(classification.domain);
    const domainDrafts: DocumentDraft[] = [];

    if (domainModule) {
      try {
        const output = domainModule.generate(classification);
        domainDrafts.push(...output.documents);
      } catch (error) {
        // Log error but continue - can generate standard documents
        console.warn(`Failed to generate domain documents for ${classification.domain}:`, error);
      }
    }

    // Get document recommendations
    const recommendations = this.getDocumentRecommendations(
      classification,
      evidenceIndex
    );

    // Assess template mappings for evidence grounding
    const templateMappings = this.assessTemplateMappings(
      classification,
      evidenceIndex
    );

    // Assess readiness for document generation
    const readinessAssessment = this.assessReadiness(
      classification,
      evidenceIndex,
      templateMappings
    );

    // Prepare package input
    const packageInput: PackageInput = {
      packageName: `${classification.domain}_package_${Date.now()}`,
      forumMap,
      timeline,
      missingEvidenceChecklist,
      drafts: domainDrafts,
      sourceManifest,
      evidenceManifest: {
        attachmentIds: evidenceIndex.evidence?.map((e, i) => `attach_${i}`) || [],
        filenames: evidenceIndex.evidence?.map(e => e.filename || '') || [],
        summary: this.generateEvidenceManifestSummary(evidenceIndex),
        timeline
      },
      jurisdiction: classification.jurisdiction,
      domain: classification.domain
    };

    // Generate narrative
    const generationNarrative = this.generateNarrative(
      classification,
      domainDrafts,
      recommendations,
      readinessAssessment
    );

    return {
      documents: domainDrafts,
      recommendations,
      packageInput,
      readinessAssessment,
      generationNarrative
    };
  }

  /**
   * Get document recommendations for this matter
   */
  private getDocumentRecommendations(
    classification: MatterClassification,
    evidence: EvidenceIndex
  ): DocumentRecommendation[] {
    const recommendations: DocumentRecommendation[] = [];

    // Universal recommendations
    recommendations.push({
      templateId: 'universal/matter_intake',
      title: 'Matter Intake Summary',
      category: 'intake',
      priority: 'essential',
      description: 'Document your matter details, parties, and timeline',
      estimatedReadingTime: 5,
      requiredEvidence: [],
      relatedDocuments: []
    });

    // Domain-specific recommendations
    if (classification.domain === 'landlordTenant') {
      recommendations.push({
        templateId: 'ltb/t1_application',
        title: 'LTB T1 Application (Tenant Application)',
        category: 'application',
        priority: 'essential',
        description: 'Apply to LTB for non-payment or maintenance issues',
        estimatedReadingTime: 15,
        requiredEvidence: ['lease', 'notices', 'communications'],
        relatedDocuments: ['ltb/evidence_checklist']
      });

      recommendations.push({
        templateId: 'ltb/evidence_package',
        title: 'Evidence Organization Guide',
        category: 'evidence',
        priority: 'important',
        description: 'Organize your lease, notices, and communications',
        estimatedReadingTime: 10,
        requiredEvidence: ['lease', 'notices'],
        relatedDocuments: []
      });
    }

    if (classification.domain === 'employment') {
      recommendations.push({
        templateId: 'employment/mol_complaint',
        title: 'Ministry of Labour Complaint',
        category: 'application',
        priority: 'important',
        description: 'File complaint with Ministry of Labour about employment standards',
        estimatedReadingTime: 10,
        requiredEvidence: ['employment_contract', 'pay_records'],
        relatedDocuments: []
      });

      recommendations.push({
        templateId: 'employment/demand_letter',
        title: 'Formal Demand Letter',
        category: 'demand',
        priority: 'important',
        description: 'Send formal demand before legal proceedings',
        estimatedReadingTime: 8,
        requiredEvidence: ['communications', 'employment_records'],
        relatedDocuments: []
      });
    }

    if (classification.domain === 'civilNegligence') {
      recommendations.push({
        templateId: 'civil/demand_notice',
        title: 'Demand Notice',
        category: 'demand',
        priority: 'essential',
        description: 'Send formal demand for compensation',
        estimatedReadingTime: 8,
        requiredEvidence: ['incident_photos', 'communication'],
        relatedDocuments: ['civil/evidence_checklist']
      });

      recommendations.push({
        templateId: 'civil/form_7a',
        title: 'Small Claims Form 7A (Statement of Claim)',
        category: 'application',
        priority: 'essential',
        description: 'File with Small Claims Court if demand not accepted',
        estimatedReadingTime: 12,
        requiredEvidence: ['incident_photos', 'communication'],
        relatedDocuments: []
      });
    }

    if (classification.domain === 'insurance') {
      recommendations.push({
        templateId: 'insurance/internal_complaint',
        title: 'Internal Complaint Letter',
        category: 'demand',
        priority: 'essential',
        description: 'File complaint directly with insurance company',
        estimatedReadingTime: 10,
        requiredEvidence: ['policy', 'claim_communication'],
        relatedDocuments: []
      });

      recommendations.push({
        templateId: 'insurance/ombudsman_complaint',
        title: 'Insurance Ombudsman Complaint',
        category: 'application',
        priority: 'important',
        description: 'Escalate to Financial Services Ombudsman',
        estimatedReadingTime: 10,
        requiredEvidence: ['policy', 'claim_communication', 'denial_letter'],
        relatedDocuments: []
      });
    }

    if (classification.domain === 'criminal') {
      recommendations.push({
        templateId: 'criminal/police_report',
        title: 'Police Report Summary',
        category: 'evidence',
        priority: 'essential',
        description: 'Organize police report and occurrence details',
        estimatedReadingTime: 5,
        requiredEvidence: [],
        relatedDocuments: []
      });

      recommendations.push({
        templateId: 'criminal/evidence_checklist',
        title: 'Evidence Checklist',
        category: 'evidence',
        priority: 'important',
        description: 'Gather medical records, photos, witness information',
        estimatedReadingTime: 8,
        requiredEvidence: [],
        relatedDocuments: []
      });
    }

    // Prioritize by importance
    recommendations.sort((a, b) => {
      const priorityOrder = { essential: 0, important: 1, helpful: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return recommendations;
  }

  /**
   * Assess how well templates map to available evidence
   */
  private assessTemplateMappings(
    classification: MatterClassification,
    evidence: EvidenceIndex
  ): TemplateMappingResult[] {
    const mappings: TemplateMappingResult[] = [];

    // Standard mapping for all domains
    const standardVariables = {
      claimantName: '',
      respondentName: '',
      incidentDate: '',
      incidentDescription: '',
      claimAmount: '',
      jurisdictionName: classification.jurisdiction
    };

    const evidenceTypes = new Set(evidence.evidence?.map(e => e.type) || []);
    const missingEvidence: string[] = [];

    if (!evidenceTypes.has('identity')) missingEvidence.push('Identity documents');
    if (!evidenceTypes.has('communication')) missingEvidence.push('Communications/correspondence');

    mappings.push({
      templateId: 'universal/matter_intake',
      title: 'Matter Intake Summary',
      variables: standardVariables,
      missingVariables: ['claimantName', 'respondentName', 'incidentDate'],
      evidenceGaps: missingEvidence,
      readinessScore: 40
    });

    // Domain-specific template mappings
    if (classification.domain === 'employment') {
      const employmentVariables = {
        ...standardVariables,
        employerName: '',
        employmentStartDate: '',
        employmentEndDate: '',
        positionTitle: '',
        terminationReason: '',
        severanceOffered: ''
      };

      const employmentMissing: string[] = [];
      if (!evidenceTypes.has('employment_records')) employmentMissing.push('Employment records/contract');
      if (!evidenceTypes.has('pay_records')) employmentMissing.push('Pay stubs/salary information');

      mappings.push({
        templateId: 'employment/mol_complaint',
        title: 'MOL Complaint',
        variables: employmentVariables,
        missingVariables: ['employerName', 'positionTitle', 'employmentStartDate'],
        evidenceGaps: employmentMissing,
        readinessScore: evidence.evidence?.length ? 60 : 30
      });
    }

    if (classification.domain === 'landlordTenant') {
      const ltbVariables = {
        ...standardVariables,
        landlordName: '',
        tenantName: '',
        propertyAddress: '',
        leaseStartDate: '',
        rentAmount: '',
        issueType: ''
      };

      const ltbMissing: string[] = [];
      if (!evidenceTypes.has('lease')) ltbMissing.push('Lease agreement');
      if (!evidenceTypes.has('notices')) ltbMissing.push('Notices from landlord');
      if (!evidenceTypes.has('financial')) ltbMissing.push('Rent payment records');

      mappings.push({
        templateId: 'ltb/t1_application',
        title: 'LTB T1 Application',
        variables: ltbVariables,
        missingVariables: ['landlordName', 'propertyAddress', 'rentAmount'],
        evidenceGaps: ltbMissing,
        readinessScore: evidence.evidence?.length ? 50 : 20
      });
    }

    if (classification.domain === 'civilNegligence') {
      const civilVariables = {
        ...standardVariables,
        injuryDescription: '',
        damageDescription: '',
        repairCost: '',
        medicalCost: ''
      };

      const civilMissing: string[] = [];
      if (!evidenceTypes.has('incident_photos')) civilMissing.push('Incident photos');
      if (!evidenceTypes.has('medical')) civilMissing.push('Medical records');

      mappings.push({
        templateId: 'civil/form_7a',
        title: 'Form 7A Statement of Claim',
        variables: civilVariables,
        missingVariables: ['incidentDate', 'damageDescription', 'claimAmount'],
        evidenceGaps: civilMissing,
        readinessScore: evidence.evidence?.length ? 60 : 30
      });
    }

    return mappings;
  }

  /**
   * Assess overall readiness for document generation
   */
  private assessReadiness(
    classification: MatterClassification,
    evidence: EvidenceIndex,
    templateMappings: TemplateMappingResult[]
  ): DocumentGenerationResult['readinessAssessment'] {
    const avgReadiness =
      templateMappings.reduce((sum, t) => sum + t.readinessScore, 0) /
      templateMappings.length;

    const missingInformation: string[] = [];
    templateMappings.forEach(mapping => {
      mapping.missingVariables.forEach(v => {
        if (!missingInformation.includes(v)) {
          missingInformation.push(v);
        }
      });
    });

    const nextSteps: string[] = [];
    if (avgReadiness < 50) {
      nextSteps.push('Gather more evidence - current documentation is limited');
    } else if (avgReadiness < 70) {
      nextSteps.push('Fill in missing information fields in your matter profile');
    } else {
      nextSteps.push('Review generated documents and customize as needed');
    }

    if (missingInformation.length > 0) {
      nextSteps.push(
        `Provide the following information: ${missingInformation.slice(0, 3).join(', ')}`
      );
    }

    nextSteps.push('Consider consulting a legal professional to review documents');

    return {
      overallReadiness: Math.round(avgReadiness),
      missingInformation,
      nextSteps
    };
  }

  /**
   * Generate evidence manifest summary
   */
  private generateEvidenceManifestSummary(evidenceIndex: EvidenceIndex): string {
    if (!evidenceIndex.evidence || evidenceIndex.evidence.length === 0) {
      return 'No evidence uploaded yet.';
    }

    const typeCount: Record<string, number> = {};
    evidenceIndex.evidence.forEach(e => {
      const type = e.type || 'other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const typeSummary = Object.entries(typeCount)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');

    return `${evidenceIndex.evidence.length} pieces of evidence: ${typeSummary}`;
  }

  /**
   * Generate document generation narrative
   */
  private generateNarrative(
    classification: MatterClassification,
    documents: DocumentDraft[],
    recommendations: DocumentRecommendation[],
    readiness: DocumentGenerationResult['readinessAssessment']
  ): string {
    let narrative = `
## Document Generation Summary

**Matter Classification:** ${classification.domain} | **Jurisdiction:** ${classification.jurisdiction}

### Documents Generated
${documents.length > 0 ? `${documents.length} document(s) ready for review:` : 'No domain-specific documents generated yet.'}
${documents.map(d => `- ${d.title || d.id}`).join('\n')}

### Recommended Documents
${recommendations.slice(0, 3).map(r => `- **${r.title}** (${r.category}): ${r.description}`).join('\n')}

### Readiness Assessment
**Overall Readiness: ${readiness.overallReadiness}%**

${readiness.missingInformation.length > 0 ? `**Missing Information:** ${readiness.missingInformation.slice(0, 3).join(', ')}` : 'All key information provided.'}

### Next Steps
${readiness.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

**Note:** These documents are for information purposes only and should be reviewed by a qualified legal professional before submission.
    `.trim();

    return narrative;
  }
}
