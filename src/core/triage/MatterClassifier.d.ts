import { MatterClassification, PartyType } from '../models';
export interface ClassificationInput {
    domainHint?: string;
    jurisdictionHint?: string;
    claimantType?: PartyType;
    respondentType?: PartyType;
    disputeAmount?: number;
    urgencyHint?: 'low' | 'medium' | 'high';
    keyDates?: string[];
}
export declare class MatterClassifier {
    classify(input: ClassificationInput): MatterClassification;
    private resolveDomain;
    private resolveJurisdiction;
}
//# sourceMappingURL=MatterClassifier.d.ts.map