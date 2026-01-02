import { DocumentDraftingEngine } from '../documents/DocumentDraftingEngine';
import { DocumentPackager } from '../documents/DocumentPackager';
import {
  DomainModule,
  DomainModuleInput,
  DomainModuleOutput,
  DocumentDraft,
  DocumentPackage,
  EvidenceIndex,
  EvidenceManifest,
  EvidenceManifestItem,
  SourceManifest
} from '../models';

export abstract class BaseDomainModule implements DomainModule {
  abstract domain: DomainModule['domain'];
  protected drafting: DocumentDraftingEngine;
  protected packager: DocumentPackager;

  constructor(options?: { drafting?: DocumentDraftingEngine; packager?: DocumentPackager }) {
    this.drafting = options?.drafting ?? new DocumentDraftingEngine();
    this.packager = options?.packager ?? new DocumentPackager();
  }

  generate(input: DomainModuleInput): DomainModuleOutput {
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
      evidenceManifest,
      jurisdiction: input.classification.jurisdiction,
      domain: input.classification.domain,
      formMappings: input.formMappings,
      matterId: input.matterId
    });

    const warnings = [pkg.warnings || [], drafts.flatMap((d) => d.missingConfirmations || [])]
      .flat()
      .filter(Boolean) as string[];

    return {
      drafts,
      package: pkg,
      warnings: warnings.length ? warnings : undefined
    };
  }

  protected abstract buildDrafts(input: DomainModuleInput): DocumentDraft[];

  protected buildEvidenceManifest(index: EvidenceIndex): EvidenceManifest {
    const items: EvidenceManifestItem[] = index.items.map((item) => ({
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

  private ensureSourceManifest(manifest: SourceManifest): SourceManifest {
    if (manifest.compiledAt) return manifest;
    return { ...manifest, compiledAt: new Date().toISOString() };
  }
}
