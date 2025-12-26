export class ForumRouter {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    route(input) {
        const primary = this.primaryForum(input);
        const escalation = this.registry
            .getEscalationRoute(primary.id)
            .map((a) => ({ id: a.id, name: a.name, type: a.type, jurisdiction: a.jurisdiction }));
        const alternatives = this.alternatives(input, primary);
        const rationale = this.buildRationale(input, primary, escalation, alternatives);
        return {
            domain: input.domain,
            primaryForum: primary,
            alternatives,
            escalation,
            rationale
        };
    }
    primaryForum(input) {
        // Tribunal prioritization for LTB and HRTO
        if (input.domain === 'landlordTenant') {
            return this.mustGet('ON-LTB');
        }
        if (input.domain === 'humanRights') {
            return this.mustGet('ON-HRTO');
        }
        // Appeal and judicial review routing
        if (input.isAppeal) {
            if (input.jurisdiction === 'Ontario')
                return this.mustGet('ON-CA');
            return this.mustGet('CA-FCA');
        }
        if (input.isJudicialReview) {
            if (input.jurisdiction === 'Ontario')
                return this.mustGet('ON-DivCt');
            return this.mustGet('CA-FC');
        }
        // Court level by amount (Ontario heuristic)
        if (input.jurisdiction === 'Ontario') {
            if ((input.disputeAmount || 0) <= 35000)
                return this.mustGet('ON-SC');
            return this.mustGet('ON-SC');
        }
        // Federal default
        return this.mustGet('CA-FC');
    }
    alternatives(input, primary) {
        const alts = [];
        if (primary.id === 'ON-LTB') {
            alts.push(this.mustGet('ON-DivCt')); // judicial review as fallback
        }
        if (primary.id === 'ON-HRTO') {
            alts.push(this.mustGet('ON-DivCt'));
        }
        if (primary.id === 'CA-FC') {
            alts.push(this.mustGet('CA-FCA'));
        }
        return alts;
    }
    mustGet(id) {
        const a = this.registry.getById(id);
        if (!a)
            throw new Error(`Authority ${id} not found`);
        return { id: a.id, name: a.name, type: a.type, jurisdiction: a.jurisdiction };
    }
    buildRationale(input, primary, escalation, alternatives) {
        const notes = [];
        if (input.domain === 'landlordTenant') {
            notes.push('Housing matters in Ontario route to the Landlord and Tenant Board first.');
        }
        if (input.domain === 'humanRights') {
            notes.push('Human rights applications start at the HRTO before any court review.');
        }
        if (input.isAppeal) {
            notes.push('Appeal flagged; routing directly to an appeal court.');
        }
        else if (input.isJudicialReview) {
            notes.push('Judicial review requested; routing to the reviewing court.');
        }
        else if (input.jurisdiction === 'Ontario') {
            if ((input.disputeAmount || 0) <= 35000) {
                notes.push('Claim amount within Small Claims Court monetary threshold in Ontario.');
            }
            else {
                notes.push('Higher-value claim defaults to Superior Court in Ontario.');
            }
        }
        if (alternatives.length) {
            notes.push('Alternative forum provided for review or secondary path.');
        }
        if (escalation.length) {
            notes.push('Escalation route available for appeals or judicial review.');
        }
        return notes.join(' ');
    }
}
//# sourceMappingURL=ForumRouter.js.map