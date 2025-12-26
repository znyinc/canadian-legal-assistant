export interface CitationCheckResult {
    ok: boolean;
    errors: string[];
    warnings: string[];
}
export declare class CitationEnforcer {
    ensureCitations(text: string, hasCitation: boolean): CitationCheckResult;
    verifyRetrieval(retrievalDate?: string): CitationCheckResult;
}
//# sourceMappingURL=CitationEnforcer.d.ts.map