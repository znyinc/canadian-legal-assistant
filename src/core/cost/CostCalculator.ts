/**
 * Cost Calculator and Financial Risk Assessment Engine
 * 
 * Provides transparent cost information for Ontario legal matters:
 * - Filing fees by forum type
 * - Potential cost exposure if losing
 * - Fee waiver eligibility guidance
 * - Financial risk explanations
 * - Cost pathway comparisons
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
 */

export interface CostEstimate {
  forum: string;
  filingFees: {
    amount: number;
    currency: string;
    description: string;
    effectiveDate: string;
    learnMoreUrl?: string;
  };
  otherCosts: {
    name: string;
    estimatedRange: { min: number; max: number };
    description: string;
  }[];
  costAwardRisk: {
    risk: 'low' | 'medium' | 'high';
    explanation: string;
    typicalRange?: { min: number; max: number };
  };
  totalEstimatedCost: {
    min: number;
    max: number;
    explanation: string;
  };
}

export interface FeeWaiverGuidance {
  available: boolean;
  eligibilityCriteria?: {
    incomeThreshold?: number;
    householdSizeAdjustment?: boolean;
    otherFactors?: string[];
  };
  applicationProcess?: {
    formName: string;
    requiredDocuments: string[];
    howToApply: string;
    learnMoreUrl?: string;
  };
  estimatedApprovalChance?: 'low' | 'medium' | 'high';
  encouragement?: string;
}

export interface FinancialRiskAssessment {
  riskLevel: 'minimal' | 'moderate' | 'significant' | 'substantial';
  exposureSummary: string;
  breakdown: {
    category: string;
    risk: 'low' | 'medium' | 'high';
    amount?: { min: number; max: number };
    explanation: string;
  }[];
  recommendations: string[];
  plainLanguageWarning?: string;
}

export interface CostComparison {
  pathways: {
    name: string;
    forum: string;
    estimatedCost: { min: number; max: number };
    timeframe: string;
    pros: string[];
    cons: string[];
  }[];
  recommendation?: string;
}

/**
 * Cost Calculator Engine for Ontario legal matters
 */
export class CostCalculator {
  /**
   * Calculate cost estimate for a specific forum
   */
  calculateCost(forum: string, claimAmount?: number): CostEstimate {
    const forumData = this.getForumCostData(forum);
    
    // Calculate filing fees
    const filingFees = this.calculateFilingFees(forum, claimAmount);
    
    // Other costs (process server, expert witnesses, photocopying, etc.)
    const otherCosts = this.estimateOtherCosts(forum, claimAmount);
    
    // Cost award risk if you lose
    const costAwardRisk = this.assessCostAwardRisk(forum, claimAmount);
    
    // Total estimated cost range
    const minCost = filingFees.amount + (otherCosts.reduce((sum, c) => sum + c.estimatedRange.min, 0));
    const maxCost = filingFees.amount + (otherCosts.reduce((sum, c) => sum + c.estimatedRange.max, 0));
    
    return {
      forum,
      filingFees,
      otherCosts,
      costAwardRisk,
      totalEstimatedCost: {
        min: minCost,
        max: maxCost,
        explanation: `This range includes filing fees and typical out-of-pocket costs. It does NOT include legal fees if you hire a lawyer or paralegal. If you lose, you may also owe cost awards to the other party.`,
      },
    };
  }

  /**
   * Determine fee waiver eligibility and provide guidance
   */
  assessFeeWaiver(forum: string, income?: number, householdSize?: number, hasFinancialHardship?: boolean): FeeWaiverGuidance {
    // LTB: No filing fee, so no waiver needed
    if (forum === 'Landlord and Tenant Board') {
      return {
        available: false,
      };
    }
    
    // Small Claims Court fee waiver (Ontario Works, ODSP, etc.)
    if (forum.includes('Small Claims')) {
      const threshold = this.getFeeWaiverIncomeThreshold(householdSize || 1);
      const availableBecauseIncome = income !== undefined && income < threshold;
      const availableBecauseHardship = hasFinancialHardship === true;
      
      return {
        available: availableBecauseIncome || availableBecauseHardship,
        eligibilityCriteria: {
          incomeThreshold: threshold,
          householdSizeAdjustment: true,
          otherFactors: [
            'Receiving Ontario Works (OW) or Ontario Disability Support Program (ODSP)',
            'Financial hardship due to medical expenses, family crisis, or other circumstances',
            'Income below Low Income Measure (LIM) threshold',
          ],
        },
        applicationProcess: {
          formName: 'Fee Waiver Request',
          requiredDocuments: [
            'Proof of income (pay stubs, tax returns, benefit statements)',
            'Household size documentation',
            'Supporting affidavit explaining financial hardship',
          ],
          howToApply: 'File a Fee Waiver Request with the Small Claims Court clerk when you file your claim or defense. The clerk will review your documentation and make a decision.',
          learnMoreUrl: 'https://www.ontario.ca/page/suing-someone-or-responding-lawsuit',
        },
        estimatedApprovalChance: availableBecauseIncome ? 'high' : availableBecauseHardship ? 'medium' : 'low',
        encouragement: availableBecauseIncome || availableBecauseHardship
          ? "Don't let filing fees stop you from seeking justice - fee waivers exist for exactly this situation"
          : "Fee waivers are available for financial hardship - speak to the court clerk about your situation",
      };
    }
    
    // Superior Court: fee waiver available for financial hardship
    if (forum.includes('Superior Court')) {
      return {
        available: true,
        eligibilityCriteria: {
          otherFactors: [
            'Financial hardship (assessed case-by-case)',
            'Inability to pay fees would deny access to justice',
            'Receiving social assistance',
          ],
        },
        applicationProcess: {
          formName: 'Motion for Fee Waiver',
          requiredDocuments: [
            'Affidavit explaining financial situation',
            'Income and expense documentation',
            'Supporting evidence of hardship',
          ],
          howToApply: 'Bring a motion before a judge requesting a fee waiver. You must demonstrate financial hardship and that paying fees would deny you access to justice.',
          learnMoreUrl: 'https://www.ontariocourts.ca/scj/',
        },
        estimatedApprovalChance: 'medium',
        encouragement: 'Fee waivers are discretionary - present your financial situation honestly and thoroughly',
      };
    }
    
    // HRTO: No filing fee
    if (forum === 'Human Rights Tribunal of Ontario') {
      return { available: false };
    }
    
    // Default: generally not available
    return {
      available: false,
    };
  }

  /**
   * Assess financial risk of pursuing a legal matter
   */
  assessFinancialRisk(
    forum: string,
    claimAmount?: number,
    likelihood?: 'low' | 'medium' | 'high',
    income?: number
  ): FinancialRiskAssessment {
    const costEstimate = this.calculateCost(forum, claimAmount);
    const breakdown: FinancialRiskAssessment['breakdown'] = [];
    
    // Filing fees and out-of-pocket costs
    breakdown.push({
      category: 'Out-of-pocket costs',
      risk: costEstimate.totalEstimatedCost.max > 1000 ? 'medium' : 'low',
      amount: { min: costEstimate.totalEstimatedCost.min, max: costEstimate.totalEstimatedCost.max },
      explanation: `Filing fees, process servers, and photocopying. You pay these regardless of outcome.`,
    });
    
    // Cost award risk if you lose
    if (costEstimate.costAwardRisk.risk !== 'low') {
      breakdown.push({
        category: 'Cost awards if you lose',
        risk: costEstimate.costAwardRisk.risk,
        amount: costEstimate.costAwardRisk.typicalRange,
        explanation: costEstimate.costAwardRisk.explanation,
      });
    }
    
    // Legal fees (if hiring lawyer/paralegal)
    const estLegalFees = this.estimateLegalFees(forum, claimAmount);
    if (estLegalFees.max > 0) {
      breakdown.push({
        category: 'Legal fees (if hiring a lawyer or paralegal)',
        risk: estLegalFees.max > 5000 ? 'high' : estLegalFees.max > 2000 ? 'medium' : 'low',
        amount: estLegalFees,
        explanation: `Professional legal services are optional but can significantly increase costs. Some lawyers offer flat fees or payment plans.`,
      });
    }
    
    // Determine overall risk level
    const totalMaxExposure = breakdown.reduce((sum, b) => sum + (b.amount?.max || 0), 0);
    let riskLevel: FinancialRiskAssessment['riskLevel'];
    if (totalMaxExposure < 1000) riskLevel = 'minimal';
    else if (totalMaxExposure < 5000) riskLevel = 'moderate';
    else if (totalMaxExposure < 15000) riskLevel = 'significant';
    else riskLevel = 'substantial';
    
    // Build recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'significant' || riskLevel === 'substantial') {
      recommendations.push('Consider consulting a lawyer or paralegal before proceeding - the financial risks are high');
    }
    if (costEstimate.costAwardRisk.risk === 'high') {
      recommendations.push('If you lose, you may owe significant cost awards to the other party - assess your chances carefully');
    }
    if (income !== undefined && income < 30000 && totalMaxExposure > 2000) {
      recommendations.push('Explore fee waiver options and consider whether alternative dispute resolution might save costs');
    }
    recommendations.push('Track all expenses carefully - you may need them for cost award claims if you win');
    
    const exposureSummary = `Total financial risk: $${totalMaxExposure.toLocaleString()} (worst case). This includes costs you'll pay regardless of outcome plus potential cost awards if you lose.`;
    
    const plainLanguageWarning = riskLevel === 'substantial'
      ? `This legal action could cost you over $${(totalMaxExposure / 1000).toFixed(0)}k if things go wrong. That's a significant financial risk - make sure you understand what you're getting into.`
      : undefined;
    
    return {
      riskLevel,
      exposureSummary,
      breakdown,
      recommendations,
      plainLanguageWarning,
    };
  }

  /**
   * Compare costs across different legal pathways
   */
  comparePathways(domain: string, claimAmount?: number): CostComparison {
    const pathways: CostComparison['pathways'] = [];
    
    // Example for employment dispute
    if (domain === 'employment') {
      pathways.push({
        name: 'Ministry of Labour Claim (ESA)',
        forum: 'Ministry of Labour',
        estimatedCost: { min: 0, max: 0 },
        timeframe: '3-6 months',
        pros: ['Free to file', 'No lawyer needed', 'Quick process for wage claims under ESA'],
        cons: ['Limited to ESA violations only', 'Cannot claim wrongful dismissal damages', 'No cost awards available'],
      });
      
      pathways.push({
        name: 'Small Claims Court',
        forum: 'Small Claims Court',
        estimatedCost: { min: 200, max: 1500 },
        timeframe: '6-12 months',
        pros: ['Can claim wrongful dismissal up to $50k', 'Can recover cost awards if you win', 'Simplified procedures'],
        cons: ['Filing fees required', 'May need paralegal help', 'Must serve documents yourself'],
      });
      
      pathways.push({
        name: 'Superior Court',
        forum: 'Ontario Superior Court of Justice',
        estimatedCost: { min: 500, max: 10000 },
        timeframe: '12-24 months',
        pros: ['No claim limit', 'Can claim full damages', 'More formal discovery process'],
        cons: ['Higher filing fees', 'Usually requires a lawyer', 'Longer timeline', 'Higher cost award risk'],
      });
    }
    
    // Insurance dispute
    if (domain === 'insurance') {
      pathways.push({
        name: 'Internal Complaint',
        forum: 'Insurer Internal Process',
        estimatedCost: { min: 0, max: 0 },
        timeframe: '30-60 days',
        pros: ['Free', 'Quick first step', 'May resolve without escalation'],
        cons: ['Insurer controls process', 'Limited enforcement power', 'May not be impartial'],
      });
      
      pathways.push({
        name: 'Ombudsman',
        forum: 'General Insurance Ombudservice (GIO)',
        estimatedCost: { min: 0, max: 0 },
        timeframe: '60-90 days',
        pros: ['Free', 'Independent review', 'Can make binding recommendations'],
        cons: ['Non-binding on large claims', 'Limited damages available', 'No cost awards'],
      });
      
      pathways.push({
        name: 'Financial Services Regulatory Authority (FSRA)',
        forum: 'FSRA Complaint',
        estimatedCost: { min: 0, max: 0 },
        timeframe: '3-6 months',
        pros: ['Free', 'Regulatory oversight', 'Can enforce insurer compliance'],
        cons: ['Cannot award damages', 'Focused on regulatory violations', 'Not a dispute resolution service'],
      });
      
      pathways.push({
        name: 'Small Claims Court',
        forum: 'Small Claims Court',
        estimatedCost: { min: 200, max: 1500 },
        timeframe: '6-12 months',
        pros: ['Can claim damages up to $50k', 'Binding decision', 'Cost awards if you win'],
        cons: ['Filing fees', 'Court procedures', 'May need paralegal'],
      });
    }
    
    // Landlord/Tenant
    if (domain === 'landlordTenant') {
      pathways.push({
        name: 'Landlord and Tenant Board (LTB)',
        forum: 'Landlord and Tenant Board',
        estimatedCost: { min: 0, max: 200 },
        timeframe: '2-6 months',
        pros: ['No filing fee', 'Fast-track for some applications', 'Tribunal expertise in L/T law'],
        cons: ['Limited jurisdiction (RTA only)', 'No general damages', 'Hearing delays common'],
      });
      
      if (claimAmount && claimAmount <= 50000) {
        pathways.push({
          name: 'Small Claims Court (for damages outside RTA)',
          forum: 'Small Claims Court',
          estimatedCost: { min: 200, max: 1500 },
          timeframe: '6-12 months',
          pros: ['Can claim general damages', 'Cost awards available', 'Not limited to RTA'],
          cons: ['Filing fees', 'Slower than LTB', 'May need paralegal'],
        });
      }
    }
    
    // General recommendation
    let recommendation: string | undefined;
    if (pathways.length > 1) {
      const freePath = pathways.find(p => p.estimatedCost.max === 0);
      if (freePath) {
        recommendation = `Start with ${freePath.name} - it's free and may resolve your issue without escalating to court. You can always escalate later if needed.`;
      }
    }
    
    return {
      pathways,
      recommendation,
    };
  }

  // Private helper methods
  
  private getForumCostData(forum: string): any {
    // Placeholder for forum-specific cost data
    return {};
  }

  private calculateFilingFees(forum: string, claimAmount?: number): CostEstimate['filingFees'] {
    // Small Claims Court (Ontario, Oct 2025)
    if (forum.includes('Small Claims')) {
      const amount = claimAmount || 0;
      let fee = 0;
      if (amount <= 500) fee = 115;
      else if (amount <= 1000) fee = 145;
      else if (amount <= 2500) fee = 195;
      else if (amount <= 5000) fee = 260;
      else if (amount <= 10000) fee = 295;
      else if (amount <= 50000) fee = 315;
      
      return {
        amount: fee,
        currency: 'CAD',
        description: `Small Claims Court filing fee for claims up to $${amount.toLocaleString()}. Fee varies by claim amount.`,
        effectiveDate: '2025-10-01',
        learnMoreUrl: 'https://www.ontario.ca/page/suing-someone-or-responding-lawsuit',
      };
    }
    
    // Superior Court (Ontario)
    if (forum.includes('Superior Court')) {
      return {
        amount: 270,
        currency: 'CAD',
        description: 'Ontario Superior Court of Justice filing fee (standard action)',
        effectiveDate: '2025-01-01',
        learnMoreUrl: 'https://www.ontariocourts.ca/scj/',
      };
    }
    
    // LTB: No filing fee
    if (forum === 'Landlord and Tenant Board') {
      return {
        amount: 0,
        currency: 'CAD',
        description: 'No filing fee for LTB applications',
        effectiveDate: '2025-01-01',
        learnMoreUrl: 'https://tribunalsontario.ca/ltb/',
      };
    }
    
    // HRTO: No filing fee
    if (forum === 'Human Rights Tribunal of Ontario') {
      return {
        amount: 0,
        currency: 'CAD',
        description: 'No filing fee for HRTO applications',
        effectiveDate: '2025-01-01',
        learnMoreUrl: 'https://tribunalsontario.ca/hrto/',
      };
    }
    
    // Default: unknown
    return {
      amount: 0,
      currency: 'CAD',
      description: 'Filing fee information not available for this forum',
      effectiveDate: '2025-01-01',
    };
  }

  private estimateOtherCosts(forum: string, claimAmount?: number): CostEstimate['otherCosts'] {
    const costs: CostEstimate['otherCosts'] = [];
    
    // Service of documents
    if (forum.includes('Court')) {
      costs.push({
        name: 'Process server',
        estimatedRange: { min: 50, max: 150 },
        description: 'To serve documents on the defendant(s). Required for court proceedings.',
      });
    }
    
    // Photocopying and exhibits
    costs.push({
      name: 'Photocopying and exhibits',
      estimatedRange: { min: 20, max: 200 },
      description: 'Copies of documents, evidence exhibits, and filing materials.',
    });
    
    // Expert witnesses (for complex cases)
    if (claimAmount && claimAmount > 10000) {
      costs.push({
        name: 'Expert witnesses (if needed)',
        estimatedRange: { min: 500, max: 5000 },
        description: 'For medical reports, property appraisals, or technical evidence. Optional but may strengthen your case.',
      });
    }
    
    return costs;
  }

  private assessCostAwardRisk(forum: string, claimAmount?: number): CostEstimate['costAwardRisk'] {
    // Small Claims: Limited cost awards
    if (forum.includes('Small Claims')) {
      return {
        risk: 'low',
        explanation: 'Small Claims Court has limited cost awards - typically representation fees up to 15% of claim amount, plus disbursements.',
        typicalRange: claimAmount ? { min: 0, max: claimAmount * 0.15 } : undefined,
      };
    }
    
    // Superior Court: Substantial cost awards
    if (forum.includes('Superior Court')) {
      return {
        risk: 'high',
        explanation: 'Superior Court can award substantial costs (partial or full indemnity) if you lose. Costs can be $10k-$50k+ depending on case complexity.',
        typicalRange: { min: 5000, max: 50000 },
      };
    }
    
    // LTB/HRTO: No cost awards typically
    if (forum === 'Landlord and Tenant Board' || forum === 'Human Rights Tribunal of Ontario') {
      return {
        risk: 'low',
        explanation: 'Tribunals typically do not award costs. You are unlikely to owe costs if you lose.',
      };
    }
    
    // Default
    return {
      risk: 'medium',
      explanation: 'Cost award risk depends on forum and case complexity. Consult a lawyer for specific advice.',
    };
  }

  private estimateLegalFees(forum: string, claimAmount?: number): { min: number; max: number } {
    // Small Claims: Paralegal or DIY
    if (forum.includes('Small Claims')) {
      return { min: 0, max: 3000 }; // Flat fee paralegals common
    }
    
    // Superior Court: Lawyer typical
    if (forum.includes('Superior Court')) {
      return { min: 5000, max: 25000 }; // Depends heavily on complexity
    }
    
    // LTB: Can go unrepresented
    if (forum === 'Landlord and Tenant Board') {
      return { min: 0, max: 1500 }; // Duty counsel available for free
    }
    
    // HRTO: Can go unrepresented
    if (forum === 'Human Rights Tribunal of Ontario') {
      return { min: 0, max: 2000 };
    }
    
    return { min: 0, max: 5000 };
  }

  private getFeeWaiverIncomeThreshold(householdSize: number): number {
    // Rough LIM (Low Income Measure) threshold for Ontario
    const baseThreshold = 25000;
    const perPersonIncrease = 7000;
    return baseThreshold + (householdSize - 1) * perPersonIncrease;
  }
}
