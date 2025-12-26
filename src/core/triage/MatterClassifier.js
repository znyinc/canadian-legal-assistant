export class MatterClassifier {
    classify(input) {
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
    resolveDomain(hint) {
        if (!hint)
            return 'other';
        const h = hint.toLowerCase();
        if (h === 'civil-negligence' || h.includes('negligence') || h.includes('tort'))
            return 'civil-negligence';
        if (h.includes('tenant') || h.includes('ltb') || h.includes('landlord'))
            return 'landlordTenant';
        if (h.includes('insurance') || h.includes('claim'))
            return 'insurance';
        if (h.includes('employment') || h.includes('work'))
            return 'employment';
        if (h.includes('human rights') || h.includes('hrto'))
            return 'humanRights';
        return 'other';
    }
    resolveJurisdiction(hint) {
        if (!hint)
            return 'Ontario';
        const h = hint.toLowerCase();
        if (h.includes('federal') || h.includes('canada'))
            return 'Federal';
        if (h.includes('ontario') || h.includes('on'))
            return 'Ontario';
        return hint;
    }
}
//# sourceMappingURL=MatterClassifier.js.map