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
    if (h === 'civil-negligence' || h.includes('negligence') || h.includes('tort')) return 'civil-negligence';
    if (h.includes('tenant') || h.includes('ltb') || h.includes('landlord')) return 'landlordTenant';
    if (h.includes('insurance') || h.includes('claim')) return 'insurance';
    if (h.includes('employment') || h.includes('work')) return 'employment';
    if (h.includes('human rights') || h.includes('hrto')) return 'humanRights';
    if (h.includes('consumer') || h.includes('refund') || h.includes('warranty') || h.includes('service') || h.includes('unfair') || h.includes('chargeback')) return 'consumerProtection';
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
