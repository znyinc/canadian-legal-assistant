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
