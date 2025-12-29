/**
 * Ontario limitation periods database and deadline calculator.
 * Based on the Limitations Act, 2002, S.O. 2002, c. 24, Sched. B.
 */

export type UrgencyLevel = 'critical' | 'warning' | 'caution' | 'info';

export interface LimitationPeriod {
  id: string;
  name: string;
  description: string;
  period: string; // Human-readable (e.g., "2 years", "10 days")
  periodDays: number;
  jurisdiction: 'ontario' | 'federal' | 'common';
  category: 'general' | 'municipal' | 'employment' | 'property' | 'personal-injury' | 'contract' | 'statutory';
  triggers: string[]; // What starts the clock
  exceptions?: string[];
  consequence: string;
  learnMoreUrl?: string;
}

export interface DeadlineAlert {
  urgency: UrgencyLevel;
  daysRemaining: number;
  limitationPeriod: LimitationPeriod;
  message: string;
  actionRequired: string;
  encouragement?: string;
}

export class LimitationPeriodsEngine {
  private periods: Map<string, LimitationPeriod>;

  constructor() {
    this.periods = new Map();
    this.loadOntarioPeriods();
  }

  private loadOntarioPeriods(): void {
    const ontarioPeriods: LimitationPeriod[] = [
      // General limitation period (most common)
      {
        id: 'ontario-general-2-year',
        name: 'General Limitation Period',
        description: 'Default limitation period for most civil claims in Ontario',
        period: '2 years',
        periodDays: 730,
        jurisdiction: 'ontario',
        category: 'general',
        triggers: [
          'When you discovered the claim (or should have discovered it)',
          'When you knew or ought to have known: harm occurred, caused by act/omission, and legal proceeding would be appropriate',
        ],
        consequence: 'After 2 years, you cannot start a lawsuit. The court will dismiss your claim as "statute-barred."',
        learnMoreUrl: 'https://www.ontario.ca/laws/statute/02l24',
      },
      
      // Municipal notice requirements
      {
        id: 'ontario-municipal-10-day',
        name: 'Municipal Notice of Claim (Property Damage)',
        description: 'Notice requirement before suing a municipality for property damage (e.g., tree damage, road defects)',
        period: '10 days',
        periodDays: 10,
        jurisdiction: 'ontario',
        category: 'municipal',
        triggers: [
          'Within 10 days after the damage occurred',
          'Notice must be in writing and describe the location, date, and nature of damage',
        ],
        exceptions: [
          'If you have a reasonable excuse for the delay, the court may extend the deadline',
          'Personal injury claims have different notice periods (see Municipal Act, 2001)',
        ],
        consequence: 'Missing the 10-day notice deadline may prevent you from suing the municipality. You must show a reasonable excuse to proceed.',
        learnMoreUrl: 'https://www.ontario.ca/laws/statute/01m25',
      },
      
      {
        id: 'ontario-municipal-personal-injury',
        name: 'Municipal Notice of Claim (Personal Injury)',
        description: 'Notice requirement before suing a municipality for personal injury',
        period: '10 days',
        periodDays: 10,
        jurisdiction: 'ontario',
        category: 'municipal',
        triggers: [
          'Within 10 days after the injury occurred',
          'Notice must be in writing and describe when, where, and how the injury happened',
        ],
        exceptions: [
          'Court may excuse late notice if you have a reasonable excuse',
        ],
        consequence: 'Late notice may bar your claim against the municipality unless you can show a reasonable excuse.',
        learnMoreUrl: 'https://www.ontario.ca/laws/statute/01m25',
      },
      
      // Employment law
      {
        id: 'ontario-esa-complaint',
        name: 'Employment Standards Complaint',
        description: 'Time limit to file a complaint with the Ministry of Labour for unpaid wages or other Employment Standards Act violations',
        period: '2 years',
        periodDays: 730,
        jurisdiction: 'ontario',
        category: 'employment',
        triggers: [
          'Within 2 years of when the wages became due or the violation occurred',
        ],
        consequence: 'After 2 years, the Ministry cannot investigate or order the employer to pay.',
        learnMoreUrl: 'https://www.ontario.ca/document/your-guide-employment-standards-act-0/filing-claim',
      },
      
      {
        id: 'ontario-wrongful-dismissal',
        name: 'Wrongful Dismissal Claim',
        description: 'Time limit to sue for wrongful dismissal (common law claim, not ESA)',
        period: '2 years',
        periodDays: 730,
        jurisdiction: 'ontario',
        category: 'employment',
        triggers: [
          'From the date of termination or constructive dismissal',
        ],
        consequence: 'After 2 years, you cannot sue for wrongful dismissal.',
      },
      
      // Landlord and Tenant
      {
        id: 'ontario-ltb-application',
        name: 'Landlord and Tenant Board Application',
        description: 'Time limits for filing applications at the LTB vary by application type',
        period: 'Varies (1 year typical)',
        periodDays: 365,
        jurisdiction: 'ontario',
        category: 'property',
        triggers: [
          'Tenant: Usually 1 year from when issue arose (e.g., maintenance, rent rebate)',
          'Landlord: Varies by application type (eviction, rent arrears, damages)',
        ],
        exceptions: [
          'Some applications have shorter deadlines (e.g., rent increase disputes)',
          'Check specific LTB forms for exact timelines',
        ],
        consequence: 'Late applications may be dismissed by the LTB.',
        learnMoreUrl: 'https://tribunalsontario.ca/ltb/',
      },
      
      // Personal injury
      {
        id: 'ontario-personal-injury-general',
        name: 'Personal Injury Claim',
        description: 'General limitation period for personal injury claims (e.g., car accidents, slip and fall)',
        period: '2 years',
        periodDays: 730,
        jurisdiction: 'ontario',
        category: 'personal-injury',
        triggers: [
          'From when you discovered the injury and its cause',
          'Includes injuries from negligence, assault, occupiers\' liability',
        ],
        exceptions: [
          'Minors: Clock starts when they turn 18 in many cases',
          'Incapacity: Clock may be paused if you lack capacity',
        ],
        consequence: 'After 2 years, you cannot sue for the injury.',
      },
      
      // Contract disputes
      {
        id: 'ontario-breach-of-contract',
        name: 'Breach of Contract',
        description: 'Time limit to sue for breach of a written or oral contract',
        period: '2 years',
        periodDays: 730,
        jurisdiction: 'ontario',
        category: 'contract',
        triggers: [
          'From when the breach occurred or when you discovered it',
        ],
        consequence: 'After 2 years, you cannot sue for breach of contract.',
      },
      
      // Property disputes
      {
        id: 'ontario-property-damage',
        name: 'Property Damage Claim',
        description: 'Time limit to sue for damage to your property',
        period: '2 years',
        periodDays: 730,
        jurisdiction: 'ontario',
        category: 'property',
        triggers: [
          'From when the damage occurred or when you discovered it',
        ],
        consequence: 'After 2 years, you cannot sue for property damage.',
      },
      
      // Statutory claims
      {
        id: 'ontario-human-rights-hrto',
        name: 'Human Rights Tribunal Application',
        description: 'Time limit to file a discrimination complaint at the HRTO',
        period: '1 year',
        periodDays: 365,
        jurisdiction: 'ontario',
        category: 'statutory',
        triggers: [
          'Within 1 year of the last incident of discrimination',
        ],
        exceptions: [
          'HRTO may extend the deadline if the delay was reasonable in the circumstances',
        ],
        consequence: 'After 1 year, the HRTO may refuse to hear your application.',
        learnMoreUrl: 'http://www.sjto.ca/hrto/',
      },
      
      // Absolute limitation period
      {
        id: 'ontario-ultimate-15-year',
        name: 'Ultimate Limitation Period',
        description: 'Absolute deadline regardless of discovery (with limited exceptions)',
        period: '15 years',
        periodDays: 5475,
        jurisdiction: 'ontario',
        category: 'general',
        triggers: [
          'From the date the act or omission occurred (not when discovered)',
        ],
        exceptions: [
          'Does not apply to certain sexual assault claims',
          'Does not apply to claims against estate trustees',
        ],
        consequence: 'After 15 years, no claim can be brought, even if you only discovered the harm recently.',
        learnMoreUrl: 'https://www.ontario.ca/laws/statute/02l24#BK4',
      },
    ];

    ontarioPeriods.forEach(period => {
      this.periods.set(period.id, period);
    });
  }

  /**
   * Get all limitation periods or filter by category.
   */
  getPeriods(category?: LimitationPeriod['category']): LimitationPeriod[] {
    const all = Array.from(this.periods.values());
    return category ? all.filter(p => p.category === category) : all;
  }

  /**
   * Get a specific limitation period by ID.
   */
  getPeriod(id: string): LimitationPeriod | undefined {
    return this.periods.get(id);
  }

  /**
   * Calculate deadline alert based on days remaining and limitation period.
   */
  calculateAlert(
    periodId: string,
    daysRemaining: number
  ): DeadlineAlert | null {
    const period = this.periods.get(periodId);
    if (!period) return null;

    const urgency = this.determineUrgency(daysRemaining, period.periodDays);
    const message = this.generateMessage(daysRemaining, period, urgency);
    const actionRequired = this.generateActionRequired(period, urgency);
    const encouragement = this.generateEncouragement(urgency);

    return {
      urgency,
      daysRemaining,
      limitationPeriod: period,
      message,
      actionRequired,
      encouragement,
    };
  }

  /**
   * Detect if matter description mentions municipal claims requiring 10-day notice.
   */
  detectMunicipalNotice(description: string, tags?: string[]): boolean {
    const municipalKeywords = [
      'municipal', 'municipality', 'city', 'town', 'township', 'region', 'county',
      'road', 'sidewalk', 'pothole', 'snow', 'ice', 'tree', 'branch', 'park',
    ];
    
    const lowerDesc = description.toLowerCase();
    const lowerTags = tags?.map(t => t.toLowerCase()) || [];
    
    const hasKeyword = municipalKeywords.some(kw => 
      lowerDesc.includes(kw) || lowerTags.includes(kw)
    );
    
    return hasKeyword;
  }

  /**
   * Get relevant limitation periods for a matter based on domain and description.
   * NOTE: Criminal matters do not have civil limitation periods - they are governed
   * by different timelines (disclosure, trial scheduling) set by the Crown.
   */
  getRelevantPeriods(
    domain: string,
    description: string,
    tags?: string[]
  ): LimitationPeriod[] {
    const relevant: LimitationPeriod[] = [];
    
    // Criminal matters do not have civil limitation periods
    // Criminal timelines are set by Crown counsel (disclosure, pre-trial, trial dates)
    if (domain === 'criminal') {
      return relevant; // Empty - no civil deadlines apply
    }
    
    // Always include general 2-year period for civil matters
    const general = this.periods.get('ontario-general-2-year');
    if (general) relevant.push(general);
    
    // Check for municipal notice requirement (civil property damage only)
    if (this.detectMunicipalNotice(description, tags)) {
      const municipal = this.periods.get('ontario-municipal-10-day');
      if (municipal) relevant.push(municipal);
    }
    
    // Domain-specific periods
    if (domain === 'employment') {
      const esa = this.periods.get('ontario-esa-complaint');
      const wrongful = this.periods.get('ontario-wrongful-dismissal');
      if (esa) relevant.push(esa);
      if (wrongful) relevant.push(wrongful);
    }
    
    if (domain === 'landlordTenant') {
      const ltb = this.periods.get('ontario-ltb-application');
      if (ltb) relevant.push(ltb);
    }
    
    if (domain === 'humanRights') {
      const hrto = this.periods.get('ontario-human-rights-hrto');
      if (hrto) relevant.push(hrto);
    }
    
    if (domain === 'civil-negligence' || description.toLowerCase().includes('injury')) {
      const injury = this.periods.get('ontario-personal-injury-general');
      if (injury) relevant.push(injury);
    }
    
    return relevant;
  }

  private determineUrgency(daysRemaining: number, totalDays: number): UrgencyLevel {
    if (daysRemaining < 0) return 'critical'; // Overdue
    if (daysRemaining <= 10) return 'critical';
    if (daysRemaining <= 30) return 'warning';
    if (daysRemaining <= 90) return 'caution';
    return 'info';
  }

  private generateMessage(
    daysRemaining: number,
    period: LimitationPeriod,
    urgency: UrgencyLevel
  ): string {
    if (daysRemaining < 0) {
      return `The ${period.period} deadline for "${period.name}" may have passed. You should speak with a lawyer immediately to see if any exceptions apply.`;
    }
    
    if (urgency === 'critical') {
      return `You have only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left to meet the ${period.period} deadline for "${period.name}". Action is needed urgently.`;
    }
    
    if (urgency === 'warning') {
      return `You have ${daysRemaining} days until the ${period.period} deadline for "${period.name}". It's important to act soon.`;
    }
    
    if (urgency === 'caution') {
      return `You have ${daysRemaining} days until the ${period.period} deadline for "${period.name}". You should start preparing your case.`;
    }
    
    return `You have ${daysRemaining} days until the ${period.period} deadline for "${period.name}". You have time, but don't delay.`;
  }

  private generateActionRequired(period: LimitationPeriod, urgency: UrgencyLevel): string {
    if (urgency === 'critical') {
      if (period.category === 'municipal') {
        return 'Send written notice to the municipality immediately. Include: date, location, what happened, and your contact information.';
      }
      return "File your claim or application immediately. Consider getting legal help to ensure it is done correctly.";
    }
    
    if (urgency === 'warning') {
      return 'Gather your evidence, complete necessary forms, and prepare to file your claim soon.';
    }
    
    if (urgency === 'caution') {
      return 'Start collecting evidence, identify witnesses, and research the legal process for your type of claim.';
    }
    
    return 'Keep track of dates and evidence. Review the limitation period requirements for your situation.';
  }

  private generateEncouragement(urgency: UrgencyLevel): string {
    if (urgency === 'critical') {
      return "Don't panic. Many people successfully file claims at the last minute. Focus on taking action now.";
    }
    
    if (urgency === 'warning') {
        return "You're taking the right step by looking into this now. Stay organized and you'll be ready in time.";
    }
    
    if (urgency === 'caution') {
        return "You're ahead of the game by checking this early. Use the time to build a strong case.";
    }
    
    return 'You have time to do this right. Take it step by step.';
  }
}
