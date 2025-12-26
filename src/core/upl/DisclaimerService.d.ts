export interface PathwayOption {
    label: string;
    steps: string[];
    caveats?: string[];
}
export interface DisclaimerContext {
    jurisdiction?: string;
    domain?: string;
    audience?: 'self-represented' | 'lawyer' | 'advocate';
}
export declare class DisclaimerService {
    legalInformationDisclaimer(ctx: DisclaimerContext): string;
    multiPathwayPresentation(options: PathwayOption[]): string;
    redirectAdviceRequest(userText: string): {
        redirected: boolean;
        message: string;
    };
}
//# sourceMappingURL=DisclaimerService.d.ts.map