import { DocumentDraftingEngine } from '../documents/DocumentDraftingEngine';
import { DocumentPackager } from '../documents/DocumentPackager';
import { DomainModule, DomainModuleInput, DomainModuleOutput, DocumentDraft, EvidenceIndex, EvidenceManifest } from '../models';
export declare abstract class BaseDomainModule implements DomainModule {
    abstract domain: DomainModule['domain'];
    protected drafting: DocumentDraftingEngine;
    protected packager: DocumentPackager;
    constructor(options?: {
        drafting?: DocumentDraftingEngine;
        packager?: DocumentPackager;
    });
    generate(input: DomainModuleInput): DomainModuleOutput;
    protected abstract buildDrafts(input: DomainModuleInput): DocumentDraft[];
    protected buildEvidenceManifest(index: EvidenceIndex): EvidenceManifest;
    private ensureSourceManifest;
}
//# sourceMappingURL=BaseDomainModule.d.ts.map