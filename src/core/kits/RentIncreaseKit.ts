import { BaseKit, KitIntakeData, KitResult } from './BaseKit';
import { MatterClassification } from '../models';
import { ActionPlan, ActionPlanGenerator } from '../actionPlan/ActionPlanGenerator';
import { LimitationPeriodsEngine } from '../limitation/LimitationPeriodsEngine';
import { CostCalculator } from '../cost/CostCalculator';

/**
 * RentIncreaseKit - LTB T1 application guidance with rent calculation validation and evidence requirements
 * 
 * Specialized kit for landlord rent increase disputes:
 * - Validates rent increase compliance with RTA guidelines
 * - Assesses evidence requirements for LTB T1 applications
 * - Calculates filing fees and dispute amount
 * - Generates timeline and action plan
 */
export class RentIncreaseKit extends BaseKit {
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
      'rent-increase-kit',
      'LTB Rent Increase Application Kit',
      'Guidance for landlord rent increase applications with LTB T1 compliance'
    );
    
    this.actionPlanGenerator = actionPlanGenerator || new ActionPlanGenerator();
    this.limitationEngine = limitationEngine || new LimitationPeriodsEngine();
    this.costCalculator = costCalculator || new CostCalculator();
  }

  /**
   * Kit-specific intake processing
   */
  protected async processIntake(data: KitIntakeData): Promise<void> {
    // Extract rent increase details
    const { currentRent, proposedRent, effectiveDate, tenantName, propertyAddress } = data.customFields || {};

    // Validate rent amounts
    if (!currentRent || !proposedRent || proposedRent <= currentRent) {
      throw new Error('Proposed rent must be greater than current rent');
    }

    // Calculate increase percentage
    const increasePercentage = ((proposedRent - currentRent) / currentRent) * 100;
    const increaseAmount = proposedRent - currentRent;

    // Store in system context
    this.updateSystemContext('currentRent', currentRent);
    this.updateSystemContext('proposedRent', proposedRent);
    this.updateSystemContext('increaseAmount', increaseAmount);
    this.updateSystemContext('increasePercentage', increasePercentage);
    this.updateSystemContext('effectiveDate', effectiveDate);
    this.updateSystemContext('tenantName', tenantName);
    this.updateSystemContext('propertyAddress', propertyAddress);
  }

  /**
   * Kit-specific analysis logic
   */
  protected async performAnalysis(): Promise<any> {
    const currentRent = this.state.systemContext.currentRent;
    const proposedRent = this.state.systemContext.proposedRent;
    const effectiveDate = this.state.systemContext.effectiveDate;

    // Check RTA guideline compliance (Ontario rent increase guidelines typically 2-3%)
    const increasePercentage = this.state.systemContext.increasePercentage;
    const complianceStatus = increasePercentage <= 5 ? 'within-guidelines' : 'above-guidelines';

    // Analyze deadline requirements
    const deadlineDays = this.calculateDeadlineCompliance(effectiveDate);
    const deadlineMetStatus = deadlineDays >= 90 ? 'compliant' : 'at-risk';

    // Get LTB-specific limitation periods
    const ltbPeriods = this.limitationEngine.getRelevantPeriods('landlordTenant', 'rent increase application');

    // Assess evidence requirements
    const evidenceRequirements = this.assessEvidenceRequirements();

    return {
      complianceStatus,
      deadlineMetStatus,
      deadlineDays,
      ltbPeriods,
      evidenceRequirements,
      costEstimate: this.calculateCosts(),
    };
  }

  /**
   * Kit-specific document generation
   */
  protected async generateDocuments(): Promise<any[]> {
    const documents = [];

    // Generate LTB T1 application scaffold
    const t1Scaffold = {
      type: 'ltb-t1-application',
      title: 'LTB Form T1 - Landlord Application',
      description: 'Scaffold and guidance for completing LTB Form T1 (Landlord Application)',
      fields: {
        landlordName: this.state.userInputs.customFields?.landlordName,
        tenantName: this.state.systemContext.tenantName,
        propertyAddress: this.state.systemContext.propertyAddress,
        currentRent: this.state.systemContext.currentRent,
        proposedRent: this.state.systemContext.proposedRent,
        effectiveDate: this.state.systemContext.effectiveDate,
      },
      instructions: this.generateT1Instructions(),
    };
    documents.push(t1Scaffold);

    // Generate rent calculation worksheet
    const worksheet = {
      type: 'rent-calculation-worksheet',
      title: 'Rent Increase Calculation Worksheet',
      description: 'Detailed calculation showing current rent, proposed rent, and increase analysis',
      calculations: {
        currentAnnualRent: this.state.systemContext.currentRent * 12,
        proposedAnnualRent: this.state.systemContext.proposedRent * 12,
        annualIncrease: (this.state.systemContext.proposedRent - this.state.systemContext.currentRent) * 12,
        percentageIncrease: this.state.systemContext.increasePercentage.toFixed(2),
      },
    };
    documents.push(worksheet);

    // Generate evidence checklist
    const checklist = {
      type: 'evidence-checklist',
      title: 'Evidence Checklist for Rent Increase Application',
      description: 'Required and recommended documents for LTB T1 application',
      required: [
        'Lease or tenancy agreement showing current rent',
        'Notice of Rent Increase (N1 form) if applicable',
        'Proof of service of rent increase notice (email confirmation, registered mail receipt)',
        'Proof that 90-day notice was given (or valid shorter notice)',
      ],
      recommended: [
        'Payment history showing rent paid amounts and dates',
        'Correspondence with tenant regarding rent increase',
        'Comparable rent data for similar properties (for market-based increases)',
        'Property tax and utility receipts (if claiming increase for capital expenditures)',
      ],
    };
    documents.push(checklist);

    return documents;
  }

  /**
   * Kit-specific guidance generation
   */
  protected async generateGuidance(): Promise<{ actionPlan: ActionPlan; guidance: string }> {
    // Create matter classification for action plan generation
    const classification: MatterClassification = {
      domain: 'landlordTenant',
      pillar: 'Administrative',
      jurisdiction: 'Ontario',
      description: `Rent increase dispute: ${this.state.systemContext.currentRent} → ${this.state.systemContext.proposedRent}/month`,
      urgencyLevel: this.state.systemContext.deadlineDays < 60 ? 'critical' : 'warning',
    };

    // Generate action plan using ActionPlanGenerator
    const actionPlan = await this.actionPlanGenerator.generate(classification);

    // Create kit-specific guidance
    const guidance = `
# LTB Rent Increase Application Guidance

## Current Situation
- **Current Rent**: $${this.state.systemContext.currentRent}/month
- **Proposed Rent**: $${this.state.systemContext.proposedRent}/month
- **Monthly Increase**: $${this.state.systemContext.increaseAmount}/month (${this.state.systemContext.increasePercentage.toFixed(2)}%)
- **Effective Date**: ${this.state.systemContext.effectiveDate}

## Compliance Analysis
${this.state.analysisResult.complianceStatus === 'within-guidelines' 
  ? '✓ Your proposed rent increase appears to comply with RTA guidelines.' 
  : '⚠ Your proposed rent increase exceeds typical RTA guidelines. Tenant may challenge.'}

## Deadline Status
${this.state.analysisResult.deadlineMetStatus === 'compliant'
  ? `✓ You provided the required 90-day notice. You are in compliance.`
  : `⚠ Deadline concern: Only ${this.state.analysisResult.deadlineDays} days notice given. Minimum 90 days required.`}

## Next Steps
1. **Verify 90-Day Notice**: Ensure you provided written notice to tenant at least 90 days before effective date
2. **Gather Evidence**: Collect lease agreement, proof of service, payment history
3. **File with LTB**: Complete and submit LTB Form T1 with all required documents
4. **Attend Hearing**: If tenant disputes, prepare for LTB hearing

## Filing Details
- **LTB Filing Fee**: $53
- **Forum**: Landlord and Tenant Board
- **Timeline**: Typically 4-8 weeks from filing to hearing decision
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
        domain: 'landlordTenant',
        pillar: 'Administrative',
        jurisdiction: 'Ontario',
        description: this.state.userInputs.description,
      },
      actionPlan: this.state.actionPlan!,
      documents: this.state.documents || [],
      guidance: this.state.guidance || '',
      nextSteps: [
        'Review LTB Form T1 scaffold and complete with your information',
        'Gather all required evidence documents',
        'Prepare rent increase calculation worksheet',
        'Submit to LTB with filing fee ($53)',
        'Await hearing date notification',
      ],
      estimatedTimeToComplete: 45, // minutes
    };
  }

  /**
   * Validate rent increase kit-specific intake data
   */
  protected validateIntakeData(data: KitIntakeData): void {
    if (!data.description) {
      throw new Error('Description of rent increase matter is required');
    }

    const { currentRent, proposedRent, effectiveDate } = data.customFields || {};
    
    if (!currentRent || typeof currentRent !== 'number' || currentRent <= 0) {
      throw new Error('Current rent must be a positive number');
    }

    if (!proposedRent || typeof proposedRent !== 'number' || proposedRent <= 0) {
      throw new Error('Proposed rent must be a positive number');
    }

    if (proposedRent <= currentRent) {
      throw new Error('Proposed rent must be greater than current rent');
    }

    if (!effectiveDate) {
      throw new Error('Effective date for rent increase is required');
    }
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Calculate deadline compliance (90-day notice requirement)
   */
  private calculateDeadlineCompliance(effectiveDate: string): number {
    const effective = new Date(effectiveDate);
    const today = new Date();
    const daysUntilEffective = Math.floor((effective.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilEffective;
  }

  /**
   * Assess evidence requirements
   */
  private assessEvidenceRequirements(): string[] {
    return [
      'Lease or tenancy agreement',
      'Notice of Rent Increase (N1)',
      'Proof of service (email, registered mail)',
      'Payment history',
      'Correspondence with tenant',
    ];
  }

  /**
   * Calculate costs and fees
   */
  private calculateCosts(): Record<string, number> {
    return {
      ltbFilingFee: 53,
      estimatedLegalCosts: 0, // Self-service kit
      totalEstimatedCost: 53,
    };
  }

  /**
   * Generate LTB T1 form instructions
   */
  private generateT1Instructions(): string {
    return `
## LTB Form T1 - Landlord Application Instructions

### Box 1: Your Contact Information
- Enter your legal name as landlord
- Provide current address, phone, and email

### Box 2: Tenant Information
- List tenant(s) full legal name
- Address of rental property

### Box 3: Address of Rental Unit
- Complete address where rent increase applies

### Box 4: Reason for Application
- Select: "Rent Increase"
- Provide effective date

### Box 5: Rent Information
- Current monthly rent: [Your Current Rent]
- Proposed monthly rent: [Your Proposed Rent]
- Effective date: [Date]

### Box 6: Supporting Documents
Attach copies of:
- Lease agreement
- Notice of Rent Increase (N1) with proof of service
- Payment history (optional)
    `;
  }
}
