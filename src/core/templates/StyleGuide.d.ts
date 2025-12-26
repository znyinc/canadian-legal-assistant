export interface StyleCheck {
    ok: boolean;
    warnings: string[];
}
export declare class StyleGuide {
    rules(): string[];
    check(text: string): StyleCheck;
}
//# sourceMappingURL=StyleGuide.d.ts.map