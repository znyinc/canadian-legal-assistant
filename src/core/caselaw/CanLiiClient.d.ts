import { SourceAccessController } from '../access/SourceAccessController';
import { SourceAccessPolicy } from '../models';
export interface CaseMetadata {
    caseId: string;
    title: string;
    court: string;
    decisionDate: string;
    citation?: string;
    url: string;
}
export interface CaseSearchResult {
    caseId: string;
    caseName: string;
    year: number;
    court: string;
    canliiId: string;
    url: string;
    summary?: string;
    relevance?: number;
}
export interface CanLiiConfig {
    apiKey?: string;
}
export declare class CanLiiClient {
    private access;
    private cfg;
    constructor(access: SourceAccessController, cfg?: CanLiiConfig);
    setPolicy(policy: SourceAccessPolicy): void;
    searchCases(query: string): Promise<CaseSearchResult[]>;
    fetchCaseMetadata(query: string): Promise<{
        ok: boolean;
        metadata?: CaseMetadata;
        error?: string;
    }>;
    private extractYear;
}
//# sourceMappingURL=CanLiiClient.d.ts.map