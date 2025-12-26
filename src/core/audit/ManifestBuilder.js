export class ManifestBuilder {
    buildSourceManifest(entries, notes) {
        return {
            entries,
            compiledAt: new Date().toISOString(),
            notes
        };
    }
    buildEvidenceManifest(index, notes) {
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
            compiledAt: new Date().toISOString(),
            notes
        };
    }
}
//# sourceMappingURL=ManifestBuilder.js.map