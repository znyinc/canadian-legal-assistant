import { DocumentDraftingEngine } from '../documents/DocumentDraftingEngine';
import { DocumentPackager } from '../documents/DocumentPackager';
export class BaseDomainModule {
    drafting;
    packager;
    constructor(options) {
        this.drafting = options?.drafting ?? new DocumentDraftingEngine();
        this.packager = options?.packager ?? new DocumentPackager();
    }
    generate(input) {
        const drafts = this.buildDrafts(input);
        const evidenceManifest = input.evidenceManifest ?? this.buildEvidenceManifest(input.evidenceIndex);
        const sourceManifest = this.ensureSourceManifest(input.sourceManifest);
        const pkg = this.packager.assemble({
            packageName: input.packageName || `${this.domain}-package`,
            forumMap: input.forumMap,
            timeline: input.timeline,
            missingEvidenceChecklist: input.missingEvidence,
            drafts,
            sourceManifest,
            evidenceManifest
        });
        const warnings = [pkg.warnings || [], drafts.flatMap((d) => d.missingConfirmations || [])]
            .flat()
            .filter(Boolean);
        return {
            drafts,
            package: pkg,
            warnings: warnings.length ? warnings : undefined
        };
    }
    buildEvidenceManifest(index) {
        const items = index.items.map((item) => ({
            id: item.id,
            filename: item.filename,
            type: item.type,
            hash: item.hash,
            provenance: item.provenance,
            credibilityScore: item.credibilityScore,
            date: item.date
        }));
        return {
            items,
            compiledAt: new Date().toISOString()
        };
    }
    ensureSourceManifest(manifest) {
        if (manifest.compiledAt)
            return manifest;
        return { ...manifest, compiledAt: new Date().toISOString() };
    }
}
//# sourceMappingURL=BaseDomainModule.js.map