import { createHash } from 'crypto';
import { extractMetadata } from './MetadataExtractor';
export class EvidenceIndexer {
    indexItems = [];
    sources = [];
    addItem(filename, content, type, provenance, options) {
        const hash = this.hashContent(content);
        const metadata = extractMetadata(type, content);
        const credibility = this.computeCredibility(provenance, metadata);
        const item = {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            filename,
            type,
            date: metadata.date,
            summary: metadata.summary || `${type} file: ${filename}`,
            provenance,
            hash,
            tags: options?.tags,
            credibilityScore: credibility
        };
        this.indexItems.push(item);
        return item;
    }
    setSources(sources) {
        this.sources = sources;
    }
    generateIndex() {
        return {
            items: this.indexItems,
            generatedAt: new Date().toISOString(),
            sourceManifest: { sources: this.sources }
        };
    }
    hashContent(content) {
        return createHash('sha256').update(content).digest('hex');
    }
    computeCredibility(provenance, metadata) {
        let score = 0.5; // Baseline
        // Provenance boost
        if (provenance === 'official-api')
            score += 0.3;
        else if (provenance === 'official-link')
            score += 0.25;
        else if (provenance === 'user-provided')
            score += 0.1;
        // Metadata completeness boost
        if (metadata.date)
            score += 0.1;
        if (metadata.sender || metadata.recipient)
            score += 0.1;
        if (metadata.subject)
            score += 0.05;
        return Math.min(score, 1.0);
    }
}
//# sourceMappingURL=EvidenceIndexer.js.map