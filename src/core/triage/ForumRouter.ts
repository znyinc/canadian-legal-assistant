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
    const escalation = this.registry.getEscalationRoute(primary.id);
    const alternatives: AuthorityRef[] = this.alternatives(input, primary);

    return {
      domain: input.domain,
      primaryForum: primary,
      alternatives,
      escalation
    };
  }

  private primaryForum(input: RoutingInput): AuthorityRef {
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

    // Court level by amount (Ontario heuristic)
    if (input.jurisdiction === 'Ontario') {
      if ((input.disputeAmount || 0) <= 35000) return this.mustGet('ON-SC');
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
}
