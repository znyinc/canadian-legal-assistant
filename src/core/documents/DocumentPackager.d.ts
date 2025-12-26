import { TemplateLibrary } from '../templates/TemplateLibrary';
import { DocumentDraft, DocumentPackage, SourceManifest, EvidenceManifest } from '../models';
export interface PackageInput {
    packageName: string;
    forumMap: string;
    timeline: string;
    missingEvidenceChecklist: string;
    drafts: DocumentDraft[];
    sourceManifest: SourceManifest;
    evidenceManifest: EvidenceManifest;
}
export declare class DocumentPackager {
    private templates;
    constructor(templates?: TemplateLibrary);
    assemble(input: PackageInput): DocumentPackage;
    private renderDraft;
    private slugify;
}
//# sourceMappingURL=DocumentPackager.d.ts.map