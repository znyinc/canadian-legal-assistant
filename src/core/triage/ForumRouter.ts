import { ForumMap, AuthorityRef, Jurisdiction, Domain } from '../models';
import { AuthorityRegistry } from '../authority/AuthorityRegistry';

export interface RoutingInput {
  domain: Domain;
  jurisdiction: Jurisdiction;
  disputeAmount?: number;
  subjectMatter?: string;
  relief?: string;
  isAppeal?: boolean;
  isJudicialReview?: boolean;
}

export class ForumRouter {
  constructor(private registry: AuthorityRegistry) {}

  route(input: RoutingInput): ForumMap {
    const primary = this.primaryForum(input);
    const escalation = this.registry
      .getEscalationRoute(primary.id)
      .map((a) => ({ id: a.id, name: a.name, type: a.type, jurisdiction: a.jurisdiction }));
    const alternatives: AuthorityRef[] = this.alternatives(input, primary);
    const rationale = this.buildRationale(input, primary, escalation, alternatives);

    return {
      domain: input.domain,
      primaryForum: primary,
      alternatives,
      escalation,
      rationale
    };
  }

  private primaryForum(input: RoutingInput): AuthorityRef {
    // Criminal matters go to Ontario Court of Justice
    if (input.domain === 'criminal') {
      return this.mustGet('ON-OCJ');
    }

    // Estates and succession matters route to the probate branch of the Superior Court
    if (input.domain === 'estateSuccession') {
      return this.mustGet('ON-SC-Probate');
    }

    // Tribunal prioritization for LTB and HRTO
    if (input.domain === 'landlordTenant') {
      return this.mustGet('ON-LTB');
    }
    if (input.domain === 'humanRights') {
      return this.mustGet('ON-HRTO');
    }

    // Appeal and judicial review routing
    if (input.isAppeal) {
      if (input.jurisdiction === 'Ontario') return this.mustGet('ON-CA');
      return this.mustGet('CA-FCA');
    }
    if (input.isJudicialReview) {
      if (input.jurisdiction === 'Ontario') return this.mustGet('ON-DivCt');
      return this.mustGet('CA-FC');
    }

    // Court level by amount (Ontario heuristic updated for $50,000 Small Claims limit)
    if (input.jurisdiction === 'Ontario') {
      const amount = input.disputeAmount || 0;
      if (amount <= 50000) return this.mustGet('ON-SMALL');
      return this.mustGet('ON-SC');
    }

    // Federal default
    return this.mustGet('CA-FC');
  }

  private alternatives(input: RoutingInput, primary: AuthorityRef): AuthorityRef[] {
    const alts: AuthorityRef[] = [];
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

  private mustGet(id: string): AuthorityRef {
    const a = this.registry.getById(id);
    if (!a) throw new Error(`Authority ${id} not found`);
    return { id: a.id, name: a.name, type: a.type, jurisdiction: a.jurisdiction };
  }

  private buildRationale(
    input: RoutingInput,
    primary: AuthorityRef,
    escalation: AuthorityRef[],
    alternatives: AuthorityRef[]
  ): string {
    const notes: string[] = [];

    if (input.domain === 'landlordTenant') {
      notes.push('Housing matters in Ontario route to the Landlord and Tenant Board first.');
    }
    if (input.domain === 'humanRights') {
      notes.push('Human rights applications start at the HRTO before any court review.');
    }

    if (input.isAppeal) {
      notes.push('Appeal flagged; routing directly to an appeal court.');
    } else if (input.isJudicialReview) {
      notes.push('Judicial review requested; routing to the reviewing court.');
    } else if (input.jurisdiction === 'Ontario') {
      const amount = input.disputeAmount || 0;
      if (amount <= 50000) {
        notes.push('Claim amount within Small Claims Court monetary threshold in Ontario ($50,000).');
      } else {
        notes.push('Higher-value claim defaults to Superior Court of Justice in Ontario.');
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
