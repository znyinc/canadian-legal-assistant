import { EvidenceIndex, EvidenceManifest, EvidenceManifestItem, SourceEntry, SourceManifest } from '../models';

export class ManifestBuilder {
  buildSourceManifest(entries: SourceEntry[], notes?: string[]): SourceManifest {
    return {
      entries,
      compiledAt: new Date().toISOString(),
      notes
    };
  }

  buildEvidenceManifest(index: EvidenceIndex, notes?: string[]): EvidenceManifest {
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
      compiledAt: new Date().toISOString(),
      notes
    };
  }
}
