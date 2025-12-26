import { createHash } from 'crypto';
import { EvidenceItem, EvidenceIndex, SourceEntry } from '../models';
import { EvidenceMetadata, extractMetadata } from './MetadataExtractor';
import { EvidenceType } from '../models';

export interface IndexingOptions {
  sources?: SourceEntry[];
  tags?: string[];
}

export class EvidenceIndexer {
  indexItems: EvidenceItem[] = [];
  sources: SourceEntry[] = [];

  addItem(
    filename: string,
    content: Buffer,
    type: EvidenceType,
    provenance: EvidenceItem['provenance'],
    options?: IndexingOptions
  ): EvidenceItem {
    const hash = this.hashContent(content);
    const metadata = extractMetadata(type, content);
    const credibility = this.computeCredibility(provenance, metadata);

    const item: EvidenceItem = {
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

  setSources(sources: SourceEntry[]): void {
    this.sources = sources;
  }

  generateIndex(): EvidenceIndex {
    return {
      items: this.indexItems,
      generatedAt: new Date().toISOString(),
      sourceManifest: { 
        entries: this.sources,
        compiledAt: new Date().toISOString()
      }
    };
  }

  private hashContent(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private computeCredibility(provenance: string, metadata: EvidenceMetadata): number {
    let score = 0.5; // Baseline

    // Provenance boost
    if (provenance === 'official-api') score += 0.3;
    else if (provenance === 'official-link') score += 0.25;
    else if (provenance === 'user-provided') score += 0.1;

    // Metadata completeness boost
    if (metadata.date) score += 0.1;
    if (metadata.sender || metadata.recipient) score += 0.1;
    if (metadata.subject) score += 0.05;

    return Math.min(score, 1.0);
  }
}
