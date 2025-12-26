import { EvidenceItem, EvidenceIndex, SourceEntry } from '../models';
import { EvidenceType } from '../models';
export interface IndexingOptions {
    sources?: SourceEntry[];
    tags?: string[];
}
export declare class EvidenceIndexer {
    indexItems: EvidenceItem[];
    sources: SourceEntry[];
    addItem(filename: string, content: Buffer, type: EvidenceType, provenance: EvidenceItem['provenance'], options?: IndexingOptions): EvidenceItem;
    setSources(sources: SourceEntry[]): void;
    generateIndex(): EvidenceIndex;
    private hashContent;
    private computeCredibility;
}
//# sourceMappingURL=EvidenceIndexer.d.ts.map