import { BaseKit, KitIntakeData, KitResult } from './BaseKit';
import { MatterClassification } from '../models';
import { ActionPlan, ActionPlanGenerator } from '../actionPlan/ActionPlanGenerator';
import { CostCalculator } from '../cost/CostCalculator';

/**
 * MotorVehicleAccidentKit - DC-PD vs tort claim analysis with insurance coordination and settlement evaluation
 * 
 * Specialized kit for motor vehicle accident disputes:
 * - Analyzes Direct Compensation Property Damage (DC-PD) vs tort claim options
 * - Calculates claim value (medical, property, loss of income)
 * - Coordinates with insurance coverage and thresholds
 * - Evaluates settlement offers vs litigation
 */
export class MotorVehicleAccidentKit extends BaseKit {
  private actionPlanGenerator: ActionPlanGenerator;
  private costCalculator: CostCalculator;

  constructor(
    sessionId?: string,
    userId?: string,
    actionPlanGenerator?: ActionPlanGenerator,
    costCalculator?: CostCalculator
  ) {
    super(
      'motor-vehicle-accident-kit',
      'Motor Vehicle Accident Claim Kit',
      'Guidance for motor vehicle accident claims: DC-PD, insurance, and tort options'
    );
    
    this.actionPlanGenerator = actionPlanGenerator || new ActionPlanGenerator();
    this.costCalculator = costCalculator || new CostCalculator();
  }

  protected async processIntake(data: KitIntakeData): Promise<void> {
    const {
      accidentDate,
      yourVehicleDamage,
      otherVehicleDamage,
      medicalInjuries,
      incomeLoss,
      faultPercentage,
      insurancePolicy,
      deductible,
    } = data.customFields || {};

    if (!accidentDate) {
      throw new Error('Accident date is required');
    }

    this.updateSystemContext('accidentDate', accidentDate);
    this.updateSystemContext('yourVehicleDamage', yourVehicleDamage || 0);
    this.updateSystemContext('otherVehicleDamage', otherVehicleDamage || 0);
    this.updateSystemContext('medicalInjuries', medicalInjuries || 0);
    this.updateSystemContext('incomeLoss', incomeLoss || 0);
    this.updateSystemContext('faultPercentage', faultPercentage || 100);
    this.updateSystemContext('insurancePolicy', insurancePolicy);
    this.updateSystemContext('deductible', deductible || 500);
  }

  protected async performAnalysis(): Promise<any> {
    const yourDamage = this.state.systemContext.yourVehicleDamage;
    const medicalClaims = this.state.systemContext.medicalInjuries;
    const incomeLoss = this.state.systemContext.incomeLoss;
    const fault = this.state.systemContext.faultPercentage;

    // Calculate total claim value
    const totalClaimValue = yourDamage + medicalClaims + incomeLoss;
    const recoveryableAmount = (totalClaimValue * (100 - fault)) / 100;

    // Analyze DC-PD vs tort
    const dcpdEligible = this.state.systemContext.yourVehicleDamage > 0;
    const tortClaimEligible = medicalClaims > 0 || incomeLoss > 0;

    return {
      claimValue: {
        propertyDamage: yourDamage,
        medicalDamages: medicalClaims,
        incomeLoss: incomeLoss,
        total: totalClaimValue,
        recoverable: recoveryableAmount,
      },
      pathways: {
        dcpd: {
          eligible: dcpdEligible,
          description: 'Direct Compensation Property Damage (insurance coverage)',
          advantages: ['Fast', 'No-fault', 'Coverage up to policy limit'],
          disadvantages: ['Deductible applies', 'Property damage only'],
        },
        tort: {
          eligible: tortClaimEligible,
          description: 'Tort claim for non-pecuniary (pain and suffering) damages',
          advantages: ['Covers medical and income loss', 'No deductible', 'Pain and suffering'],
          disadvantages: ['Fault-based', 'May require litigation', 'Threshold requirements'],
        },
      },
      insuranceAnalysis: {
        deductible: this.state.systemContext.deductible,
        afterDeductible: Math.max(0, yourDamage - this.state.systemContext.deductible),
      },
      recommendedPathway: this.recommendAccidentPathway(dcpdEligible, tortClaimEligible, recoveryableAmount),
    };
  }

  protected async generateDocuments(): Promise<any[]> {
    const documents = [];

    // Claim value calculation
    documents.push({
      type: 'accident-claim-calculation',
      title: 'Motor Vehicle Accident Claim Calculation',
      calculation: {
        propertyDamage: this.state.systemContext.yourVehicleDamage,
        deductible: this.state.systemContext.deductible,
        netPropertyClaim: Math.max(0, this.state.systemContext.yourVehicleDamage - this.state.systemContext.deductible),
        medicalDamages: this.state.systemContext.medicalInjuries,
        incomeLoss: this.state.systemContext.incomeLoss,
        total: this.state.analysisResult.claimValue.total,
      },
    });

    // Insurance claim template
    documents.push({
      type: 'insurance-claim-letter',
      title: 'Insurance Claim Letter Template',
      description: 'Template for submitting claim to insurance company',
      sections: {
        policyNumber: '[Your Policy Number]',
        claimContent: `
I am writing to file a claim under my policy for a motor vehicle accident that occurred on ${this.state.systemContext.accidentDate}.

Vehicle damage estimate: $${this.state.systemContext.yourVehicleDamage}
Deductible: $${this.state.systemContext.deductible}
Net claim: $${Math.max(0, this.state.systemContext.yourVehicleDamage - this.state.systemContext.deductible)}

I will provide repair quotes and documentation upon request.
        `,
      },
    });

    // Evidence checklist
    documents.push({
      type: 'accident-evidence-checklist',
      title: 'Motor Vehicle Accident Evidence Checklist',
      required: [
        'Police accident report (if available)',
        'Insurance policy details',
        'Repair estimate or invoice',
        'Photos of vehicle damage',
        'Contact information of other driver and witnesses',
        'Medical reports (if injured)',
        'Pay stubs showing income loss',
      ],
    });

    return documents;
  }

  protected async generateGuidance(): Promise<{ actionPlan: ActionPlan; guidance: string }> {
    const classification: MatterClassification = {
      domain: 'civil-negligence',
      pillar: 'Civil',
      jurisdiction: 'Ontario',
      description: `Motor vehicle accident: Claim value $${this.state.analysisResult.claimValue.total}`,
      urgencyLevel: 'warning',
    };

    const actionPlan = await this.actionPlanGenerator.generate(classification);

    const guidance = `
# Motor Vehicle Accident Claim Guide

## Your Accident Summary
- **Date**: ${this.state.systemContext.accidentDate}
- **Your Vehicle Damage**: $${this.state.systemContext.yourVehicleDamage}
- **Medical Injuries/Costs**: $${this.state.systemContext.medicalInjuries}
- **Income Loss**: $${this.state.systemContext.incomeLoss}
- **Your Fault**: ${this.state.systemContext.faultPercentage}%

## Total Claim Value: $${this.state.analysisResult.claimValue.total}
### Recoverable Amount (adjusted for fault): $${this.state.analysisResult.claimValue.recoverable}

## Claim Pathways

### Path 1: DC-PD Claim (Direct Compensation)
**Property damage only, no-fault coverage**
- Your deductible: $${this.state.systemContext.deductible}
- After deductible: $${this.state.analysisResult.insuranceAnalysis.afterDeductible}
- **Best for**: Pure property damage claims under policy limit

### Path 2: Tort Claim (Fault-based)
**Covers medical, income loss, pain and suffering**
- Requires proving other driver at fault
- Can recover pain and suffering (typically $2,500-$50,000)
- Subject to injury severity thresholds
- **Best for**: Significant medical expenses or serious injury

## Recommended Pathway: ${this.state.analysisResult.recommendedPathway}

## Step-by-Step Process

### Immediate (First 48 hours)
1. Ensure safety of all parties
2. Call police for accident report
3. Photograph vehicle damage and scene
4. Get witness contact information
5. Exchange information with other driver

### Short-term (1-2 weeks)
1. Report to insurance company
2. Obtain police accident report
3. Seek medical attention if injured
4. Collect repair quotes
5. Document income loss

### Medium-term (2-8 weeks)
1. Submit DC-PD claim with documentation
2. Follow up on insurance claim status
3. Gather medical reports and invoices
4. Evaluate settlement offer

## Settlement Considerations
- Insurance may offer DC-PD settlement (property damage only)
- If serious injury, consider litigation for tort damages
- Most motor vehicle cases settle without trial
- Average settlement time: 3-6 months

## Next Steps
1. File claim with insurance within required timeframe
2. Gather all documentation for claim support
3. If dissatisfied with initial offer, request review
4. Consider legal consultation for claims over $10,000
    `;

    return { actionPlan, guidance };
  }

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
        'File DC-PD claim with insurance (if property damage)',
        'Obtain police accident report',
        'Collect repair quotes and medical documentation',
        'Submit claim with all required evidence',
        'Evaluate insurance settlement offer',
        `Consider legal consultation for claims over $10,000`,
      ],
      estimatedTimeToComplete: 45,
    };
  }

  protected validateIntakeData(data: KitIntakeData): void {
    if (!data.description) {
      throw new Error('Description of accident is required');
    }
    if (!data.customFields?.accidentDate) {
      throw new Error('Accident date is required');
    }
  }

  private recommendAccidentPathway(dcpdEligible: boolean, tortEligible: boolean, recoverable: number): string {
    if (recoverable > 10000 && tortEligible) return 'Legal Consultation + Tort Claim';
    if (dcpdEligible) return 'DC-PD Insurance Claim';
    if (tortEligible) return 'Tort Claim through Insurance';
    return 'Insurance Review + Potential Legal Action';
  }
}
