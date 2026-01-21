import { BaseKit, KitIntakeData, KitResult } from './BaseKit';
import { MatterClassification } from '../models';
import { ActionPlan, ActionPlanGenerator } from '../actionPlan/ActionPlanGenerator';
import { LimitationPeriodsEngine } from '../limitation/LimitationPeriodsEngine';

/**
 * WillChallengeKit - Will contest grounds assessment with evidence requirements and probate timeline
 * 
 * Specialized kit for will contests:
 * - Assesses grounds for challenging a will (undue influence, lack of capacity, revocation)
 * - Identifies required evidence for each ground
 * - Integrates probate timeline and deadlines
 * - Provides legal precedent overview
 */
export class WillChallengeKit extends BaseKit {
  private actionPlanGenerator: ActionPlanGenerator;
  private limitationEngine: LimitationPeriodsEngine;

  constructor(
    sessionId?: string,
    userId?: string,
    actionPlanGenerator?: ActionPlanGenerator,
    limitationEngine?: LimitationPeriodsEngine
  ) {
    super(
      'will-challenge-kit',
      'Will Challenge Kit',
      'Assessment and guidance for contesting a will: grounds, evidence, and probate timeline'
    );
    
    this.actionPlanGenerator = actionPlanGenerator || new ActionPlanGenerator();
    this.limitationEngine = limitationEngine || new LimitationPeriodsEngine();
  }

  protected async processIntake(data: KitIntakeData): Promise<void> {
    const {
      deceasedName,
      willExecutedDate,
      deathDate,
      contestGrounds,
      relationshipToDeceased,
      expectedInheritance,
      actualeInheritance,
    } = data.customFields || {};

    if (!deceasedName) {
      throw new Error('Deceased name is required');
    }

    if (!deathDate) {
      throw new Error('Date of death is required');
    }

    this.updateSystemContext('deceasedName', deceasedName);
    this.updateSystemContext('willExecutedDate', willExecutedDate);
    this.updateSystemContext('deathDate', deathDate);
    this.updateSystemContext('contestGrounds', contestGrounds || []);
    this.updateSystemContext('relationshipToDeceased', relationshipToDeceased);
    this.updateSystemContext('expectedInheritance', expectedInheritance || 0);
    this.updateSystemContext('actualInheritance', actualeInheritance || 0);
  }

  protected async performAnalysis(): Promise<any> {
    const grounds = this.state.systemContext.contestGrounds || [];
    const deathDate = this.state.systemContext.deathDate;
    const expectedValue = this.state.systemContext.expectedInheritance;

    // Analyze each ground
    const groundsAnalysis = this.analyzeGrounds(grounds);

    // Calculate probate deadline (6 months from death, often extended to 12 months)
    const probateDeadline = this.calculateProbateDeadline(deathDate);

    // Assess overall strength
    const caseStrength = this.assessChallengeStrength(groundsAnalysis, expectedValue);

    return {
      groundsAnalysis,
      probateTimeline: {
        deathDate,
        probateDeadline,
        timeRemaining: this.calculateTimeRemaining(deathDate),
        urgencyLevel: this.assessUrgency(deathDate),
      },
      caseStrength,
      estimatedLitigationCost: this.estimateCost(caseStrength, expectedValue),
      recommendedAction: this.recommendAction(caseStrength, expectedValue),
    };
  }

  protected async generateDocuments(): Promise<any[]> {
    const documents = [];

    // Grounds assessment checklist
    documents.push({
      type: 'will-grounds-assessment',
      title: 'Will Challenge Grounds Assessment Checklist',
      grounds: {
        undue_influence: {
          definition: 'Deceased was persuaded under pressure or manipulation',
          indicators: [
            'Isolation from family before will execution',
            'Sudden change in will provisions',
            'Beneficiary had unusual influence over deceased',
            'Beneficiary excluded other family members',
            'Deceased was dependent on beneficiary',
          ],
          strength: 'High',
        },
        lack_of_capacity: {
          definition: 'Deceased did not understand the will or consequences',
          indicators: [
            'Dementia or Alzheimer\'s diagnosis before will execution',
            'Medical evidence of cognitive decline',
            'Will inconsistent with earlier versions',
            'Beneficiary not rational choice (no prior relationship)',
            'Will executed during hospitalization',
          ],
          strength: 'High',
        },
        fraud: {
          definition: 'Will was forged or deceptively created',
          indicators: [
            'Handwriting does not match deceased',
            'Signature differs from known examples',
            'Witnesses cannot be located',
            'Beneficiary created or drafted will',
            'Will contradicts documented intentions',
          ],
          strength: 'Very High',
        },
        revocation: {
          definition: 'Will was revoked by subsequent document or act',
          indicators: [
            'Earlier will discovered with revocation clause',
            'Holographic will (handwritten) found with cancellation',
            'Subsequent marriage or divorce (statutory revocation)',
            'Express instruction to revoke discovered',
            'Physical destruction with intent to revoke',
          ],
          strength: 'Very High',
        },
      },
    });

    // Evidence requirements by ground
    documents.push({
      type: 'will-evidence-requirements',
      title: 'Evidence Requirements by Ground of Challenge',
      requirements: {
        undue_influence: [
          'Medical records showing deceased\'s mental state',
          'Testimony from family members re: influence',
          'Financial records showing benefits to beneficiary',
          'Communications (emails, letters) showing pressure',
          'Will preparation documents (drafts, instructions)',
          'Expert psychological evaluation',
        ],
        lack_of_capacity: [
          'Medical records prior to will execution',
          'Cognitive assessment or test results',
          'Testimony from healthcare providers',
          'Prior will versions showing changes',
          'Expert evidence on cognitive capacity',
          'Timeline of cognitive decline',
        ],
        fraud: [
          'Handwriting analysis (forensic expert)',
          'Comparison with authenticated signatures',
          'Witness affidavits on will authenticity',
          'Chain of custody for original will',
          'Communication records pre/post execution',
          'Expert evidence on document authenticity',
        ],
        revocation: [
          'Original subsequent will or document',
          'Witnesses to revocation act or instruction',
          'Marriage/divorce certificate (statutory)',
          'Physical evidence of destruction',
          'Statements by deceased re: revocation intent',
        ],
      },
    });

    // Probate timeline guide
    documents.push({
      type: 'will-probate-timeline',
      title: 'Probate Timeline and Critical Deadlines',
      timeline: {
        'Death': 'Estate administration begins',
        'Week 1-2': 'Notify key beneficiaries, notify creditors, secure assets',
        'Month 1': 'Challenge deadline: Usually must notify court within 30 days of knowledge',
        'Month 2-3': 'Deadline for filing challenge (varies by jurisdiction, typically 6 months)',
        'Month 6': 'Standard probate deadline (often extended)',
        'Month 6-12': 'Challenge proceedings, discovery, settlement discussions',
        'Month 12-24': 'Trial (if unresolved), appeal',
      },
      critical_deadlines: [
        '30 days from knowledge of problematic will',
        '6 months from death to file challenge (varies)',
        '180 days to respond to challenge',
      ],
    });

    // Legal precedent overview
    documents.push({
      type: 'will-legal-precedent',
      title: 'Legal Precedent Overview - Ontario Will Cases',
      precedents: {
        undue_influence: 'Geoff Pegg Test (leading Ontario case on undue influence)',
        lack_of_capacity: 'Banks v Goodfellow Test (gold standard for testamentary capacity)',
        fraud: 'Strict proof required; must overcome presumption of regularity',
        revocation: 'Controlled by Succession Law Reform Act (revivor provisions complex)',
      },
      note: 'Consult with lawyer for specific precedent application',
    });

    return documents;
  }

  protected async generateGuidance(): Promise<{ actionPlan: ActionPlan; guidance: string }> {
    const classification: MatterClassification = {
      domain: 'civil-negligence',
      pillar: 'Civil',
      jurisdiction: 'Ontario',
      description: `Will challenge: Grounds assessment for ${this.state.systemContext.deceasedName}'s estate`,
      urgencyLevel: 'critical',
    };

    const actionPlan = await this.actionPlanGenerator.generate(classification);

    const guidance = `
# Will Challenge Assessment Guide

## Deceased Estate Information
- **Deceased**: ${this.state.systemContext.deceasedName}
- **Date of Death**: ${this.state.systemContext.deathDate}
- **Your Relationship**: ${this.state.systemContext.relationshipToDeceased}
- **Expected Inheritance**: $${this.state.systemContext.expectedInheritance}
- **Actual Inheritance**: $${this.state.systemContext.actualInheritance}

## Critical Probate Deadlines
- **Challenge Filing Deadline**: Within 6 months of death (varies by jurisdiction)
- **Time Remaining**: ${this.state.analysisResult.probateTimeline.timeRemaining}
- **Urgency Level**: ${this.state.analysisResult.probateTimeline.urgencyLevel}

## Grounds Analysis

${this.generateGroundsGuidance(this.state.analysisResult.groundsAnalysis)}

## Case Strength Assessment: ${this.state.analysisResult.caseStrength}

### What This Means
- **Strong**: Likely to succeed, good chance of overturning will
- **Moderate**: Possible to succeed, but will face challenges
- **Weak**: Unlikely to succeed, consider settlement
- **Very Weak**: Not recommended to pursue without strong evidence

## Estimated Litigation Cost
**$${this.state.analysisResult.estimatedLitigationCost}**

This includes:
- Lawyer fees ($5,000-$10,000 minimum)
- Expert evidence (medical, forensic: $2,000-$5,000+)
- Court filing and discovery costs ($1,000-$3,000)
- Trial preparation and appearance ($5,000-$20,000+)

## Recommended Action: ${this.state.analysisResult.recommendedAction}

## Step-by-Step Process

### Phase 1: Immediate (Weeks 1-2)
1. Gather all documents related to will execution
2. Collect medical records from before will date
3. Interview potential witnesses
4. Consult with estate litigation lawyer
5. Review will for inconsistencies

### Phase 2: Assessment (Weeks 2-4)
1. Lawyer reviews evidence strength
2. Obtain expert evaluations if needed
3. Send notice of challenge to estate
4. Gather evidence for grounds of challenge

### Phase 3: Proceedings (Months 2-6)
1. File formal challenge with court
2. Discovery process (exchange documents)
3. Examine witnesses (depositions)
4. Settlement discussions
5. Trial preparation

### Phase 4: Resolution (Months 6-24)
1. Trial (if settlement not reached)
2. Appeal (if desired)
3. Estate distribution per court order

## Settlement Considerations
- Most will contests settle (65-75%)
- Settlement often involves compromise (e.g., increased bequest vs withdraw challenge)
- Mediation can reduce costs significantly
- Earlier settlement better (less legal costs)

## Legal Consultation
**This assessment is informational only. Will contests require professional legal representation.**

Next steps:
1. Schedule consultation with estate litigation lawyer
2. Bring all relevant documents
3. Prepare timeline of events
4. Discuss cost-benefit analysis with lawyer
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
        description: `Will challenge for ${this.state.systemContext.deceasedName}'s estate`,
      },
      actionPlan: this.state.actionPlan!,
      documents: this.state.documents || [],
      guidance: this.state.guidance || '',
      nextSteps: [
        'Gather all documents related to will execution',
        'Collect medical and financial records',
        'Interview potential witnesses',
        'Consult with estate litigation lawyer',
        'Assess case strength and cost-benefit',
        `File formal challenge within deadline (${this.state.analysisResult.probateTimeline.timeRemaining})`,
      ],
      estimatedTimeToComplete: 60,
    };
  }

  protected validateIntakeData(data: KitIntakeData): void {
    if (!data.customFields?.deceasedName) {
      throw new Error('Deceased name is required');
    }
    if (!data.customFields?.deathDate) {
      throw new Error('Date of death is required');
    }
  }

  private analyzeGrounds(grounds: string[]): Record<string, any> {
    const analysis: Record<string, any> = {};

    if (grounds.includes('undue-influence')) {
      analysis.undue_influence = {
        ground: 'Undue Influence',
        description: 'Deceased was pressured or manipulated into will provisions',
        strengthFactor: 0.8,
        commonIndicators: 5,
        evidenceRequired: 'High - medical, witness, financial records',
      };
    }

    if (grounds.includes('lack-of-capacity')) {
      analysis.lack_of_capacity = {
        ground: 'Lack of Capacity',
        description: 'Deceased lacked mental capacity at time of will execution',
        strengthFactor: 0.85,
        commonIndicators: 4,
        evidenceRequired: 'Very High - medical expert evidence critical',
      };
    }

    if (grounds.includes('fraud')) {
      analysis.fraud = {
        ground: 'Fraud',
        description: 'Will was forged or created deceptively',
        strengthFactor: 0.95,
        commonIndicators: 3,
        evidenceRequired: 'Critical - forensic analysis required',
      };
    }

    if (grounds.includes('revocation')) {
      analysis.revocation = {
        ground: 'Revocation',
        description: 'Will was revoked by later document or action',
        strengthFactor: 0.9,
        commonIndicators: 4,
        evidenceRequired: 'High - original document or clear evidence',
      };
    }

    return analysis;
  }

  private calculateProbateDeadline(deathDate: string): string {
    const death = new Date(deathDate);
    const deadline = new Date(death);
    deadline.setMonth(deadline.getMonth() + 6);
    return deadline.toISOString().split('T')[0];
  }

  private calculateTimeRemaining(deathDate: string): string {
    const death = new Date(deathDate);
    const deadline = new Date(death);
    deadline.setMonth(deadline.getMonth() + 6);
    const now = new Date();
    const daysRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'EXPIRED';
    if (daysRemaining < 30) return `${daysRemaining} days (URGENT)`;
    if (daysRemaining < 90) return `${daysRemaining} days (WARNING)`;
    return `${daysRemaining} days`;
  }

  private assessUrgency(deathDate: string): string {
    const death = new Date(deathDate);
    const deadline = new Date(death);
    deadline.setMonth(deadline.getMonth() + 6);
    const now = new Date();
    const daysRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'CRITICAL - EXPIRED';
    if (daysRemaining < 30) return 'CRITICAL';
    if (daysRemaining < 90) return 'HIGH';
    if (daysRemaining < 180) return 'MODERATE';
    return 'LOW';
  }

  private assessChallengeStrength(analysis: Record<string, any>, expectedValue: number): string {
    const groundCount = Object.keys(analysis).length;
    const avgStrength = Object.values(analysis).reduce((sum: number, g: any) => sum + g.strengthFactor, 0) / groundCount;

    if (expectedValue > 100000 && avgStrength > 0.85) return 'Strong';
    if (expectedValue > 50000 && avgStrength > 0.75) return 'Moderate';
    if (expectedValue > 25000 && avgStrength > 0.65) return 'Moderate';
    if (avgStrength > 0.8) return 'Strong';
    if (avgStrength > 0.6) return 'Moderate';
    return 'Weak';
  }

  private estimateCost(strength: string, expectedValue: number): number {
    const baseCost = 10000; // Minimum legal fee
    const expertCost = 3000; // Medical/forensic expert
    const litigationMultiplier = strength === 'Strong' ? 1.5 : strength === 'Moderate' ? 2.0 : 2.5;
    return baseCost + expertCost + (Math.min(expectedValue, 100000) * 0.05 * litigationMultiplier);
  }

  private recommendAction(strength: string, expectedValue: number): string {
    if (strength === 'Strong' && expectedValue > 50000) return 'Pursue Challenge - Proceed to Court';
    if (strength === 'Moderate' && expectedValue > 25000) return 'Negotiate Settlement First';
    if (strength === 'Weak' || expectedValue < 10000) return 'Do Not Pursue - Cost Likely Exceeds Benefit';
    return 'Evaluate Settlement with Lawyer';
  }

  private generateGroundsGuidance(analysis: Record<string, any>): string {
    let guidance = '';
    for (const [key, ground] of Object.entries(analysis)) {
      guidance += `
### ${ground.ground}
${ground.description}

**Strength Factor**: ${(ground.strengthFactor * 100).toFixed(0)}%
**Evidence Required**: ${ground.evidenceRequired}

`;
    }
    return guidance;
  }
}
