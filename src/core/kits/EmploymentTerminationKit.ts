import { BaseKit, KitIntakeData, KitResult } from './BaseKit';
import { MatterClassification } from '../models';
import { ActionPlan, ActionPlanGenerator } from '../actionPlan/ActionPlanGenerator';
import { LimitationPeriodsEngine } from '../limitation/LimitationPeriodsEngine';
import { CostCalculator } from '../cost/CostCalculator';

/**
 * EmploymentTerminationKit - ESA vs wrongful dismissal analysis with severance calculation and timeline guidance
 * 
 * Specialized kit for employment termination disputes:
 * - Analyzes wrongful dismissal vs ESA termination pay scenarios
 * - Calculates severance and termination pay under ESA
 * - Assesses grounds for human rights or tort claims
 * - Generates MOL complaint or court action timeline
 */
export class EmploymentTerminationKit extends BaseKit {
  private actionPlanGenerator: ActionPlanGenerator;
  private limitationEngine: LimitationPeriodsEngine;
  private costCalculator: CostCalculator;

  constructor(
    sessionId?: string,
    userId?: string,
    actionPlanGenerator?: ActionPlanGenerator,
    limitationEngine?: LimitationPeriodsEngine,
    costCalculator?: CostCalculator
  ) {
    super(
      'employment-termination-kit',
      'Employment Termination Analysis Kit',
      'Guidance for wrongful dismissal, severance, and termination pay disputes'
    );
    
    this.actionPlanGenerator = actionPlanGenerator || new ActionPlanGenerator();
    this.limitationEngine = limitationEngine || new LimitationPeriodsEngine();
    this.costCalculator = costCalculator || new CostCalculator();
  }

  /**
   * Kit-specific intake processing
   */
  protected async processIntake(data: KitIntakeData): Promise<void> {
    const {
      employeeName,
      employerName,
      terminationDate,
      lastDateWorked,
      yearsOfService,
      salaryPerYear,
      cause,
      severanceReceived,
      noticeGiven,
    } = data.customFields || {};

    // Validate termination details
    if (!terminationDate || !yearsOfService || yearsOfService < 0) {
      throw new Error('Valid termination date and years of service are required');
    }

    // Store in system context
    this.updateSystemContext('employeeName', employeeName);
    this.updateSystemContext('employerName', employerName);
    this.updateSystemContext('terminationDate', terminationDate);
    this.updateSystemContext('lastDateWorked', lastDateWorked);
    this.updateSystemContext('yearsOfService', yearsOfService);
    this.updateSystemContext('salaryPerYear', salaryPerYear || 0);
    this.updateSystemContext('cause', cause);
    this.updateSystemContext('severanceReceived', severanceReceived || 0);
    this.updateSystemContext('noticeGiven', noticeGiven || false);
  }

  /**
   * Kit-specific analysis logic
   */
  protected async performAnalysis(): Promise<any> {
    const yearsOfService = this.state.systemContext.yearsOfService;
    const salary = this.state.systemContext.salaryPerYear;
    const cause = this.state.systemContext.cause;
    const severanceReceived = this.state.systemContext.severanceReceived;

    // Calculate ESA entitlements
    const esaTerminationPay = this.calculateESATerminationPay(yearsOfService, salary);
    const esaSeverancePay = this.calculateESASeverancePay(yearsOfService, salary);
    const esaNoticeRequirement = this.calculateESANotice(yearsOfService);

    // Assess wrongful dismissal exposure
    const wrongfulDismissalStatus = this.assessWrongfulDismissal(cause, severanceReceived, yearsOfService);

    // Get employment-specific limitation periods
    const empPeriods = this.limitationEngine.getRelevantPeriods('employment', `termination: ${cause}`);

    // Calculate shortfall if any
    const totalESAEntitlement = esaTerminationPay + esaSeverancePay;
    const shortfall = Math.max(0, totalESAEntitlement - severanceReceived);

    return {
      esaAnalysis: {
        terminationPay: esaTerminationPay,
        severancePay: esaSeverancePay,
        totalEntitlement: totalESAEntitlement,
        noticeRequired: esaNoticeRequirement,
      },
      wrongfulDismissal: wrongfulDismissalStatus,
      shortfall,
      limitationPeriods: empPeriods,
      recommendedPathway: this.recommendPathway(shortfall, wrongfulDismissalStatus),
    };
  }

  /**
   * Kit-specific document generation
   */
  protected async generateDocuments(): Promise<any[]> {
    const documents = [];

    // Generate ESA calculation worksheet
    const esaWorksheet = {
      type: 'esa-entitlement-worksheet',
      title: 'ESA Entitlement Calculation Worksheet',
      description: 'Detailed breakdown of termination pay and severance pay under Employment Standards Act',
      calculations: {
        yearsOfService: this.state.systemContext.yearsOfService,
        termPayPerWeek: this.state.analysisResult.esaAnalysis.terminationPay / 52,
        termPayTotal: this.state.analysisResult.esaAnalysis.terminationPay,
        severancePayPerWeek: this.state.analysisResult.esaAnalysis.severancePay / 52,
        severancePayTotal: this.state.analysisResult.esaAnalysis.severancePay,
        totalOwed: this.state.analysisResult.esaAnalysis.totalEntitlement,
        alreadyReceived: this.state.systemContext.severanceReceived,
        shortfall: this.state.analysisResult.shortfall,
      },
    };
    documents.push(esaWorksheet);

    // Generate MOL complaint template
    const molComplaint = {
      type: 'mol-complaint-template',
      title: 'Ministry of Labour Complaint Template',
      description: 'Template for filing complaint with Ontario Ministry of Labour for unpaid wages',
      sections: {
        employeeInfo: {
          name: this.state.systemContext.employeeName,
          address: '[Your Address]',
        },
        employerInfo: {
          name: this.state.systemContext.employerName,
          address: '[Employer Address]',
        },
        complaint: `I was terminated on ${this.state.systemContext.terminationDate} after ${this.state.systemContext.yearsOfService} years of service. Under the Employment Standards Act, I am entitled to:
- Termination pay: $${this.state.analysisResult.esaAnalysis.terminationPay}
- Severance pay: $${this.state.analysisResult.esaAnalysis.severancePay}
- Total: $${this.state.analysisResult.esaAnalysis.totalEntitlement}

I received only $${this.state.systemContext.severanceReceived}, leaving a shortfall of $${this.state.analysisResult.shortfall}.

I request that the Ministry of Labour investigate this matter and recover the unpaid wages.`,
      },
    };
    documents.push(molComplaint);

    // Generate wrongful dismissal evidence checklist
    const checklist = {
      type: 'employment-evidence-checklist',
      title: 'Employment Termination Evidence Checklist',
      description: 'Required evidence for MOL complaint or wrongful dismissal claim',
      required: [
        'Employment contract or offer letter',
        'Termination letter or notice',
        'Final paystub(s) showing severance paid',
        'Employment records (emails, performance reviews)',
        'Proof of any cause alleged by employer',
        'Record of years of service (dates employed)',
      ],
      recommended: [
        'Communication with employer about severance negotiations',
        'HR correspondence',
        'Text messages or emails related to termination',
        'Witness statements from colleagues',
        'Job search efforts and mitigation attempts',
        'New employment start date (for mitigation credit)',
      ],
    };
    documents.push(checklist);

    // Generate settlement negotiation guide
    const negotiationGuide = {
      type: 'settlement-negotiation-guide',
      title: 'Severance Negotiation Guide',
      description: 'Strategies for negotiating enhanced severance package',
      sections: {
        baseClaim: `Based on ${this.state.systemContext.yearsOfService} years of service, your ESA minimum entitlement is $${this.state.analysisResult.esaAnalysis.totalEntitlement}`,
        negotiationStrategy: `
Typical negotiation framework for severance packages:
- ESA minimum: ${this.state.analysisResult.esaAnalysis.terminationPay} (termination pay) + ${this.state.analysisResult.esaAnalysis.severancePay} (severance)
- Enhanced package: 1-2 weeks per year of service (common market rate)
- Maximum exposure: 2-3 years salary (worst-case litigation scenario)

Your leverage: Years of service (${this.state.systemContext.yearsOfService}), ESA entitlements, wrongful dismissal risk`,
        timeline: 'Most employers settle within 2-4 weeks of initial contact',
      },
    };
    documents.push(negotiationGuide);

    return documents;
  }

  /**
   * Kit-specific guidance generation
   */
  protected async generateGuidance(): Promise<{ actionPlan: ActionPlan; guidance: string }> {
    const classification: MatterClassification = {
      domain: 'employment',
      pillar: 'Civil',
      jurisdiction: 'Ontario',
      description: `Employment termination: ${this.state.analysisResult.recommendedPathway} pathway recommended`,
      urgencyLevel: 'warning',
    };

    const actionPlan = await this.actionPlanGenerator.generate(classification);

    const guidance = `
# Employment Termination Analysis

## Your Situation
- **Employment Duration**: ${this.state.systemContext.yearsOfService} years
- **Termination Date**: ${this.state.systemContext.terminationDate}
- **Severance Received**: $${this.state.systemContext.severanceReceived}

## ESA Entitlements
**Your minimum legal entitlements under the Employment Standards Act:**
- **Termination Pay**: $${this.state.analysisResult.esaAnalysis.terminationPay}
- **Severance Pay**: $${this.state.analysisResult.esaAnalysis.severancePay}
- **Total Owed**: $${this.state.analysisResult.esaAnalysis.totalEntitlement}

${this.state.analysisResult.shortfall > 0 ? `**Shortfall: $${this.state.analysisResult.shortfall}**` : '**You appear to have received minimum entitlements.**'}

## Recommended Pathway
**${this.state.analysisResult.recommendedPathway.toUpperCase()}**

${this.state.analysisResult.wrongfulDismissal.riskLevel === 'high' 
  ? `
### Wrongful Dismissal Risk
Your termination may qualify as wrongful dismissal if:
- You were terminated without cause but not given reasonable notice/severance
- Your years of service warrant enhanced notice period (typically 2-3 months per year)
- Common law entitlements typically exceed ESA minimums

**Your exposure for common law claim**: Estimated 2-3 years salary ($${(this.state.systemContext.salaryPerYear * 2.5).toLocaleString()})
  `
  : `
### Wrongful Dismissal Assessment
Based on available information, your wrongful dismissal risk appears moderate to low. However, this depends on:
- Reasons provided for termination
- Your employment history and performance
- Whether you signed any releases
  `}

## Next Steps
1. **Gather Evidence**: Collect employment contract, termination letter, paystubs, performance reviews
2. **Calculate Entitlements**: Use the ESA calculation worksheet to verify amounts owed
3. **Send Formal Demand**: Write to employer requesting payment within 10 business days
4. **File MOL Complaint**: If no response, file with Ministry of Labour (free to worker)
5. **Consider Legal Action**: For significant shortfalls or wrongful dismissal, consult employment lawyer

## Timeline & Deadlines
- **MOL Complaint**: Must be filed within 2 years of termination
- **Court Action**: 2-year limitation period from last wage payment
- **Settlement Talks**: Most effective within 4-8 weeks of termination
    `;

    return { actionPlan, guidance };
  }

  /**
   * Kit-specific result finalization
   */
  protected async finalizeResults(): Promise<KitResult> {
    return {
      kitId: this.kitId,
      sessionId: this.state.sessionId,
      classification: {
        domain: 'employment',
        pillar: 'Civil',
        jurisdiction: 'Ontario',
        description: this.state.userInputs.description,
      },
      actionPlan: this.state.actionPlan!,
      documents: this.state.documents || [],
      guidance: this.state.guidance || '',
      nextSteps: [
        `File ESA entitlement worksheet showing $${this.state.analysisResult.shortfall} owing`,
        'Send formal demand letter to employer with 10-day response deadline',
        'If no response, file complaint with Ontario Ministry of Labour (no fee)',
        'Document all communications and gather employment records',
        'Consider settlement negotiation or legal action if claim is significant',
      ],
      estimatedTimeToComplete: 60, // minutes
    };
  }

  /**
   * Validate employment termination kit-specific intake data
   */
  protected validateIntakeData(data: KitIntakeData): void {
    if (!data.description) {
      throw new Error('Description of employment termination is required');
    }

    const { yearsOfService, terminationDate } = data.customFields || {};

    if (yearsOfService === undefined || typeof yearsOfService !== 'number' || yearsOfService < 0) {
      throw new Error('Years of service must be a non-negative number');
    }

    if (!terminationDate) {
      throw new Error('Termination date is required');
    }
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Calculate ESA termination pay (2 weeks for <3 months, 1 week for 3 months+)
   */
  private calculateESATerminationPay(yearsOfService: number, salary: number): number {
    if (yearsOfService < 0.25) {
      return 0; // Less than 3 months: no termination pay
    }
    // Termination pay: 2 weeks pay
    const weeklyRate = salary / 52;
    return weeklyRate * 2;
  }

  /**
   * Calculate ESA severance pay (1 week per year, max 26 weeks)
   */
  private calculateESASeverancePay(yearsOfService: number, salary: number): number {
    if (yearsOfService < 1) {
      return 0; // Less than 1 year: no severance pay
    }
    const weeklyRate = salary / 52;
    const weeksOfSeverage = Math.min(yearsOfService, 26);
    return weeklyRate * weeksOfSeverage;
  }

  /**
   * Calculate ESA notice requirement (1 week for 3 months+, 2 weeks for 2 years+)
   */
  private calculateESANotice(yearsOfService: number): string {
    if (yearsOfService < 0.25) return '0 weeks';
    if (yearsOfService < 2) return '2 weeks';
    return '2 weeks (or pay in lieu)';
  }

  /**
   * Assess wrongful dismissal risk
   */
  private assessWrongfulDismissal(cause: string, severanceReceived: number, yearsOfService: number): { riskLevel: string; factors: string[] } {
    const factors: string[] = [];

    if (!cause || cause.toLowerCase() === 'no reason' || cause.toLowerCase() === 'without cause') {
      factors.push('Terminated without stated cause - likely entitled to notice or pay in lieu');
    }

    if (severanceReceived === 0) {
      factors.push('No severance provided - strong wrongful dismissal indicator');
    }

    if (yearsOfService >= 3) {
      factors.push(`${yearsOfService} years of service - typical common law notice: ${Math.min(yearsOfService * 2, 24)} months`);
    }

    const riskLevel = severanceReceived === 0 && yearsOfService > 1 ? 'high' : 'moderate';

    return { riskLevel, factors };
  }

  /**
   * Recommend pathway based on analysis
   */
  private recommendPathway(shortfall: number, wrongfulDismissal: { riskLevel: string }): string {
    if (shortfall > 10000 || wrongfulDismissal.riskLevel === 'high') {
      return 'Legal Action (Employment Lawyer)';
    } else if (shortfall > 1000) {
      return 'MOL Complaint + Settlement Negotiation';
    } else {
      return 'MOL Complaint or Direct Settlement';
    }
  }
}
