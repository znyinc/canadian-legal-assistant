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

  private resolveDomain(hint?: string): Domain {
    if (!hint) return 'other';
    const h = hint.toLowerCase();
    
    // Criminal matters (police-involved, charges laid, assault, threats, etc.)
    if (h.includes('criminal') || h.includes('assault') || h.includes('threat') || 
        h.includes('uttering') || h.includes('violence') || h.includes('arrested') ||
        h.includes('charged') || h.includes('police') || h.includes('crown')) return 'criminal';
    
    // Municipal property damage (check before civil-negligence to avoid "damage" keyword overlap)
    if (h.includes('municipal') || h.includes('city') || h.includes('road') ||
        h.includes('sidewalk') || h.includes('notice')) return 'municipalPropertyDamage';
    
    // Civil negligence and property damage
    if (h === 'civil-negligence' || h.includes('negligence') || h.includes('tort') ||
        h.includes('tree') || h.includes('damage') || h.includes('injury')) return 'civil-negligence';
    
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
