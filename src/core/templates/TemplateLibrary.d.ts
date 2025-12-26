export interface DisclaimerTemplate {
    title: string;
    body: string;
}
export interface PackageTemplate {
    name: string;
    folders: string[];
    files: string[];
    notes?: string[];
}
export declare class TemplateLibrary {
    disclaimers(): DisclaimerTemplate[];
    packageLayout(): PackageTemplate;
    formattingGuidance(): string[];
    domainTemplates(): Record<string, string>;
    renderTemplate(templateId: string, context: Record<string, string | number | undefined>): string;
}
//# sourceMappingURL=TemplateLibrary.d.ts.map