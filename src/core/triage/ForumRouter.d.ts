import { ForumMap, Jurisdiction, Domain } from '../models';
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
export declare class ForumRouter {
    private registry;
    constructor(registry: AuthorityRegistry);
    route(input: RoutingInput): ForumMap;
    private primaryForum;
    private alternatives;
    private mustGet;
    private buildRationale;
}
//# sourceMappingURL=ForumRouter.d.ts.map