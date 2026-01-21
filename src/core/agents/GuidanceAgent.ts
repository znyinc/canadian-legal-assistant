import {
  MatterClassification,
  ActionPlan,
  DeadlineAlert
} from '../models';
import { ActionPlanGenerator } from '../actionPlan/ActionPlanGenerator';
import { LimitationPeriodsEngine, DeadlineAlert as LimitationDeadlineAlert } from '../limitation/LimitationPeriodsEngine';
import { CostCalculator } from '../cost/CostCalculator';

/**
 * Personalized guidance recommendation
 */
export interface GuidanceRecommendation {
  id: string;
  title: string;
  description: string;
  applicability: number; // 0-100, how relevant to this matter
  timeframe: string;
  resources: {
    type: 'document' | 'form' | 'website' | 'phone' | 'organization';
    title: string;
    url?: string;
    phone?: string;
    description: string;
  }[];
}

/**
 * Pathway optimization result
 */
export interface PathwayOptimization {
  recommendedPathway: string;
  alternativePathways: {
    pathway: string;
    pros: string[];
    cons: string[];
    estimatedCost: number;
    estimatedTimeframe: string;
  }[];
  selectionRationale: string;
}

/**
 * Complete guidance result
 */
export interface GuidanceResult {
  actionPlan: ActionPlan;
  recommendations: GuidanceRecommendation[];
  pathwayOptimization: PathwayOptimization;
  costAssessment: {
    estimatedCost: number;
    feeWaiverEligible: boolean;
    costBreakdown: Record<string, number>;
  };
  personalizationFactors: string[];
  guidanceNarrative: string;
}

/**
 * GuidanceAgent: Generates personalized action plans and pathway optimization
 * 
 * Responsibilities:
 * - Generate domain-specific action plans
 * - Provide personalized recommendations based on case specifics
 * - Optimize settlement vs litigation pathways
 * - Calculate costs and fee waiver eligibility
 * - Integrate deadline calculations
 * - Synthesize guidance into actionable narrative
 */
export class GuidanceAgent {
  private actionPlanGenerator: ActionPlanGenerator;
  private limitationEngine: LimitationPeriodsEngine;
  private costCalculator: CostCalculator;

  constructor(
    actionPlanGenerator?: ActionPlanGenerator,
    limitationEngine?: LimitationPeriodsEngine,
    costCalculator?: CostCalculator
  ) {
    this.actionPlanGenerator = actionPlanGenerator ?? new ActionPlanGenerator();
    this.limitationEngine = limitationEngine ?? new LimitationPeriodsEngine();
    this.costCalculator = costCalculator ?? new CostCalculator();
  }

  /**
   * Generate comprehensive guidance for the user
   */
  generateGuidance(
    classification: MatterClassification,
    disputeAmount?: number,
    userProfile?: {
      householdIncome?: number;
      householdSize?: number;
      previousLegalExperience?: boolean;
    }
  ): GuidanceResult {
    // Generate action plan
    const actionPlan = this.actionPlanGenerator.generate(classification);

    // Get personalized recommendations
    const recommendations = this.getPersonalizedRecommendations(classification);

    // Optimize pathways
    const pathwayOptimization = this.optimizePathways(classification, disputeAmount);

    // Assess costs
    const costAssessment = this.assessCosts(classification, disputeAmount, userProfile);

    // Identify personalization factors
    const personalizationFactors = this.identifyPersonalizationFactors(
      classification,
      userProfile
    );

    // Generate narrative
    const guidanceNarrative = this.generateNarrative(
      classification,
      actionPlan,
      recommendations,
      pathwayOptimization,
      costAssessment,
      personalizationFactors
    );

    return {
      actionPlan,
      recommendations,
      pathwayOptimization,
      costAssessment,
      personalizationFactors,
      guidanceNarrative
    };
  }

  /**
   * Get personalized recommendations based on classification
   */
  private getPersonalizedRecommendations(
    classification: MatterClassification
  ): GuidanceRecommendation[] {
    const recommendations: GuidanceRecommendation[] = [];

    // Universal recommendations
    recommendations.push({
      id: 'rec-document-organization',
      title: 'Organize Your Documents',
      description:
        'Create a clear folder structure for all evidence, communications, and documents related to your matter',
      applicability: 100,
      timeframe: 'Week 1',
      resources: [
        {
          type: 'document',
          title: 'Evidence Organization Guide',
          description: 'Step-by-step guide to organizing your materials'
        }
      ]
    });

    recommendations.push({
      id: 'rec-legal-consultation',
      title: 'Consider a Legal Consultation',
      description:
        'Speak with a lawyer to understand your rights, options, and likely outcomes',
      applicability: 85,
      timeframe: 'Week 2-3',
      resources: [
        {
          type: 'organization',
          title: 'Law Society Referral Service',
          url: 'https://www.lsuc.ca/public-services/find-legal-help/find-lawyer',
          description: 'Find a qualified lawyer in your area'
        },
        {
          type: 'organization',
          title: 'Legal Aid Ontario',
          url: 'https://www.legalaidontario.ca/',
          description: 'Free legal services if you qualify'
        }
      ]
    });

    // Domain-specific recommendations
    if (classification.domain === 'landlordTenant') {
      recommendations.push({
        id: 'rec-ltb-preparation',
        title: 'Prepare for LTB Application',
        description:
          'Gather lease, notices, and proof of payments for LTB application',
        applicability: 95,
        timeframe: 'Before application',
        resources: [
          {
            type: 'organization',
            title: 'LTB (Landlord and Tenant Board)',
            url: 'https://www.ontario.ca/page/landlord-and-tenant-board',
            phone: '1-888-332-3234',
            description: 'Official tribunal for landlord-tenant disputes'
          },
          {
            type: 'website',
            title: 'LTB Guide for Tenants',
            url: 'https://www.ontario.ca/page/forms-and-applications',
            description: 'Official forms and guidance'
          }
        ]
      });

      recommendations.push({
        id: 'rec-ltb-hearing',
        title: 'Prepare Your Hearing',
        description:
          'Organize evidence, prepare opening statement, know what to bring to hearing',
        applicability: 90,
        timeframe: 'Before hearing date',
        resources: [
          {
            type: 'website',
            title: 'Preparing for Your Hearing',
            url: 'https://www.ontario.ca/page/preparing-your-hearing',
            description: 'LTB guidance on hearing preparation'
          }
        ]
      });
    }

    if (classification.domain === 'employment') {
      recommendations.push({
        id: 'rec-mol-complaint',
        title: 'File Ministry of Labour Complaint',
        description:
          'If employment standards violated, file complaint with Ministry of Labour',
        applicability: 85,
        timeframe: 'Within 2 years of violation',
        resources: [
          {
            type: 'organization',
            title: 'Ministry of Labour',
            url: 'https://www.ontario.ca/page/ministry-labour',
            phone: '1-800-531-5551',
            description: 'Government agency for employment standards'
          }
        ]
      });

      recommendations.push({
        id: 'rec-severance-negotiation',
        title: 'Negotiate Severance',
        description:
          'Before litigation, consider negotiated settlement with severance package',
        applicability: 80,
        timeframe: 'Within 30 days of termination',
        resources: [
          {
            type: 'website',
            title: 'Severance Negotiation Tips',
            url: 'https://www.ontario.ca/page/severance-and-pay-in-lieu',
            description: 'Understanding severance and pay in lieu'
          }
        ]
      });
    }

    if (classification.domain === 'civilNegligence') {
      recommendations.push({
        id: 'rec-demand-letter',
        title: 'Send Formal Demand Letter',
        description:
          'Send written demand for compensation before litigation',
        applicability: 95,
        timeframe: 'Before 21 days elapse',
        resources: [
          {
            type: 'document',
            title: 'Demand Letter Template',
            description: 'Professional demand letter format'
          }
        ]
      });

      recommendations.push({
        id: 'rec-settlement-negotiation',
        title: 'Explore Settlement Options',
        description:
          'Many cases settle during pre-trial discussions',
        applicability: 88,
        timeframe: 'Ongoing',
        resources: [
          {
            type: 'organization',
            title: 'Mediation Services',
            description: 'Neutral mediator to help reach agreement'
          }
        ]
      });
    }

    if (classification.domain === 'insurance') {
      recommendations.push({
        id: 'rec-internal-complaint',
        title: 'File Internal Complaint',
        description:
          'File formal complaint with insurance company',
        applicability: 98,
        timeframe: 'As soon as possible',
        resources: [
          {
            type: 'document',
            title: 'Internal Complaint Letter',
            description: 'Professional format for internal complaint'
          }
        ]
      });

      recommendations.push({
        id: 'rec-ombudsman',
        title: 'Escalate to Financial Services Ombudsman',
        description:
          'If internal complaint unsuccessful, escalate to FSO',
        applicability: 85,
        timeframe: 'After internal complaint resolution',
        resources: [
          {
            type: 'organization',
            title: 'Financial Services Ombudsman',
            url: 'https://www.fsco.gov.on.ca/en/complaints/Pages/default.aspx',
            description: 'Independent insurance complaint resolution'
          }
        ]
      });
    }

    if (classification.domain === 'criminal') {
      recommendations.push({
        id: 'rec-victim-support',
        title: 'Access Victim Support Services',
        description:
          'Victims and witnesses can access free support services',
        applicability: 90,
        timeframe: 'Immediately available',
        resources: [
          {
            type: 'organization',
            title: 'Victim/Witness Assistance Program (V/WAP)',
            phone: '416-314-2447',
            description: 'Free support for victims and witnesses'
          },
          {
            type: 'organization',
            title: 'Victim Services Ontario',
            url: 'https://www.ontario.ca/page/victim-services',
            description: 'Provincial victim support services'
          }
        ]
      });

      recommendations.push({
        id: 'rec-crown-communication',
        title: 'Stay in Contact with Crown Attorney',
        description:
          'Crown Attorney will handle the prosecution - maintain contact about case status',
        applicability: 85,
        timeframe: 'Throughout proceedings',
        resources: [
          {
            type: 'document',
            title: 'What to Expect in Criminal Court',
            description: 'Overview of criminal process'
          }
        ]
      });
    }

    // Sort by applicability
    recommendations.sort((a, b) => b.applicability - a.applicability);

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Optimize and compare settlement vs litigation pathways
   */
  private optimizePathways(
    classification: MatterClassification,
    disputeAmount?: number
  ): PathwayOptimization {
    let recommendedPathway = 'Settlement Negotiation';
    const alternativePathways: PathwayOptimization['alternativePathways'] = [];

    // Domain-specific pathway analysis
    if (classification.domain === 'landlordTenant') {
      recommendedPathway = 'LTB Application (Informal Tribunal)';

      alternativePathways.push({
        pathway: 'Negotiation with Landlord',
        pros: ['Faster resolution', 'Preserves relationship', 'Lower cost'],
        cons: ['May not resolve dispute', 'Informal agreements risky'],
        estimatedCost: 0,
        estimatedTimeframe: '1-4 weeks'
      });

      alternativePathways.push({
        pathway: 'Small Claims Court',
        pros: ['Formal legal process', 'If amount exceeds $50K'],
        cons: ['More expensive', 'Longer process'],
        estimatedCost: 315,
        estimatedTimeframe: '6-12 months'
      });
    } else if (classification.domain === 'employment') {
      recommendedPathway = 'Negotiated Settlement';

      alternativePathways.push({
        pathway: 'Ministry of Labour Complaint',
        pros: ['Free to file', 'Government investigation'],
        cons: ['Slower process', 'Limited to ESA'],
        estimatedCost: 0,
        estimatedTimeframe: '3-6 months'
      });

      alternativePathways.push({
        pathway: 'Small Claims Court',
        pros: ['Formal proceedings', 'Faster than Superior Court'],
        cons: ['Capped at $35K', 'Filing fees'],
        estimatedCost: 270,
        estimatedTimeframe: '6-12 months'
      });

      alternativePathways.push({
        pathway: 'Superior Court (Wrongful Dismissal)',
        pros: ['Full damages available', 'Can include punitive damages'],
        cons: ['Most expensive', 'Longest timeline', 'Requires lawyer'],
        estimatedCost: 10000,
        estimatedTimeframe: '12-24 months'
      });
    } else if (classification.domain === 'civilNegligence') {
      recommendedPathway = 'Demand & Settlement';

      if (!disputeAmount || disputeAmount < 50000) {
        alternativePathways.push({
          pathway: 'Small Claims Court',
          pros: ['Formal process', 'Simplified rules', 'Lower fees'],
          cons: ['Capped at $50K', 'No lawyer needed but helpful'],
          estimatedCost: 270,
          estimatedTimeframe: '6-12 months'
        });
      } else {
        alternativePathways.push({
          pathway: 'Superior Court',
          pros: ['No monetary limits', 'Full discovery', 'Complex cases'],
          cons: ['High cost', 'Longer process', 'Requires lawyer'],
          estimatedCost: 15000,
          estimatedTimeframe: '18-36 months'
        });
      }

      alternativePathways.push({
        pathway: 'Mediation',
        pros: ['Faster', 'Lower cost', 'Preserves relationship'],
        cons: ['Both parties must agree', 'Non-binding'],
        estimatedCost: 1500,
        estimatedTimeframe: '2-8 weeks'
      });
    } else if (classification.domain === 'insurance') {
      recommendedPathway = 'Internal Complaint & Ombudsman';

      alternativePathways.push({
        pathway: 'Small Claims Court',
        pros: ['Binding decision', 'Court enforcement'],
        cons: ['Cost and time', 'Capped at $50K'],
        estimatedCost: 300,
        estimatedTimeframe: '6-12 months'
      });
    } else if (classification.domain === 'criminal') {
      recommendedPathway = 'Crown-Led Prosecution';

      alternativePathways.push({
        pathway: 'Peace Bond (810 Order)',
        pros: ['Avoids conviction', 'Faster resolution'],
        cons: ['Conditions imposed', 'Conditions cost'],
        estimatedCost: 500,
        estimatedTimeframe: '1-3 months'
      });

      alternativePathways.push({
        pathway: 'Trial',
        pros: ['Full legal process', 'Public hearing'],
        cons: ['Uncertainty', 'Time-consuming', 'May escalate'],
        estimatedCost: 5000,
        estimatedTimeframe: '6-24 months'
      });
    }

    const selectionRationale = this.generatePathwayRationale(
      recommendedPathway,
      classification
    );

    return {
      recommendedPathway,
      alternativePathways,
      selectionRationale
    };
  }

  /**
   * Assess costs and fee waiver eligibility
   */
  private assessCosts(
    classification: MatterClassification,
    disputeAmount?: number,
    userProfile?: any
  ): GuidanceResult['costAssessment'] {
    // Calculate filing fees based on forum type
    const forum = this.getForumType(classification.domain);
    const filingFees = this.costCalculator.calculateCost(forum, disputeAmount || 0);

    // Assess fee waiver eligibility
    const feeWaiverEligible = this.costCalculator.assessFeeWaiver({
      householdIncome: userProfile?.householdIncome || 0,
      householdSize: userProfile?.householdSize || 1,
      jurisdiction: classification.jurisdiction
    }).eligible;

    const costBreakdown: Record<string, number> = {
      'Filing Fees': filingFees.filingFees || 0,
      'Service Fees': filingFees.serviceProcessing || 0,
      'Other Professional': filingFees.other || 0
    };

    const totalCost = Object.values(costBreakdown).reduce((a, b) => a + b, 0);

    return {
      estimatedCost: totalCost,
      feeWaiverEligible,
      costBreakdown
    };
  }

  /**
   * Get forum type for cost calculation
   */
  private getForumType(domain: string): string {
    if (domain === 'landlordTenant') return 'LTB';
    if (domain === 'employment') return 'MOL';
    if (domain === 'civilNegligence' || domain === 'consumerProtection')
      return 'SmallClaims';
    if (domain === 'criminal') return 'Court';
    return 'Other';
  }

  /**
   * Identify personalization factors for this matter
   */
  private identifyPersonalizationFactors(
    classification: MatterClassification,
    userProfile?: any
  ): string[] {
    const factors: string[] = [];

    // Domain-specific factors
    if (classification.domain === 'employment') {
      factors.push('Employment Standards Act applies (2-year limitation)');
      factors.push('Severance negotiation often preferred to litigation');
    }

    if (classification.domain === 'landlordTenant') {
      factors.push('LTB process is informal and no lawyer required');
      factors.push('Tenant protections under Residential Tenancies Act');
    }

    if (classification.domain === 'criminal') {
      factors.push('Crown Attorney controls prosecution');
      factors.push('You are witness, not party to case');
      factors.push('Victim/Witness services available free');
    }

    // Financial factors
    if (userProfile?.householdIncome && userProfile.householdIncome < 30000) {
      factors.push('You may be eligible for legal aid');
      factors.push('Fee waiver may be available for court filings');
    }

    // Experience factors
    if (!userProfile?.previousLegalExperience) {
      factors.push('First-time experience - consider legal consultation');
      factors.push('Templates and guides provided are educational only');
    }

    return factors;
  }

  /**
   * Generate pathway selection rationale
   */
  private generatePathwayRationale(
    recommendedPathway: string,
    classification: MatterClassification
  ): string {
    const rationales: Record<string, string> = {
      'Settlement Negotiation':
        'Most cases settle through negotiation, saving time and money for both parties.',
      'LTB Application (Informal Tribunal)':
        'The LTB is designed for landlord-tenant disputes and is informal (no lawyer required).',
      'Negotiated Settlement':
        'Employment matters often resolve through severance negotiations before litigation.',
      'Demand & Settlement':
        'Many civil negligence cases settle after formal demand letter.',
      'Internal Complaint & Ombudsman':
        'Insurance disputes are best addressed through internal complaint first, then ombudsman if needed.',
      'Crown-Led Prosecution':
        'In criminal matters, the Crown Attorney handles prosecution on behalf of the state.'
    };

    return (
      rationales[recommendedPathway] ||
      'This pathway is recommended for your matter type and circumstances.'
    );
  }

  /**
   * Generate comprehensive guidance narrative
   */
  private generateNarrative(
    classification: MatterClassification,
    actionPlan: ActionPlan,
    recommendations: GuidanceRecommendation[],
    pathwayOptimization: PathwayOptimization,
    costAssessment: GuidanceResult['costAssessment'],
    personalizationFactors: string[]
  ): string {
    let narrative = `
## Your Personalized Guidance Plan

**Matter Type:** ${classification.domain} | **Jurisdiction:** ${classification.jurisdiction}

### Recommended Pathway
**Primary:** ${pathwayOptimization.recommendedPathway}

${pathwayOptimization.selectionRationale}

### Immediate Actions
${actionPlan.immediateActions
      .slice(0, 3)
      .map(
        a =>
          `- **${a.title}** (${a.timeframe}): ${a.description}`
      )
      .join('\n')}

### Your Role in This Matter
${actionPlan.roleExplanation?.summary || 'You are the party seeking resolution of this dispute.'}

**Your Responsibilities:**
${actionPlan.roleExplanation?.responsibilities
      .slice(0, 3)
      .map(r => `- ${r}`)
      .join('\n')}

### Key Resources
${recommendations
      .slice(0, 3)
      .map(r => {
        const resource = r.resources[0];
        return `- **${r.title}**: ${r.description}${resource?.phone ? ` (${resource.phone})` : ''}`;
      })
      .join('\n')}

### Financial Considerations
- **Estimated Cost:** $${costAssessment.estimatedCost.toFixed(2)}
- **Fee Waiver Eligible:** ${costAssessment.feeWaiverEligible ? 'Yes' : 'No'}
- **Cost Breakdown:**
${Object.entries(costAssessment.costBreakdown)
      .map(([item, cost]) => `  - ${item}: $${cost.toFixed(2)}`)
      .join('\n')}

### Personalization Notes
${personalizationFactors.map((f, i) => `${i + 1}. ${f}`).join('\n')}

### Settlement Options
${actionPlan.settlementPathways
      ?.slice(0, 2)
      .map(
        p =>
          `- **${p.title}**: ${p.description}${p.typical ? ' (typical pathway)' : ''}`
      )
      .join('\n') || 'Multiple settlement pathways available.'}

### Important Reminders
${actionPlan.whatToAvoid
      ?.filter((w: any) => w.severity === 'critical')
      .slice(0, 2)
      .map((w: any) => `- ⚠️ ${w.action}: ${w.reason}`)
      .join('\n') || ''}

---

**Disclaimer:** This guidance is for information purposes only and should not be considered legal advice. 
Consult with a qualified legal professional to discuss your specific situation.
    `.trim();

    return narrative;
  }
}
