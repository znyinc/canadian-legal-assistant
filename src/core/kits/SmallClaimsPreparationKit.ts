import { BaseKit, KitIntakeData, KitResult } from './BaseKit';
import { MatterClassification } from '../models';
import { ActionPlan, ActionPlanGenerator } from '../actionPlan/ActionPlanGenerator';
import { FormMappingRegistry } from '../templates/FormMappingRegistry';
import { CostCalculator } from '../cost/CostCalculator';

/**
 * SmallClaimsPreparationKit - Form 7A completion with evidence mapping and cost-benefit analysis
 * 
 * Specialized kit for Small Claims Court preparation:
 * - Analyzes claim amount and eligibility for Small Claims (≤$50,000)
 * - Maps evidence to Form 7A (Statement of Claim) fields
 * - Calculates filing fees and cost-benefit analysis
 * - Generates complete filing package with templates and guidance
 */
export class SmallClaimsPreparationKit extends BaseKit {
  private actionPlanGenerator: ActionPlanGenerator;
  private formRegistry: FormMappingRegistry;
  private costCalculator: CostCalculator;

  constructor(
    sessionId?: string,
    userId?: string,
    actionPlanGenerator?: ActionPlanGenerator,
    formRegistry?: FormMappingRegistry,
    costCalculator?: CostCalculator
  ) {
    super(
      'small-claims-kit',
      'Small Claims Court Preparation Kit',
      'Complete guidance for filing Small Claims Court actions with Form 7A'
    );
    
    this.actionPlanGenerator = actionPlanGenerator || new ActionPlanGenerator();
    this.formRegistry = formRegistry || new FormMappingRegistry();
    this.costCalculator = costCalculator || new CostCalculator();
  }

  /**
   * Kit-specific intake processing
   */
  protected async processIntake(data: KitIntakeData): Promise<void> {
    const {
      claimantName,
      defendantName,
      claimAmount,
      basis,
      incidentDate,
      serviceAddress,
    } = data.customFields || {};

    // Validate claim amount for Small Claims jurisdiction
    if (!claimAmount || typeof claimAmount !== 'number') {
      throw new Error('Claim amount is required and must be a number');
    }

    if (claimAmount > 50000) {
      throw new Error('Small Claims Court limit is $50,000. Your claim exceeds this limit and must be filed in Superior Court.');
    }

    if (claimAmount <= 0) {
      throw new Error('Claim amount must be greater than zero');
    }

    // Store in system context
    this.updateSystemContext('claimantName', claimantName);
    this.updateSystemContext('defendantName', defendantName);
    this.updateSystemContext('claimAmount', claimAmount);
    this.updateSystemContext('basis', basis);
    this.updateSystemContext('incidentDate', incidentDate);
    this.updateSystemContext('serviceAddress', serviceAddress);

    // Calculate filing fee based on amount
    const filingFee = this.calculateFilingFee(claimAmount);
    this.updateSystemContext('filingFee', filingFee);
  }

  /**
   * Kit-specific analysis logic
   */
  protected async performAnalysis(): Promise<any> {
    const claimAmount = this.state.systemContext.claimAmount;
    const filingFee = this.state.systemContext.filingFee;

    // Calculate cost-benefit
    const netRecovery = claimAmount - filingFee;
    const costBenefit = netRecovery > 0 ? 'favorable' : 'unfavorable';

    // Assess claim strength factors
    const strengthFactors = this.assessClaimStrength(this.state.userInputs.description);

    // Get Form 7A field mappings
    const form7aMapping = this.formRegistry.getFormByTitle('Form 7A - Statement of Claim');

    // Analyze evidence mapping
    const evidenceMapping = this.mapEvidenceToForm7A();

    return {
      claimAmount,
      filingFee,
      netRecovery,
      costBenefit,
      strengthFactors,
      form7aMapping,
      evidenceMapping,
      timeline: {
        filing: '1-2 hours',
        serviceOnDefendant: 'Minimum 10 business days notice',
        defendantResponse: '30 days to respond',
        hearingWaitTime: '4-12 weeks',
        totalToResolution: '3-6 months',
      },
    };
  }

  /**
   * Kit-specific document generation
   */
  protected async generateDocuments(): Promise<any[]> {
    const documents = [];

    // Generate Form 7A scaffold
    const form7a = {
      type: 'form-7a-scaffold',
      title: 'Small Claims Court Form 7A - Statement of Claim',
      description: 'Completed scaffold for Form 7A with your information mapped from evidence',
      formNumber: '7A',
      court: 'Ontario Superior Court of Justice - Small Claims',
      fields: {
        claimantName: this.state.systemContext.claimantName,
        claimantAddress: '[Your Address]',
        defendantName: this.state.systemContext.defendantName,
        defendantAddress: this.state.systemContext.serviceAddress,
        claimAmount: `$${this.state.systemContext.claimAmount}`,
        basisOfClaim: this.generateClaimNarrative(),
        reliefSought: `Payment of ${this.state.systemContext.claimAmount} for ${this.state.systemContext.basis}`,
      },
      instructions: this.generateForm7AInstructions(),
    };
    documents.push(form7a);

    // Generate evidence mapping guide
    const evidenceGuide = {
      type: 'evidence-mapping-guide',
      title: 'Evidence Mapping to Form 7A',
      description: 'Guide showing how your evidence documents map to Form 7A requirements',
      mapping: this.state.analysisResult.evidenceMapping,
      instructions: `
For each piece of evidence you collected:
1. Note the evidence type (document, photo, email, text message)
2. Identify which Form 7A box it supports (Box 3, 4, 5)
3. Include a brief reference in your claim narrative
4. Prepare to present or reference during hearing

Example:
- Evidence: Receipt from [Date]
- Supports: Box 4 (Facts)
- Reference: "As evidenced by receipt dated [Date] in Exhibit A"
      `,
    };
    documents.push(evidenceGuide);

    // Generate filing checklist
    const checklist = {
      type: 'small-claims-filing-checklist',
      title: 'Small Claims Court Filing Checklist',
      description: 'Complete checklist for filing with Small Claims Court',
      preFilingSteps: [
        'Confirm defendant identity and service address',
        'Gather all evidence (receipts, contracts, emails, photos)',
        'Complete Form 7A with all required information',
        'Make minimum 3 copies of Form 7A (plus for your records)',
        'Prepare cover letter addressing the Small Claims Clerk',
      ],
      filingRequirements: [
        `Original Form 7A + ${2} copies`,
        'Payment of filing fee: $' + this.state.systemContext.filingFee,
        'Photocopy of evidence (optional but recommended)',
        'Proof of payment/receipt for records',
      ],
      postFilingSteps: [
        'Obtain court file number from Small Claims Clerk',
        'Arrange service of Form 7A on defendant (10 business days minimum notice)',
        'File proof of service with the court',
        'Await defendant response (30-day period)',
        'Prepare for hearing or pre-trial conference',
      ],
    };
    documents.push(checklist);

    // Generate cost-benefit analysis
    const costBenefit = {
      type: 'cost-benefit-analysis',
      title: 'Small Claims Cost-Benefit Analysis',
      description: 'Financial analysis of proceeding with Small Claims action',
      analysis: {
        claimAmount: this.state.systemContext.claimAmount,
        filingFee: this.state.systemContext.filingFee,
        otherCosts: {
          serviceProcess: '0 (self-service) or $50-100 (process server)',
          courtReportTranscript: '0 (optional) or $100-200',
          expertWitness: '0 (if not needed) or $500-2000',
        },
        totalPossibleCosts: this.state.systemContext.filingFee + 100,
        netIfSuccessful: this.state.systemContext.claimAmount - (this.state.systemContext.filingFee + 100),
        recommendation: this.state.analysisResult.costBenefit === 'favorable' 
          ? 'Proceeding is financially justified'
          : 'Consider settlement or alternative resolution',
      },
    };
    documents.push(costBenefit);

    return documents;
  }

  /**
   * Kit-specific guidance generation
   */
  protected async generateGuidance(): Promise<{ actionPlan: ActionPlan; guidance: string }> {
    const classification: MatterClassification = {
      domain: 'civil-negligence',
      pillar: 'Civil',
      jurisdiction: 'Ontario',
      description: `Small Claims action: $${this.state.systemContext.claimAmount} claim for ${this.state.systemContext.basis}`,
      urgencyLevel: 'warning',
    };

    const actionPlan = await this.actionPlanGenerator.generate(classification);

    const guidance = `
# Small Claims Court Preparation Guide

## Your Claim
- **Claimant**: ${this.state.systemContext.claimantName}
- **Defendant**: ${this.state.systemContext.defendantName}
- **Claim Amount**: $${this.state.systemContext.claimAmount}
- **Basis**: ${this.state.systemContext.basis}

## Small Claims Court Overview
- **Jurisdiction**: Claims up to $50,000
- **Venue**: Local Small Claims Court (where defendant resides or where debt occurred)
- **Forum**: Informal, designed for self-representation
- **Judge**: Single judge (no jury)
- **Costs**: Limited recoverable costs ($500-1000 maximum even if you win)

## Cost-Benefit Analysis
- **Filing Fee**: $${this.state.systemContext.filingFee}
- **Claim Amount**: $${this.state.systemContext.claimAmount}
- **Net if Successful**: $${this.state.analysisResult.netRecovery}
- **Assessment**: ${this.state.analysisResult.costBenefit.toUpperCase()}

## Filing Process

### Step 1: Prepare Form 7A (1-2 hours)
Use the Form 7A scaffold provided. Key sections:
- **Box 1**: Your contact information as claimant
- **Box 2**: Defendant information (legal name and address)
- **Box 3**: Facts of the case (clear, concise narrative)
- **Box 4**: Relief sought (specific amount and reason)
- **Box 5**: Signature and date

### Step 2: File with Small Claims Court
- Bring 3 copies of Form 7A
- Pay filing fee: $${this.state.systemContext.filingFee}
- Obtain court file number

### Step 3: Serve the Defendant
- Minimum 10 business days notice required
- Methods: Personal service, mail, courier, or authorized means
- Obtain proof of service

### Step 4: Await Defendant Response
- Defendant has 30 days to respond
- If no response, you may win by default
- If response received, prepare for hearing

### Step 5: Hearing Preparation
- Review all evidence
- Prepare clear presentation of facts
- Bring original documents and copies for judge
- Consider hiring Small Claims paralegals ($200-500)

## Claim Strength Assessment
Your claim factors:
${this.state.analysisResult.strengthFactors.map((f: string) => `- ${f}`).join('\n')}

## Timeline
- Filing: 1-2 hours
- Service on defendant: 1-2 weeks
- Defendant response period: 30 days
- Wait for hearing date: 4-12 weeks (varies by courthouse)
- **Total to Hearing**: 3-6 months typical
- **After hearing**: 1-4 weeks for decision, then enforcement if needed

## Next Steps
1. Complete Form 7A using the scaffold provided
2. Make 3 copies
3. Locate your local Small Claims Court
4. Submit Form 7A with filing fee
5. Arrange service on defendant
6. File proof of service
7. Prepare evidence for hearing
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
        domain: 'civil-negligence',
        pillar: 'Civil',
        jurisdiction: 'Ontario',
        description: this.state.userInputs.description,
      },
      actionPlan: this.state.actionPlan!,
      documents: this.state.documents || [],
      guidance: this.state.guidance || '',
      nextSteps: [
        'Complete Form 7A with all information from scaffold',
        `Prepare 3 copies and gather supporting evidence`,
        `Proceed to Small Claims Court with $${this.state.systemContext.filingFee} filing fee`,
        'Serve defendant with Form 7A (10 business days minimum)',
        'File proof of service with the court',
        'Prepare evidence package for hearing',
        'Attend hearing or consider settlement before trial',
      ],
      estimatedTimeToComplete: 90, // minutes (includes prep and filing)
    };
  }

  /**
   * Validate small claims kit-specific intake data
   */
  protected validateIntakeData(data: KitIntakeData): void {
    if (!data.description) {
      throw new Error('Description of claim is required');
    }

    const { claimAmount, defendantName } = data.customFields || {};

    if (!claimAmount || typeof claimAmount !== 'number' || claimAmount <= 0) {
      throw new Error('Claim amount must be a positive number');
    }

    if (claimAmount > 50000) {
      throw new Error('Claim exceeds Small Claims limit of $50,000');
    }

    if (!defendantName) {
      throw new Error('Defendant name is required');
    }
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Calculate Small Claims Court filing fee based on claim amount
   */
  private calculateFilingFee(claimAmount: number): number {
    if (claimAmount <= 750) return 115;
    if (claimAmount <= 2500) return 145;
    if (claimAmount <= 10000) return 275;
    return 315;
  }

  /**
   * Assess claim strength
   */
  private assessClaimStrength(description: string): string[] {
    const factors: string[] = [];

    if (description.toLowerCase().includes('contract')) {
      factors.push('Written contract exists - strong evidence of agreement');
    }

    if (description.toLowerCase().includes('email') || description.toLowerCase().includes('text')) {
      factors.push('Written communications available - supports terms and fact pattern');
    }

    if (description.toLowerCase().includes('receipt') || description.toLowerCase().includes('invoice')) {
      factors.push('Financial documents available - clear accounting of amounts');
    }

    if (description.toLowerCase().includes('witness')) {
      factors.push('Witnesses available - corroborating testimony possible');
    }

    if (!description.toLowerCase().includes('dispute')) {
      factors.push('Defendant has acknowledged debt - likely default judgment possible');
    }

    if (factors.length === 0) {
      factors.push('Strength assessment pending evidence review');
    }

    return factors;
  }

  /**
   * Map evidence to Form 7A
   */
  private mapEvidenceToForm7A(): Record<string, any> {
    return {
      box3_facts: {
        required: 'Clear statement of what happened, dates, parties involved',
        evidence: ['Emails', 'Contracts', 'Receipts', 'Text messages', 'Photographs'],
      },
      box4_reliefSought: {
        required: 'Specific amount and reason for claim',
        evidence: ['Invoices', 'Quotes', 'Payment records', 'Damage assessments'],
      },
      exhibits: {
        recommended: 'Supporting documents labeled as Exhibits A, B, C, etc.',
        evidence: ['Contracts', 'Receipts', 'Emails', 'Correspondence', 'Photos', 'Medical reports'],
      },
    };
  }

  /**
   * Generate claim narrative for Box 3
   */
  private generateClaimNarrative(): string {
    const incident = this.state.systemContext.incidentDate;
    const basis = this.state.systemContext.basis;
    const amount = this.state.systemContext.claimAmount;

    return `On or about ${incident}, the defendant agreed to [provide service/sell goods/etc.] for $${amount}. The defendant failed to [complete work/deliver goods/etc.] as agreed. As a result, the plaintiff has suffered damages of $${amount}.`;
  }

  /**
   * Generate Form 7A instructions
   */
  private generateForm7AInstructions(): string {
    return `
## How to Complete Form 7A

### Box 1: YOUR INFORMATION
- Legal first and last name
- Mailing address, phone, email

### Box 2: DEFENDANT INFORMATION  
- Legal full name (if business, registered name)
- Service address (where you'll send the claim)
- Phone number if available

### Box 3: FACTS OF YOUR CASE
Write a clear, chronological account:
- What happened?
- When did it happen?
- Who was involved?
- What was agreed?
- What went wrong?
- How much is the debt?

Keep it factual, not emotional. Use dates specifically.

Example: "On January 15, 2024, defendant agreed to repair my roof for $5,000. Work was to be completed by January 31, 2024. Defendant never completed the work. I paid $0 and incurred $5,000 in damages."

### Box 4: RELIEF SOUGHT
State exactly what you want:
- "$5,000 for non-completion of roof repair"
- "Costs of $200 for filing fee"

### Box 5: YOUR SIGNATURE
Sign and date in front of a witness if possible (recommended but not required).

### EXHIBITS
Attach copies (not originals) labeled:
- Exhibit A: Original contract
- Exhibit B: Emails confirming terms
- Exhibit C: Receipt for payment
- Etc.
    `;
  }
}
