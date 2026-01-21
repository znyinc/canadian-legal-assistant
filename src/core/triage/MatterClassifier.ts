import { MatterClassification, Domain, Jurisdiction, PartyType } from '../models';

export interface ClassificationInput {
  domainHint?: string;
  jurisdictionHint?: string;
  claimantType?: PartyType;
  respondentType?: PartyType;
  disputeAmount?: number;
  urgencyHint?: 'low' | 'medium' | 'high';
  keyDates?: string[]; // ISO dates
}

/**
 * Enhanced classification result with confidence scoring and uncertainty quantification
 */
export interface ClassificationResult extends MatterClassification {
  confidence: ConfidenceScore;
  uncertainties: UncertaintyFactor[];
  alternativeDomains?: Array<{ domain: Domain; confidence: number; reasoning: string }>;
}

/**
 * Confidence score breakdown for agent decision-making
 */
export interface ConfidenceScore {
  overall: number; // 0-100
  domainConfidence: number; // 0-100
  jurisdictionConfidence: number; // 0-100
  urgencyConfidence: number; // 0-100
  factors: {
    keywordMatches: number; // Number of domain keywords matched
    explicitHints: boolean; // User provided explicit hints
    multipleIndicators: boolean; // Multiple indicators point to same domain
    conflictingSignals: boolean; // Conflicting indicators detected
  };
}

/**
 * Uncertainty factors that may affect classification accuracy
 */
export interface UncertaintyFactor {
  type: 'ambiguous-domain' | 'insufficient-information' | 'overlapping-domains' | 'jurisdiction-unclear';
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export class MatterClassifier {
  classify(input: ClassificationInput): MatterClassification {
    const domain = this.resolveDomain(input.domainHint);
    const jurisdiction = this.resolveJurisdiction(input.jurisdictionHint);
    const urgency = input.urgencyHint || 'medium';

    return {
      id: `mc-${Date.now()}`,
      domain,
      jurisdiction,
      parties: {
        claimantType: input.claimantType || 'individual',
        respondentType: input.respondentType || 'business'
      },
      timeline: {
        keyDates: input.keyDates,
        start: input.keyDates?.at(0),
        end: input.keyDates?.at(-1)
      },
      urgency,
      disputeAmount: input.disputeAmount,
      status: 'classified'
    };
  }

  /**
   * Enhanced classification with confidence scoring and uncertainty quantification
   * for agent decision-making (Task 26.4.1)
   */
  classifyWithConfidence(input: ClassificationInput): ClassificationResult {
    const baseClassification = this.classify(input);
    const domainAnalysis = this.analyzeDomainConfidence(input.domainHint);
    const jurisdictionAnalysis = this.analyzeJurisdictionConfidence(input.jurisdictionHint);
    const urgencyAnalysis = this.analyzeUrgencyConfidence(input.urgencyHint);

    const confidence: ConfidenceScore = {
      overall: this.calculateOverallConfidence(domainAnalysis, jurisdictionAnalysis, urgencyAnalysis),
      domainConfidence: domainAnalysis.confidence,
      jurisdictionConfidence: jurisdictionAnalysis.confidence,
      urgencyConfidence: urgencyAnalysis.confidence,
      factors: {
        keywordMatches: domainAnalysis.keywordMatches,
        explicitHints: !!(input.domainHint || input.jurisdictionHint || input.urgencyHint),
        multipleIndicators: domainAnalysis.keywordMatches >= 2,
        conflictingSignals: domainAnalysis.alternatives.length > 1,
      },
    };

    const uncertainties = this.identifyUncertainties(input, domainAnalysis, jurisdictionAnalysis);

    return {
      ...baseClassification,
      confidence,
      uncertainties,
      alternativeDomains: domainAnalysis.alternatives,
    };
  }

  private analyzeDomainConfidence(hint?: string): {
    confidence: number;
    keywordMatches: number;
    alternatives: Array<{ domain: Domain; confidence: number; reasoning: string }>;
  } {
    if (!hint) {
      return { confidence: 30, keywordMatches: 0, alternatives: [] };
    }

    const h = hint.toLowerCase();
    const matches: Array<{ domain: Domain; keywords: string[]; weight: number }> = [];

    // Legal malpractice keywords (highest weight)
    const malpracticeKeywords = ['malpractice', 'solicitor negligence', 'lawyer negligence', 'missed limitation', 'lawpro'];
    if (malpracticeKeywords.some(kw => h.includes(kw))) {
      matches.push({ domain: 'legalMalpractice', keywords: malpracticeKeywords.filter(kw => h.includes(kw)), weight: 95 });
    }

    // Criminal keywords
    const criminalKeywords = ['criminal', 'assault', 'threat', 'arrested', 'charged', 'police'];
    if (criminalKeywords.some(kw => h.includes(kw))) {
      matches.push({ domain: 'criminal', keywords: criminalKeywords.filter(kw => h.includes(kw)), weight: 90 });
    }

    // Municipal keywords
    const municipalKeywords = ['municipal', 'city', 'road', 'sidewalk'];
    if (municipalKeywords.some(kw => h.includes(kw))) {
      matches.push({ domain: 'municipalPropertyDamage', keywords: municipalKeywords.filter(kw => h.includes(kw)), weight: 85 });
    }

    // Civil negligence keywords
    const civilKeywords = ['negligence', 'tort', 'damage', 'injury', 'slip', 'fall'];
    if (civilKeywords.some(kw => h.includes(kw))) {
      matches.push({ domain: 'civil-negligence', keywords: civilKeywords.filter(kw => h.includes(kw)), weight: 75 });
    }

    // Sort by weight and keyword count
    matches.sort((a, b) => {
      const aScore = a.weight + (a.keywords.length * 5);
      const bScore = b.weight + (b.keywords.length * 5);
      return bScore - aScore;
    });

    const primaryMatch = matches[0];
    const confidence = primaryMatch ? Math.min(100, primaryMatch.weight + (primaryMatch.keywords.length * 5)) : 30;
    const keywordMatches = primaryMatch?.keywords.length || 0;
    
    const alternatives = matches.slice(1, 3).map(m => ({
      domain: m.domain,
      confidence: Math.min(100, m.weight + (m.keywords.length * 5)),
      reasoning: `Matched ${m.keywords.length} keyword(s): ${m.keywords.join(', ')}`,
    }));

    return { confidence, keywordMatches, alternatives };
  }

  private analyzeJurisdictionConfidence(hint?: string): { confidence: number } {
    if (!hint) return { confidence: 50 }; // Default to Ontario
    const h = hint.toLowerCase();
    if (h.includes('ontario') || h.includes('on')) return { confidence: 95 };
    if (h.includes('federal') || h.includes('canada')) return { confidence: 90 };
    return { confidence: 70 }; // Other provinces
  }

  private analyzeUrgencyConfidence(hint?: 'low' | 'medium' | 'high'): { confidence: number } {
    if (!hint) return { confidence: 40 }; // Default assumption
    return { confidence: 100 }; // User explicitly stated urgency
  }

  private calculateOverallConfidence(domain: any, jurisdiction: any, urgency: any): number {
    // Weighted average: domain (50%), jurisdiction (30%), urgency (20%)
    return Math.round(
      domain.confidence * 0.5 +
      jurisdiction.confidence * 0.3 +
      urgency.confidence * 0.2
    );
  }

  private identifyUncertainties(
    input: ClassificationInput,
    domainAnalysis: any,
    jurisdictionAnalysis: any
  ): UncertaintyFactor[] {
    const uncertainties: UncertaintyFactor[] = [];

    // Ambiguous domain
    if (domainAnalysis.alternatives.length > 0) {
      uncertainties.push({
        type: 'overlapping-domains',
        description: `Multiple domains detected: ${domainAnalysis.alternatives.map((a: any) => a.domain).join(', ')}`,
        severity: domainAnalysis.alternatives.length >= 2 ? 'high' : 'medium',
        recommendation: 'Review alternative domain classifications and ask clarifying questions',
      });
    }

    // Insufficient information
    if (!input.domainHint) {
      uncertainties.push({
        type: 'insufficient-information',
        description: 'No domain hint provided; classification based on defaults',
        severity: 'high',
        recommendation: 'Collect more details about the legal issue to improve classification accuracy',
      });
    }

    // Low confidence
    if (domainAnalysis.confidence < 50) {
      uncertainties.push({
        type: 'ambiguous-domain',
        description: `Low confidence (${domainAnalysis.confidence}%) in domain classification`,
        severity: 'high',
        recommendation: 'Request additional details or keywords to clarify the legal domain',
      });
    }

    // Jurisdiction unclear
    if (jurisdictionAnalysis.confidence < 70) {
      uncertainties.push({
        type: 'jurisdiction-unclear',
        description: 'Jurisdiction not clearly specified',
        severity: 'medium',
        recommendation: 'Confirm the jurisdiction (Ontario, Federal, etc.) with the user',
      });
    }

    return uncertainties;
  }

  private resolveDomain(hint?: string): Domain {
    if (!hint) return 'other';
    const h = hint.toLowerCase();
    
    // Legal malpractice (check FIRST to avoid confusion with underlying civil/criminal matters)
    if (h.includes('malpractice') || h.includes('solicitor negligence') || 
      h.includes('lawyer negligence') || h.includes('professional negligence') ||
      h.includes('missed limitation') || h.includes('missed deadline') ||
      h.includes('missed filing') || h.includes('missed court filing') ||
      h.includes('missed court date') || h.includes('failed to file') ||
      h.includes('failed to serve') || h.includes('lawyer missed') ||
      h.includes('lawyer error') || h.includes('attorney error') ||
      h.includes('lawyer mistake') || h.includes('legal error') ||
      h.includes('professional misconduct') ||
      h.includes('retainer') && h.includes('breach') ||
      h.includes('lawpro') || h.includes('case within a case')) return 'legalMalpractice';

      // Estate and succession (probate, wills, dependant support)
      if (h.includes('estate') || h.includes('probate') || h.includes('succession') ||
        h.includes('will challenge') || h.includes('will_challenge') || h.includes('inheritance') ||
        h.includes('dependant support') || h.includes('dependant_support') || h.includes('estate trustee')) {
        return 'estateSuccession';
      }
    
    // Criminal matters (police-involved, charges laid, assault, threats, etc.)
    if (h.includes('criminal') || h.includes('assault') || h.includes('threat') || 
        h.includes('uttering') || h.includes('violence') || h.includes('arrested') ||
        h.includes('charged') || h.includes('police') || h.includes('crown')) return 'criminal';
    
    // Municipal property damage (check before civil-negligence to avoid "damage" keyword overlap)
    if (h.includes('municipal') || h.includes('city') || h.includes('road') ||
        h.includes('sidewalk') || h.includes('notice')) return 'municipalPropertyDamage';
    
    // Civil negligence and property damage
    if (h === 'civil-negligence' || h.includes('negligence') || h.includes('tort') ||
        h.includes('tree') || h.includes('damage') || h.includes('injury') ||
        h.includes('slip') || h.includes('fall')) return 'civil-negligence';
    
    // Landlord-tenant
    if (h.includes('tenant') || h.includes('ltb') || h.includes('landlord') ||
        h.includes('eviction') || h.includes('rent')) return 'landlordTenant';
    
    // Insurance
    if (h.includes('insurance') || h.includes('claim') || h.includes('policy')) return 'insurance';
    
    // Employment
    if (h.includes('employment') || h.includes('work') || h.includes('termination') ||
        h.includes('severance') || h.includes('dismissal')) return 'employment';
    
    // Human rights
    if (h.includes('human rights') || h.includes('hrto') || h.includes('discrimination') ||
        h.includes('harassment')) return 'humanRights';
    
    // Consumer protection
    if (h.includes('consumer') || h.includes('refund') || h.includes('warranty') || 
        h.includes('service') || h.includes('unfair') || h.includes('chargeback')) return 'consumerProtection';
    
    return 'other';
  }

  private resolveJurisdiction(hint?: string): Jurisdiction {
    if (!hint) return 'Ontario';
    const h = hint.toLowerCase();
    if (h.includes('federal') || h.includes('canada')) return 'Federal';
    if (h.includes('ontario') || h.includes('on')) return 'Ontario';
    return hint as Jurisdiction;
  }
}
